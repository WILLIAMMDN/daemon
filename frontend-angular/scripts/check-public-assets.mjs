import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Fingerprint only: never keep student homework bytes as a test fixture.
export const homeworkHashes = new Set([
  '182310fa30f7562d46b2a2c9451d47fd707d36a0b06b20e6872b4a1be6a3e324',
]);

export function inspectPublicAssets(root, prohibitedHashes = homeworkHashes) {
  if (!existsSync(root)) return [`Asset directory missing: ${root}`];
  const issues = [];
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      const name = relative(root, path).replaceAll('\\', '/');
      if (entry.isSymbolicLink()) {
        issues.push(`Unreviewed asset symlink: ${name}`);
      } else if (entry.isDirectory()) {
        visit(path);
      } else if (entry.isFile()) {
        if (/^(uploads|galeria)\//i.test(name)) issues.push(`Historical/user upload in public assets: ${name}`);
        const hash = createHash('sha256').update(readFileSync(path)).digest('hex');
        if (prohibitedHashes.has(hash)) issues.push(`Student homework bytes in public assets: ${name}`);
      }
    }
  }
  visit(root);
  return issues;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const roots = [join(project, 'public')];
  if (process.argv.includes('--build')) roots.push(join(project, 'dist/frontend-angular/browser'));
  const issues = roots.flatMap(root => inspectPublicAssets(root));
  if (issues.length) {
    console.error(issues.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`Public asset privacy check passed (${roots.length} asset trees).`);
  }
}
