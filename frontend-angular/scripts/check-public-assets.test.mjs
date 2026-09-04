import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { inspectPublicAssets } from './check-public-assets.mjs';

function removeFixture(root) {
  assert.equal(dirname(resolve(root)), resolve(tmpdir()));
  assert.match(basename(root), /^daemon-(public|static)-assets-/);
  rmSync(root, { recursive: true, force: true });
}

test('production public source excludes historical uploads and identified homework', () => {
  assert.deepEqual(inspectPublicAssets(resolve('public')), []);
});

test('blocks a new homework upload and a renamed copy without retaining student data', () => {
  const root = mkdtempSync(join(tmpdir(), 'daemon-public-assets-'));
  try {
    const bytes = Buffer.from('Synthetic homework used only by this privacy regression.');
    const hashes = new Set([createHash('sha256').update(bytes).digest('hex')]);
    mkdirSync(join(root, 'uploads/tareas'), { recursive: true });
    mkdirSync(join(root, 'img'), { recursive: true });
    writeFileSync(join(root, 'uploads/tareas/new.pdf'), bytes);
    writeFileSync(join(root, 'img/renamed.bin'), bytes);
    const issues = inspectPublicAssets(root, hashes);
    assert.ok(issues.some(issue => issue.includes('Historical/user upload')));
    assert.ok(issues.some(issue => issue.includes('Student homework bytes') && issue.includes('img/renamed.bin')));
  } finally {
    removeFixture(root);
  }
});

test('allows reviewed static assets but rejects a missing production build', () => {
  const root = mkdtempSync(join(tmpdir(), 'daemon-static-assets-'));
  try {
    writeFileSync(join(root, 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
    assert.deepEqual(inspectPublicAssets(root), []);
    assert.equal(inspectPublicAssets(join(root, 'missing-build')).length, 1);
  } finally {
    removeFixture(root);
  }
});
