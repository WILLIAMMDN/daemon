#!/usr/bin/env node
// apply-token-fixes-4.mjs
//
// Cuarta pasada de style-tokens. Migra las 72 violaciones del baseline
// que quedaban tras apply-token-fixes 1-3:
//
//   - Dorados DAEMONS (bordes claros + texto oscuro) -> tokens accent
//     vía color-mix (sin hex, sin tokens nuevos).
//   - Azules (texto/bordes) -> --daemon-info / --daemon-kids / muted.
//   - Verdes (bordes/texto) -> --daemon-success*.
//   - Rojos (herramientas) -> --daemon-danger.
//   - Morados -> --daemon-primary*.
//   - Hex de 8 dígitos (sombras con alpha) -> color-mix con token.
//   - Arbitrary Tailwind shadow-[...#hex] -> var(--daemon-success-soft).
//   - Hex dentro de strings TS (deep-chat) -> var(--daemon-info).
//
// Uso: node scripts/apply-token-fixes-4.mjs [--dry-run]

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const frontendRoot = path.join(projectRoot, 'src');
const dryRun = process.argv.includes('--dry-run');

const SCAN_DIRS = [
  path.join(frontendRoot, 'app', 'features'),
  path.join(frontendRoot, 'app', 'shared'),
];
const EXTENSIONS = new Set(['.scss', '.css', '.html', '.ts']);

// Bordes dorados claros (fondo ámbar/DAEMONS) -> 45% accent sobre surface.
const GOLD_BORDER = 'color-mix(in srgb, var(--daemon-accent) 45%, var(--daemon-on-primary))';
// Texto dorado oscuro (legible sobre ámbar) -> accent-dark mezclado con ink.
const GOLD_TEXT = 'color-mix(in srgb, var(--daemon-accent-dark) 60%, var(--daemon-ink))';
// Verde borde suave (éxito) -> 40% success sobre surface.
const GREEN_BORDER = 'color-mix(in srgb, var(--daemon-success) 40%, var(--daemon-on-primary))';

const HEX_TO_TOKEN = Object.freeze({
  // ===== Dorados DAEMONS: bordes claros =====
  '#f5d77a': GOLD_BORDER,
  '#f5e3a7': GOLD_BORDER,
  '#f7d58a': GOLD_BORDER,
  '#f2d38c': GOLD_BORDER,
  '#f3dc99': GOLD_BORDER,
  '#f5d08a': GOLD_BORDER,
  '#f2d487': GOLD_BORDER,
  '#f2d989': GOLD_BORDER,
  '#f5d185': GOLD_BORDER,

  // ===== Dorados DAEMONS: texto oscuro =====
  '#9a5b00': GOLD_TEXT,
  '#8a4b08': GOLD_TEXT,
  '#9a5a13': GOLD_TEXT,
  '#83510a': GOLD_TEXT,
  '#9a5c00': GOLD_TEXT,
  '#6e4500': GOLD_TEXT,
  '#8a6a25': GOLD_TEXT,
  '#674000': GOLD_TEXT,
  '#654b21': GOLD_TEXT,
  '#92400e': GOLD_TEXT,
  '#744210': GOLD_TEXT,
  '#b86e00': GOLD_TEXT,
  '#6f5b2b': GOLD_TEXT,

  // Bronces del podio (ranking)
  '#c56a32': 'var(--daemon-accent-dark)',
  '#9a4d1f': GOLD_TEXT,

  // ===== Azules =====
  '#1759a6': 'var(--daemon-info)',
  '#063f82': 'var(--daemon-info)',
  '#244ea0': 'var(--daemon-info)',
  '#173d82': 'var(--daemon-info)',
  '#1c4d83': 'var(--daemon-info)',
  '#174d82': 'var(--daemon-info)',
  '#0748b4': 'var(--daemon-info)',
  '#004fbd': 'var(--daemon-info)',
  '#1e3a8a': 'var(--daemon-info)',

  // Cianes de marca (KIDS)
  '#66e5f1': 'var(--daemon-kids)',
  '#6ee7ef': 'var(--daemon-kids)',

  // Azules grisáceos (muted)
  '#8ba8c7': 'var(--daemon-muted)',
  '#9eb9d5': 'var(--daemon-muted)',
  '#8eaac5': 'var(--daemon-muted)',
  '#8a96a8': 'var(--daemon-muted)',
  '#8a96a7': 'var(--daemon-muted)',
  '#8590a2': 'var(--daemon-muted)',
  '#8590a0': 'var(--daemon-muted)',

  // ===== Verdes (éxito) =====
  '#176b3a': 'var(--daemon-success)',
  '#166534': 'var(--daemon-success)',
  '#53b579': 'var(--daemon-success)',
  '#37d29a': 'var(--daemon-success)',
  '#a7e2bf': GREEN_BORDER,
  '#6ee7b7': GREEN_BORDER,

  // ===== Rojos (herramientas / peligro) =====
  '#ff7a74': 'var(--daemon-danger)',
  '#ef6669': 'var(--daemon-danger)',

  // ===== Morados =====
  '#4e3698': 'var(--daemon-primary-dark)',
  '#3b0f86': 'var(--daemon-primary-dark)',
  '#b08ee6': 'var(--daemon-primary-soft)',
});

// Sombras con alpha (8 dígitos) -> color-mix con token y mismo alpha.
const SHADOW_HEX_TO_MIX = Object.freeze({
  '#1f2a4414': 'color-mix(in srgb, var(--daemon-ink) 8%, transparent)',
  '#2030550a': 'color-mix(in srgb, var(--daemon-ink) 4%, transparent)',
  '#2030550b': 'color-mix(in srgb, var(--daemon-ink) 4%, transparent)',
  '#0b1220a8': 'color-mix(in srgb, var(--daemon-on-accent) 66%, transparent)',
});

// Arbitrary Tailwind con hex (shadow rings verdes del panel alumno).
const ARBITRARY_HEX = Object.freeze({
  'shadow-[0_0_0_2px_#dcfce7]': 'shadow-[0_0_0_2px_var(--daemon-success-soft)]',
  'shadow-[0_0_0_3px_#dcfce7]': 'shadow-[0_0_0_3px_var(--daemon-success-soft)]',
});

async function listFiles(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listFiles(full)));
    } else if (entry.isFile() && EXTENSIONS.has(path.extname(full))) {
      if (entry.name.endsWith('.spec.ts')) continue;
      out.push(full);
    }
  }
  return out;
}

function replaceAll(content, pattern, replacement) {
  const before = content;
  content = content.replace(pattern, replacement);
  if (content === before) return { content, count: 0 };
  const matches = before.match(pattern);
  return { content, count: matches ? matches.length : 0 };
}

async function main() {
  const files = [];
  for (const dir of SCAN_DIRS) {
    files.push(...(await listFiles(dir)));
  }

  let totalFiles = 0;
  let totalReplacements = 0;
  const reports = [];

  for (const file of files) {
    const rel = path.relative(projectRoot, file);
    let content = await readFile(file, 'utf8');
    let fileChanges = 0;

    // 1. Hex planos -> tokens/color-mix
    for (const [hex, token] of Object.entries(HEX_TO_TOKEN)) {
      const re = new RegExp(`(?<![A-Za-z0-9_])(${hex})(?![A-Za-z0-9_])`, 'gi');
      const r = replaceAll(content, re, token);
      content = r.content;
      fileChanges += r.count;
    }

    // 2. Sombras con alpha -> color-mix
    for (const [hex, mix] of Object.entries(SHADOW_HEX_TO_MIX)) {
      const re = new RegExp(`(?<![A-Za-z0-9_])(${hex})(?![A-Za-z0-9_])`, 'gi');
      const r = replaceAll(content, re, mix);
      content = r.content;
      fileChanges += r.count;
    }

    // 3. Arbitrary Tailwind con hex
    for (const [arbitrary, semantic] of Object.entries(ARBITRARY_HEX)) {
      const re = new RegExp(arbitrary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const r = replaceAll(content, re, semantic);
      content = r.content;
      fileChanges += r.count;
    }

    if (fileChanges > 0) {
      totalFiles += 1;
      totalReplacements += fileChanges;
      reports.push({ file: rel, count: fileChanges });
      if (!dryRun) {
        await writeFile(file, content, 'utf8');
      }
    }
  }

  console.log(`\n=== apply-token-fixes-4 ${dryRun ? '(DRY-RUN)' : ''} ===`);
  console.log(`Archivos modificados: ${totalFiles}`);
  console.log(`Reemplazos totales: ${totalReplacements}`);

  if (reports.length > 0) {
    console.log('\nDetalle:');
    for (const r of reports) {
      console.log(`  ${r.file}  x${r.count}`);
    }
  }
}

main().catch((err) => {
  console.error('Error inesperado:', err);
  process.exitCode = 1;
});
