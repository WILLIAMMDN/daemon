#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export const PRODUCTION_MARKERS = [
  { label: "API Render de produccion", value: "daemon-5vo1.onrender.com" },
  { label: "Firebase de produccion", value: "daemon-a41f8" },
  { label: "Hosting de produccion", value: "daemonestudiante.web.app" },
  { label: "Supabase de produccion", value: "lbxdcvsrmkkynttgwblc" },
  { label: "Pusher de produccion", value: "921d28612ceab3864425" },
];

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function parseDotenv(source) {
  const values = {};
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function productionMatches(source) {
  const normalized = String(source).toLowerCase();
  return PRODUCTION_MARKERS.filter(({ value }) =>
    normalized.includes(value.toLowerCase()),
  );
}

function hostname(value) {
  if (!value) return "";
  try {
    return new URL(
      value.includes("://") ? value : `postgresql://${value}`,
    ).hostname.toLowerCase();
  } catch {
    return String(value).toLowerCase();
  }
}

export function inspectEnvironmentVariables(values, options = {}) {
  const issues = [];
  const appEnvironment = (values.APP_ENV || "").toLowerCase();
  const daemonEnvironment = (values.DAEMON_ENVIRONMENT || "").toLowerCase();
  const operation = options.operation || "read";
  const allowProductionRead = options.allowProductionRead === true;
  const relevantFields = [
    "APP_URL",
    "FRONTEND_URL",
    "FRONTEND_PRODUCTION_URL",
    "API_URL",
    "DB_URL",
    "DB_HOST",
    "DB_DATABASE",
    "DB_USERNAME",
    "FIREBASE_PROJECT_ID",
    "SUPABASE_STORAGE_ENDPOINT",
    "SUPABASE_STORAGE_PUBLIC_URL",
    "SUPABASE_STORAGE_BUCKET",
    "SUPABASE_PRIVATE_STORAGE_BUCKET",
    "PUSHER_APP_KEY",
  ];

  const matches = [];
  for (const field of relevantFields) {
    for (const marker of productionMatches(values[field] || "")) {
      matches.push({ field, marker });
    }
  }

  const nonProduction = ["local", "development", "testing", "staging"].includes(
    appEnvironment,
  );

  const expectedDaemonEnvironment =
    appEnvironment === "local" ? "development" : appEnvironment;
  const renderRuntime = String(values.RENDER || "").toLowerCase() === "true";
  if (
    appEnvironment &&
    daemonEnvironment !== expectedDaemonEnvironment &&
    !(renderRuntime && !daemonEnvironment)
  ) {
    issues.push("DAEMON_ENVIRONMENT no coincide con APP_ENV.");
  }
  if (
    nonProduction &&
    matches.length &&
    !(operation === "read" && allowProductionRead)
  ) {
    for (const { field, marker } of matches) {
      issues.push(
        `${field} reutiliza ${marker.label} en el entorno ${appEnvironment}.`,
      );
    }
  }

  if (nonProduction) {
    if (values.SUPABASE_STORAGE_BUCKET === "daemon-assets") {
      issues.push("SUPABASE_STORAGE_BUCKET reutiliza el bucket productivo.");
    }
    if (values.SUPABASE_PRIVATE_STORAGE_BUCKET === "daemon-private") {
      issues.push(
        "SUPABASE_PRIVATE_STORAGE_BUCKET reutiliza el bucket productivo.",
      );
    }
  }

  if (["local", "development", "testing"].includes(appEnvironment)) {
    const dbConnection = (values.DB_CONNECTION || "").toLowerCase();
    const dbHost = hostname(values.DB_URL || values.DB_HOST || "");
    if (dbConnection !== "sqlite" && dbHost && !LOOPBACK_HOSTS.has(dbHost)) {
      issues.push(
        "DB_HOST/DB_URL no es loopback para un entorno local o de pruebas.",
      );
    }

    const firebaseProject = (values.FIREBASE_PROJECT_ID || "").toLowerCase();
    if (firebaseProject && !firebaseProject.startsWith("demo-")) {
      issues.push(
        "FIREBASE_PROJECT_ID de local/testing debe ser un proyecto demo de emulador.",
      );
    }
  }

  if (appEnvironment === "testing") {
    if (
      (values.DB_CONNECTION || "").toLowerCase() !== "sqlite" ||
      values.DB_DATABASE !== ":memory:"
    ) {
      issues.push("Testing debe usar SQLite en memoria.");
    }
  }

  if (appEnvironment === "staging") {
    for (const field of [
      "SUPABASE_STORAGE_BUCKET",
      "SUPABASE_PRIVATE_STORAGE_BUCKET",
    ]) {
      if (values[field] && !values[field].endsWith("-staging")) {
        issues.push(
          `${field} debe identificar de forma explicita el entorno staging.`,
        );
      }
    }
  }

  const productionTarget =
    appEnvironment === "production" || matches.length > 0;
  if (operation === "destructive" && productionTarget) {
    issues.push(
      "Una operacion destructiva no puede ejecutarse contra produccion mediante este script.",
    );
  }

  return [...new Set(issues)];
}

export function inspectStaticDocuments(documents, options = {}) {
  const issues = [];
  const development = `${documents.environment ?? ""}\n${documents.development ?? ""}`;
  const staging = documents.staging ?? "";
  const production = documents.production ?? "";
  const backendExamples = `${documents.backendExample ?? ""}\n${documents.backendTesting ?? ""}`;

  for (const marker of productionMatches(development)) {
    issues.push(`Frontend development contiene ${marker.label}.`);
  }
  if (/https:\/\//i.test(development)) {
    issues.push("Frontend development contiene una URL remota HTTPS.");
  }
  if (
    !development.includes("projectId: 'demo-") ||
    !development.includes("enabled: true")
  ) {
    issues.push(
      "Frontend development no declara Firebase Emulator Suite con projectId demo.",
    );
  }

  for (const marker of productionMatches(staging)) {
    issues.push(`Frontend staging contiene ${marker.label}.`);
  }
  if (!/["']?environmentName["']?\s*:\s*["']staging["']/.test(staging)) {
    issues.push("Frontend staging no declara environmentName=staging.");
  }
  if (!staging.includes("-staging")) {
    issues.push("Frontend staging no declara recursos Storage aislados.");
  }
  if (
    options.requireConfiguredStaging &&
    /not-configured|staging\.invalid/i.test(staging)
  ) {
    issues.push(
      "Frontend staging conserva placeholders y no se puede desplegar.",
    );
  }

  for (const required of [
    "daemon-5vo1.onrender.com",
    "daemon-a41f8",
    "lbxdcvsrmkkynttgwblc",
  ]) {
    if (!production.includes(required)) {
      issues.push(
        `Frontend production no contiene el identificador esperado: ${required}.`,
      );
    }
  }
  if (
    !/["']?environmentName["']?\s*:\s*["']production["']/.test(production) ||
    !/["']?production["']?\s*:\s*true/.test(production)
  ) {
    issues.push(
      "Frontend production no declara un contrato productivo coherente.",
    );
  }

  for (const marker of productionMatches(backendExamples)) {
    issues.push(`Los archivos .env versionados contienen ${marker.label}.`);
  }
  const testing = parseDotenv(documents.backendTesting ?? "");
  const backendExample = parseDotenv(documents.backendExample ?? "");
  issues.push(
    ...inspectEnvironmentVariables(backendExample, { operation: "read" }),
  );
  issues.push(...inspectEnvironmentVariables(testing, { operation: "read" }));

  let angular;
  let packageJson;
  let firebaseRc;
  try {
    angular = JSON.parse(documents.angular ?? "{}");
    packageJson = JSON.parse(documents.packageJson ?? "{}");
    firebaseRc = JSON.parse(documents.firebaseRc ?? "{}");
  } catch {
    issues.push("Un archivo JSON de configuracion no es valido.");
    return [...new Set(issues)];
  }

  const buildConfigurations =
    angular.projects?.["frontend-angular"]?.architect?.build?.configurations ??
    {};
  const productionReplacement =
    buildConfigurations.production?.fileReplacements?.[0]?.with;
  if (productionReplacement !== "src/environments/environment.production.ts") {
    issues.push(
      "Angular production no reemplaza environment.ts por environment.production.ts.",
    );
  }
  if ("cloud" in buildConfigurations) {
    issues.push("Angular conserva una configuracion cloud no aislada.");
  }

  const scripts = packageJson.scripts ?? {};
  if (scripts.start !== "npm run start:local" || scripts["start:cloud"]) {
    issues.push("npm start no esta limitado al entorno development local.");
  }
  if (!String(scripts["test:ci"] || "").includes("check:environment-safety")) {
    issues.push("test:ci no ejecuta el precheck de entornos.");
  }

  if (firebaseRc.projects?.default !== "demo-daemon-local") {
    issues.push(".firebaserc no usa un proyecto demo seguro por defecto.");
  }
  if ((documents.playwright ?? "").includes("start:cloud")) {
    issues.push("Playwright intenta iniciar el frontend conectado a cloud.");
  }
  if ((documents.composer ?? "").includes("@php artisan migrate --force")) {
    issues.push(
      "composer setup contiene una migracion automatica con --force.",
    );
  }
  for (const marker of productionMatches(documents.renderStaging ?? "")) {
    issues.push(`render.staging.yaml contiene ${marker.label}.`);
  }
  for (const required of [
    "DAEMON_ENVIRONMENT",
    "BROADCAST_CONNECTION",
    "SUPABASE_STORAGE_BUCKET",
    "SUPABASE_PRIVATE_STORAGE_BUCKET",
    "FIREBASE_PROJECT_ID",
  ]) {
    if (!(documents.renderStaging ?? "").includes(required)) {
      issues.push(`render.staging.yaml no declara ${required}.`);
    }
  }
  // Los PRs pueden desplegar un preview channel (hosting:channel:deploy pr-N),
  // un canal temporal que expira y no es escritura productiva. Un deploy
  // productivo real desde un PR sí se bloquea.
  const prWorkflow = documents.prWorkflow ?? "";
  const prDespliegaProductivo =
    prWorkflow.includes("--project daemon-a41f8") &&
    !prWorkflow.includes("hosting:channel:deploy");
  if (prDespliegaProductivo) {
    issues.push(
      "El workflow de PR intenta un deploy productivo (no preview channel) sobre Firebase.",
    );
  }
  const productionWorkflow = documents.productionWorkflow ?? "";
  if (
    !productionWorkflow.includes("environment: production") ||
    !productionWorkflow.includes("--project daemon-a41f8") ||
    !productionWorkflow.includes("check-environment-safety.mjs --ci")
  ) {
    issues.push(
      "El deploy productivo no fija entorno, proyecto y precheck esperados.",
    );
  }

  return [...new Set(issues)];
}

function argumentValue(name) {
  const prefix = `--${name}=`;
  return process.argv
    .slice(2)
    .find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length);
}

async function readRepositoryDocuments() {
  const files = {
    environment: "frontend-angular/src/environments/environment.ts",
    development: "frontend-angular/src/environments/environment.development.ts",
    staging: "frontend-angular/src/environments/environment.staging.ts",
    production: "frontend-angular/src/environments/environment.production.ts",
    angular: "frontend-angular/angular.json",
    packageJson: "frontend-angular/package.json",
    playwright: "frontend-angular/playwright.config.ts",
    backendExample: "backend-laravel/.env.example",
    backendTesting: "backend-laravel/.env.testing",
    composer: "backend-laravel/composer.json",
    firebaseRc: ".firebaserc",
    renderStaging: "render.staging.yaml",
    prWorkflow: ".github/workflows/firebase-hosting-pull-request.yml",
    productionWorkflow: ".github/workflows/firebase-hosting-merge.yml",
  };
  const documents = {};
  for (const [name, relativePath] of Object.entries(files)) {
    documents[name] = await readFile(
      path.join(repositoryRoot, relativePath),
      "utf8",
    );
  }
  return documents;
}

async function main() {
  const operation = argumentValue("operation") || "read";
  const envFile = argumentValue("env-file");
  const allowProductionRead = process.argv.includes("--allow-production-read");
  const requireConfiguredStaging = process.argv.includes(
    "--require-configured-staging",
  );
  const documents = await readRepositoryDocuments();
  const issues = inspectStaticDocuments(documents, {
    requireConfiguredStaging,
  });

  if (envFile) {
    const source = await readFile(
      path.resolve(repositoryRoot, envFile),
      "utf8",
    );
    issues.push(
      ...inspectEnvironmentVariables(parseDotenv(source), {
        operation,
        allowProductionRead,
      }),
    );
  }

  if (issues.length) {
    console.error("BLOQUEADO: la configuracion de entornos no es segura.");
    for (const issue of [...new Set(issues)]) console.error(`- ${issue}`);
    process.exitCode = 1;
    return;
  }

  console.log("OK: development, testing, staging y production estan aislados.");
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(
      `BLOQUEADO: no se pudo completar el precheck (${error.message}).`,
    );
    process.exitCode = 1;
  });
}
