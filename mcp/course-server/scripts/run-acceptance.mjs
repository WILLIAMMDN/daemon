#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import http from 'node:http';

const here = path.dirname(fileURLToPath(import.meta.url));
const courseServerDir = path.resolve(here, '..');
const repoRoot = path.resolve(courseServerDir, '../..');
const backendDir = path.resolve(repoRoot, 'backend-laravel');
const publicDir = path.resolve(backendDir, 'public');
const serverRouter = path.resolve(backendDir, 'vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php');

async function runCommand(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d; });
    proc.stderr.on('data', (d) => { stderr += d; });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`Command ${cmd} ${args.join(' ')} failed (code ${code}): ${stderr || stdout}`));
    });
  });
}

function checkHttp(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 400) {
          process.stdout.write(`[checkHttp] status: ${res.statusCode}, body: ${body.slice(0, 200)}\n`);
        }
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      });
    });
    req.on('error', (err) => {
      // process.stdout.write(`[checkHttp] err: ${err.message}\n`);
      resolve(false);
    });
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForHttp(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await checkHttp(url)) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function main() {
  if (process.env.DAEMON_API_BASE_URL && process.env.DAEMON_MCP_TOKEN) {
    process.stdout.write('Running MCP Acceptance Harness against existing stack: ' + process.env.DAEMON_API_BASE_URL + '\n\n');
    const acceptanceScript = path.resolve(here, 'acceptance.mjs');
    const acceptanceProc = spawn(process.execPath, [acceptanceScript], {
      cwd: courseServerDir,
      env: process.env,
      stdio: 'inherit',
    });
    const exitCode = await new Promise((resolve) => {
      acceptanceProc.on('close', resolve);
    });
    if (exitCode !== 0) process.exit(exitCode);
    return;
  }

  process.stdout.write('1. Setting up acceptance database...\n');
  const setupScript = path.resolve(here, 'setup-acceptance-db.php');
  const { stdout: setupOut } = await runCommand('php', [setupScript], { cwd: courseServerDir });
  const setup = JSON.parse(setupOut.trim());
  process.stdout.write(`   Database: ${setup.dbPath}\n`);
  process.stdout.write(`   Token generated for institution ${setup.institutionId}\n`);

  process.stdout.write('2. Starting isolated local Laravel server on port 8888...\n');
  const phpEnv = {
    ...process.env,
    APP_ENV: 'local',
    DAEMON_ENVIRONMENT: 'development',
    DB_CONNECTION: 'sqlite',
    DB_DATABASE: setup.dbPath,
    DB_URL: '',
    FIREBASE_PROJECT_ID: 'demo-daemon-test',
    FILESYSTEM_DISK: 'local',
    UPLOADS_DISK: 'local',
    PRIVATE_UPLOADS_DISK: 'local',
    SUPABASE_STORAGE_BUCKET: 'daemon-assets-test',
    SUPABASE_PRIVATE_STORAGE_BUCKET: 'daemon-private-test',
  };

  const phpServer = spawn('php', ['-S', '127.0.0.1:8888', serverRouter], {
    cwd: publicDir,
    env: phpEnv,
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  phpServer.stderr.on('data', (data) => {
    process.stderr.write(`[php-stderr] ${data}`);
  });

  phpServer.on('exit', (code, signal) => {
    if (!serverCleaned) {
      process.stderr.write(`[php] exited unexpectedly with code ${code} signal ${signal}\n`);
    }
  });

  let serverCleaned = false;
  const cleanup = () => {
    if (serverCleaned) return;
    serverCleaned = true;
    try {
      phpServer.kill();
    } catch {}
    try {
      if (fs.existsSync(setup.dbPath)) {
        fs.unlinkSync(setup.dbPath);
      }
    } catch {}
  };

  process.on('SIGINT', () => { cleanup(); process.exit(1); });
  process.on('SIGTERM', () => { cleanup(); process.exit(1); });
  process.on('exit', cleanup);

  try {
    await waitForHttp('http://127.0.0.1:8888/api/v1/salud');
    process.stdout.write('   Laravel server healthy at http://127.0.0.1:8888/api/v1/salud\n\n');

    process.stdout.write('3. Running MCP Acceptance Harness...\n');
    const acceptanceScript = path.resolve(here, 'acceptance.mjs');
    const acceptanceProc = spawn(process.execPath, [acceptanceScript], {
      cwd: courseServerDir,
      env: {
        ...process.env,
        DAEMON_API_BASE_URL: 'http://127.0.0.1:8888/api/v1',
        DAEMON_MCP_TOKEN: setup.token,
        DAEMON_MCP_LOG: 'info',
      },
      stdio: 'inherit',
    });

    const exitCode = await new Promise((resolve) => {
      acceptanceProc.on('close', resolve);
    });

    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  } finally {
    cleanup();
  }
}

main().catch((err) => {
  console.error('Acceptance run failed:', err);
  process.exit(1);
});
