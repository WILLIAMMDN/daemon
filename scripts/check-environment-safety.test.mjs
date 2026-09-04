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
    productionWorkflow: "",
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
    productionWorkflow: "",
  });

  assert.ok(issues.some((issue) => issue.startsWith("Frontend development")));
});

// --- Control de despliegue productivo -------------------------------------
// Un merge y un despliegue productivo deben seguir siendo dos operaciones
// distintas. Estas pruebas fallan si el repositorio vuelve a acoplarlas.

const DEPLOY_PRODUCTION = `
on:
  workflow_dispatch:
concurrency:
  group: production-daemon
  cancel-in-progress: false
jobs:
  deploy:
    environment:
      name: production
    steps:
      - run: git merge-base --is-ancestor "$target" refs/remotes/origin/main
      - run: gh api repos/x/actions/workflows/supabase-backup.yml/runs
      - run: node scripts/check-environment-safety.mjs --ci
      - run: npx firebase-tools deploy --only hosting:arc --project daemon-a41f8
`;

const CONTROL_SANO = {
  workflows: {
    "deploy-production.yml": DEPLOY_PRODUCTION,
    "main-deployable.yml":
      "on:\n  push:\n    branches: [main]\njobs:\n  deployable:\n    steps:\n      - run: npm run build\n",
  },
  render: "    autoDeployTrigger: 'off'\n",
  backendEntrypoint: 'if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then\n',
};

test("acepta un control de despliegue productivo explicito", () => {
  assert.deepEqual(inspectDeploymentControl(CONTROL_SANO), []);
});

test("bloquea un workflow que despliega Firebase al mergear main", () => {
  const issues = inspectDeploymentControl({
    ...CONTROL_SANO,
    workflows: {
      ...CONTROL_SANO.workflows,
      "firebase-hosting-merge.yml":
        "on:\n  push:\n    branches:\n      - main\njobs:\n  build_and_deploy:\n    steps:\n      - run: firebase deploy --only hosting:arc --project daemon-a41f8\n",
    },
  });

  assert.ok(
    issues.some((issue) => issue.includes("un merge no puede desplegar")),
  );
});

test("bloquea un push a main que dispara el deploy hook de Render", () => {
  const issues = inspectDeploymentControl({
    ...CONTROL_SANO,
    workflows: {
      ...CONTROL_SANO.workflows,
      "render-on-merge.yml":
        'on:\n  push:\n    branches: [main]\njobs:\n  deploy:\n    steps:\n      - run: curl -X POST "$RENDER_DEPLOY_HOOK_URL"\n',
    },
  });

  assert.ok(
    issues.some((issue) => issue.includes("un merge no puede desplegar")),
  );
});

test("bloquea la ausencia del workflow de despliegue productivo", () => {
  const issues = inspectDeploymentControl({ ...CONTROL_SANO, workflows: {} });

  assert.ok(issues.some((issue) => issue.includes("deploy-production.yml")));
});

test("bloquea un despliegue productivo disparado por push", () => {
  const issues = inspectDeploymentControl({
    ...CONTROL_SANO,
    workflows: {
      "deploy-production.yml": DEPLOY_PRODUCTION.replace(
        "on:\n  workflow_dispatch:",
        "on:\n  push:\n    branches: [main]",
      ),
    },
  });

  assert.ok(issues.some((issue) => issue.includes("workflow_dispatch")));
  assert.ok(
    issues.some((issue) => issue.includes("no puede dispararse por push")),
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

test("bloquea un despliegue productivo sin environment ni aprobacion", () => {
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

test("bloquea el auto-deploy de Render declarado en el blueprint", () => {
  const issues = inspectDeploymentControl({
    ...CONTROL_SANO,
    render: "    autoDeployTrigger: checksPass\n",
  });

  assert.ok(issues.some((issue) => issue.includes("auto-deploy productivo")));
});

test("bloquea un entrypoint que migra por defecto", () => {
  const issues = inspectDeploymentControl({
    ...CONTROL_SANO,
    backendEntrypoint: 'if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then\n',
  });

  assert.ok(issues.some((issue) => issue.includes("migra por defecto")));
});
