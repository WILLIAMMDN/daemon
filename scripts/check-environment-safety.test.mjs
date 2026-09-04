import test from "node:test";
import assert from "node:assert/strict";
import {
  inspectDeploymentControl,
  inspectEnvironmentVariables,
  inspectStaticDocuments,
  parseDotenv,
} from "./check-environment-safety.mjs";

test("acepta Laravel testing con SQLite en memoria y Firebase demo", () => {
  const values = parseDotenv(`
APP_ENV=testing
DAEMON_ENVIRONMENT=testing
DB_CONNECTION=sqlite
DB_DATABASE=:memory:
FIREBASE_PROJECT_ID=demo-daemon-test
`);

  assert.deepEqual(inspectEnvironmentVariables(values), []);
});

test("bloquea Laravel local apuntando al PostgreSQL productivo", () => {
  const issues = inspectEnvironmentVariables({
    APP_ENV: "local",
    DB_CONNECTION: "pgsql",
    DB_HOST: "aws-1-sa-east-1.pooler.supabase.com",
    DB_DATABASE: "postgres",
  });

  assert.ok(issues.some((issue) => issue.includes("DB_HOST")));
  assert.ok(issues.some((issue) => issue.includes("no es loopback")));
});

test("bloquea Firebase productivo durante tests", () => {
  const issues = inspectEnvironmentVariables({
    APP_ENV: "testing",
    DB_CONNECTION: "sqlite",
    DB_DATABASE: ":memory:",
    FIREBASE_PROJECT_ID: "daemon-a41f8",
  });

  assert.ok(issues.some((issue) => issue.includes("Firebase de produccion")));
  assert.ok(issues.some((issue) => issue.includes("proyecto demo")));
});

test("bloquea staging si comparte bucket productivo", () => {
  const issues = inspectEnvironmentVariables({
    APP_ENV: "staging",
    DB_CONNECTION: "pgsql",
    DB_HOST: "staging-db.internal",
    SUPABASE_STORAGE_BUCKET: "daemon-assets",
    SUPABASE_PRIVATE_STORAGE_BUCKET: "daemon-private",
  });

  assert.equal(issues.filter((issue) => issue.includes("staging")).length, 2);
});

test("bloquea cualquier operacion destructiva contra produccion", () => {
  const issues = inspectEnvironmentVariables(
    {
      APP_ENV: "production",
      DAEMON_ENVIRONMENT: "production",
      DB_CONNECTION: "pgsql",
      DB_HOST: "database.internal",
    },
    { operation: "destructive" },
  );

  assert.ok(issues.some((issue) => issue.includes("operacion destructiva")));
});

test("bloquea un APP_ENV productivo implicito en una maquina local", () => {
  const issues = inspectEnvironmentVariables({ APP_ENV: "production" });

  assert.ok(issues.some((issue) => issue.includes("DAEMON_ENVIRONMENT")));
});

test("solo permite lectura productiva desde local con autorizacion explicita", () => {
  const values = {
    APP_ENV: "local",
    DAEMON_ENVIRONMENT: "development",
    DB_CONNECTION: "sqlite",
    DB_DATABASE: ":memory:",
    API_URL: "https://daemon-5vo1.onrender.com/api/v1",
    FIREBASE_PROJECT_ID: "demo-daemon-local",
  };

  assert.ok(inspectEnvironmentVariables(values).length > 0);
  assert.deepEqual(
    inspectEnvironmentVariables(values, {
      operation: "read",
      allowProductionRead: true,
    }),
    [],
  );
});

test("acepta frontend development conectado a produccion de forma coherente", () => {
  const issues = inspectStaticDocuments({
    environment: "export { environment } from './environment.development';",
    development: `
apiUrl: 'https://daemon-5vo1.onrender.com/api/v1'
projectId: 'daemon-a41f8'
url: 'https://lbxdcvsrmkkynttgwblc.supabase.co'
enabled: false
firebaseEmulators: { enabled: false }
`,
    staging: "",
    production: "",
    backendExample: "",
    backendTesting: "",
    angular: "{}",
    packageJson: "{}",
    firebaseRc: "{}",
    playwright: "",
    composer: "",
    renderStaging: "",
    prWorkflow: "",
  });

  const developmentIssues = issues.filter((issue) =>
    issue.startsWith("Frontend development"),
  );
  assert.deepEqual(developmentIssues, []);
});

test("bloquea frontend development que mezcla produccion con emulador demo", () => {
  const issues = inspectStaticDocuments({
    environment: "export { environment } from './environment.development';",
    development: `
apiUrl: 'https://daemon-5vo1.onrender.com/api/v1'
projectId: 'demo-daemon-local'
enabled: true
`,
    staging: "",
    production: "",
    backendExample: "",
    backendTesting: "",
    angular: "{}",
    packageJson: "{}",
    firebaseRc: "{}",
    playwright: "",
    composer: "",
    renderStaging: "",
    prWorkflow: "",
  });

  assert.ok(issues.some((issue) => issue.startsWith("Frontend development")));
});

// --- Control de despliegue productivo -------------------------------------
// El despliegue productivo es automatico: un commit en main protegida llega a
// produccion sin intervencion. Estas pruebas fallan si el repositorio pierde
// esa automatizacion, o si la pierde la verificacion que la hace segura.

const DEPLOY_PRODUCTION = `
on:
  push:
    branches:
      - main
  workflow_dispatch:
concurrency:
  group: production-daemon
  cancel-in-progress: false
jobs:
  guard:
    steps:
      - run: git merge-base --is-ancestor "$target" refs/remotes/origin/main
  preflight:
    steps:
      - run: gh api repos/x/actions/workflows/supabase-backup.yml/runs
      - run: node scripts/check-environment-safety.mjs --ci
  deploy:
    environment:
      name: production
    steps:
      - run: curl "$BACKEND_HEALTH_URL" | jq -r '.commit'
      - run: npx firebase-tools deploy --only hosting:arc --project daemon-a41f8
      - run: grep -o 'daemon-release' page.html
  smoke:
    steps:
      - run: ./scripts/smoke-produccion.ps1 -ExpectedRelease $env:TARGET_SHA
  record:
    if: always()
    steps:
      - run: echo "no completo todas sus etapas"
`;

const CONTROL_SANO = {
  workflows: { "deploy-production.yml": DEPLOY_PRODUCTION },
  render: "    autoDeployTrigger: checksPass\n",
  backendEntrypoint:
    "MIGRATED_MARKER=bootstrap/cache/.migrated\n" +
    "if ! php artisan migrate --force --no-interaction; then\n" +
    "    exit 1\n" +
    "fi\n",
};

test("acepta un despliegue productivo automatico y verificado", () => {
  assert.deepEqual(inspectDeploymentControl(CONTROL_SANO), []);
});

test("bloquea la ausencia del workflow de despliegue productivo", () => {
  const issues = inspectDeploymentControl({ ...CONTROL_SANO, workflows: {} });

  assert.ok(issues.some((issue) => issue.includes("deploy-production.yml")));
});

test("bloquea que el merge a main deje de desplegar produccion", () => {
  const issues = inspectDeploymentControl({
    ...CONTROL_SANO,
    workflows: {
      "deploy-production.yml": DEPLOY_PRODUCTION.replace(
        "  push:\n    branches:\n      - main\n",
        "",
      ),
    },
  });

  assert.ok(
    issues.some((issue) => issue.includes("aterrizar un commit en main")),
  );
});

test("bloquea la perdida del disparo manual para rollback", () => {
  const issues = inspectDeploymentControl({
    ...CONTROL_SANO,
    workflows: {
      "deploy-production.yml": DEPLOY_PRODUCTION.replace(
        "  workflow_dispatch:\n",
        "",
      ),
    },
  });

  assert.ok(issues.some((issue) => issue.includes("rollback")));
});

test("bloquea otro workflow que publique produccion por su cuenta", () => {
  const issues = inspectDeploymentControl({
    ...CONTROL_SANO,
    workflows: {
      ...CONTROL_SANO.workflows,
      "firebase-hosting-merge.yml":
        "on:\n  push:\n    branches:\n      - main\njobs:\n  build_and_deploy:\n    steps:\n      - run: firebase deploy --only hosting:arc --project daemon-a41f8\n",
    },
  });

  assert.ok(
    issues.some((issue) => issue.includes("fuera de deploy-production.yml")),
  );
});

test("bloquea un deploy hook de Render disparado desde otro workflow", () => {
  const issues = inspectDeploymentControl({
    ...CONTROL_SANO,
    workflows: {
      ...CONTROL_SANO.workflows,
      "render-on-merge.yml":
        'on:\n  push:\n    branches: [main]\njobs:\n  deploy:\n    steps:\n      - run: curl -X POST "$RENDER_DEPLOY_HOOK_URL"\n',
    },
  });

  assert.ok(
    issues.some((issue) => issue.includes("fuera de deploy-production.yml")),
  );
});

test("bloquea un despliegue productivo sin serializacion", () => {
  const issues = inspectDeploymentControl({
    ...CONTROL_SANO,
    workflows: {
      "deploy-production.yml": DEPLOY_PRODUCTION.replace(
        "group: production-daemon",
        "group: cualquiera",
      ),
    },
  });

  assert.ok(issues.some((issue) => issue.includes("grupo de concurrencia")));
});

test("bloquea un despliegue sin SHA exacto ni punto de recuperacion", () => {
  const issues = inspectDeploymentControl({
    ...CONTROL_SANO,
    workflows: {
      "deploy-production.yml": DEPLOY_PRODUCTION.replace(
        /^.*(merge-base|supabase-backup).*$/gm,
        "",
      ),
    },
  });

  assert.ok(issues.some((issue) => issue.includes("alcanzable desde main")));
  assert.ok(
    issues.some((issue) => issue.includes("punto de recuperacion verificado")),
  );
});

test("bloquea un despliegue productivo sin environment ni registro", () => {
  const issues = inspectDeploymentControl({
    ...CONTROL_SANO,
    workflows: {
      "deploy-production.yml": DEPLOY_PRODUCTION.replace(
        "    environment:\n      name: production\n",
        "",
      ),
    },
  });

  assert.ok(issues.some((issue) => issue.includes("environment production")));
});

test("bloquea un despliegue que no verifica el release ni ejecuta el smoke", () => {
  const issues = inspectDeploymentControl({
    ...CONTROL_SANO,
    workflows: {
      "deploy-production.yml": DEPLOY_PRODUCTION.replace(
        /^.*(daemon-release|smoke-produccion).*$/gm,
        "",
      ),
    },
  });

  assert.ok(issues.some((issue) => issue.includes("SHA exacto")));
  assert.ok(issues.some((issue) => issue.includes("smoke productivo")));
});

test("bloquea un despliegue que no propaga el fallo de sus etapas", () => {
  const issues = inspectDeploymentControl({
    ...CONTROL_SANO,
    workflows: {
      "deploy-production.yml": DEPLOY_PRODUCTION.replace(
        /^.*(if: always\(\)|no completo todas sus etapas).*$/gm,
        "",
      ),
    },
  });

  assert.ok(
    issues.some((issue) => issue.includes("fallar de forma visible")),
  );
});

test("bloquea cualquier destino daemonestudiante", () => {
  const issues = inspectDeploymentControl({
    ...CONTROL_SANO,
    workflows: {
      ...CONTROL_SANO.workflows,
      "deploy-estudiante.yml":
        "on:\n  workflow_dispatch:\njobs:\n  deploy:\n    steps:\n      - run: firebase deploy --only hosting:estudiante\n",
    },
  });

  assert.ok(issues.some((issue) => issue.includes("daemonestudiante")));
});

test("bloquea apagar el auto-deploy de Render en el blueprint", () => {
  const issues = inspectDeploymentControl({
    ...CONTROL_SANO,
    render: "    autoDeployTrigger: 'off'\n",
  });

  assert.ok(issues.some((issue) => issue.includes("apaga el auto-deploy")));
});

test("bloquea un blueprint sin disparador de auto-deploy", () => {
  const issues = inspectDeploymentControl({
    ...CONTROL_SANO,
    render: "    plan: free\n",
  });

  assert.ok(
    issues.some((issue) => issue.includes("no declara un disparador")),
  );
});

test("bloquea un entrypoint que migra en cada arranque", () => {
  const issues = inspectDeploymentControl({
    ...CONTROL_SANO,
    backendEntrypoint:
      'if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then\n' +
      "    if ! php artisan migrate --force; then\n        exit 1\n    fi\nfi\n",
  });

  assert.ok(issues.some((issue) => issue.includes("acota las migraciones")));
});

test("bloquea un entrypoint que silencia el fallo de migracion", () => {
  const issues = inspectDeploymentControl({
    ...CONTROL_SANO,
    backendEntrypoint:
      "MIGRATED_MARKER=bootstrap/cache/.migrated\n" +
      "php artisan migrate --force --no-interaction || true\n",
  });

  assert.ok(issues.some((issue) => issue.includes("propaga el fallo")));
});
