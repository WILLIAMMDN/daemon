import test from "node:test";
import assert from "node:assert/strict";
import {
  inspectEnvironmentVariables,
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
