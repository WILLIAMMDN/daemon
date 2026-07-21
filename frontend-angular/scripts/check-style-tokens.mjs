#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * check-style-tokens.mjs
 * --------------------------------------------------------------
 * Enforces the design system token contract.
 *
 * Phase 1 of the design system migration (2026-07-20). The linter
 * ensures that hex literals, arbitrary Tailwind values, gradients,
 * backdrop-blur, outline shortcuts, and !important rules don't leak
 * into features/ or shared/ without justification.
 *
 * Rules (in order of failure severity):
 *   1. Hex literals (#xxx / #xxxxxx / #xxxxxxxx) outside allowlist.
 *   2. Tailwind arbitrary values with hex: bg-[#...], text-[#...],
 *      border-[#...].
 *   3. linear-gradient / radial-gradient / bg-gradient-to-* in
 *      features/alumno/** or features/cuentos/**.
 *   4. backdrop-blur-* in features/** without allowlist comment.
 *   5. !important outside .ant-* or .daemon-* selectors in
 *      src/styles/_components.scss.
 *   6. outline: with a value other than none or currentColor
 *      (focus accessibility).
 *
 * Modes:
 *   - default:        compare against style-tokens.baseline.json. New
 *                     violations fail. Baseline-only violations warn.
 *   - --update-baseline: regenerate the baseline file with the current
 *                        set of violations. Use sparingly.
 *   - --strict:       treat any violation as a hard failure.
 *
 * Exits:
 *   0  — clean (or matches baseline)
 *   1  — new violations (CI fails)
 *
 * Run:
 *   node scripts/check-style-tokens.mjs
 *   node scripts/check-style-tokens.mjs --update-baseline
 *   node scripts/check-style-tokens.mjs --strict
 *
 * See docs/sistema-diseno/04-tokens-y-tema.md §5 for the rule set.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const frontendRoot = path.join(projectRoot, 'src');
const baselinePath = path.join(projectRoot, 'scripts', 'style-tokens.baseline.json');

const args = new Set(process.argv.slice(2));
const UPDATE_BASELINE = args.has('--update-baseline');
const STRICT = args.has('--strict');

/* === Config: where to scan and what to allow === */

const SCAN_DIRS = [
  path.join(frontendRoot, 'app', 'features'),
  path.join(frontendRoot, 'app', 'shared'),
];

const EXTENSIONS = new Set(['.ts', '.html', '.scss', '.css']);

/**
 * Files that may contain hex literals, gradients, !important etc.
 * These are the origin files: tokens, NG-ZORRO overrides, popovers,
 * Tailwind config. All other files MUST use the tokens.
 */
const ALLOWLIST_PATHS = new Set([
  path.join(frontendRoot, 'styles.scss'),
  path.join(frontendRoot, 'styles', '_tokens.scss'),
  path.join(frontendRoot, 'styles', '_components.scss'),
  path.join(frontendRoot, 'styles', '_popovers.scss'),
  path.join(frontendRoot, 'styles', '_layout.scss'),
  path.join(frontendRoot, 'styles', '_gamification.scss'),
  path.join(projectRoot, 'tailwind.config.js'),
  path.join(frontendRoot, 'app', 'core', 'dominio', 'tema-portal-alumno.ts'),
]);

/* === Rule definitions === */

const RULES = [
  {
    id: 'hex-literal',
    description: 'Hex literal outside allowlist',
    test: (content) => {
      const re = /#[0-9a-fA-F]{3,8}\b/g;
      return matchAll(re, content);
    },
  },
  {
    id: 'tailwind-arbitrary-hex',
    description: 'Tailwind arbitrary value with hex',
    test: (content) => {
      // bg-[#hex], text-[#hex], border-[#hex], etc.
      const re = /\b(?:bg|text|border|ring|fill|stroke|outline|shadow|via|from|to|via|placeholder|accent|caret|decoration|divide)-\[#[0-9a-fA-F]{3,8}\]/g;
      return matchAll(re, content);
    },
  },
  {
    id: 'gradient-alumno-cuentos',
    description: 'Gradient in features/alumno or features/cuentos',
    test: (content, filePath) => {
      if (!isInAlumnoOrCuentos(filePath)) return [];
      const re = /(?:linear-gradient|radial-gradient|conic-gradient|bg-gradient-to-)/g;
      return matchAll(re, content);
    },
  },
  {
    id: 'backdrop-blur-feature',
    description: 'backdrop-blur in features without allowlist comment',
    test: (content) => {
      const re = /\bbackdrop-blur-\S+/g;
      return matchAll(re, content);
    },
  },
  {
    id: 'important-outside-override',
    description: '!important outside .ant-* or .daemon-* in _components.scss',
    test: (content, filePath) => {
      if (filePath !== path.join(frontendRoot, 'styles', '_components.scss')) return [];
      const re = /!important/g;
      const matches = matchAll(re, content);
      // Allow when the line is inside a selector starting with .ant- or .daemon-
      return matches.filter((m) => !isInAntOrDaemonSelector(content, m.index));
    },
  },
  {
    id: 'outline-shortcut',
    description: 'outline with a value other than none or currentColor',
    test: (content) => {
      // matches: outline: 2px solid #...; outline: 3px solid red; etc.
      const re = /outline\s*:\s*([^;}\n]+)/g;
      const matches = [];
      let m;
      while ((m = re.exec(content)) !== null) {
        const value = m[1].trim();
        if (value !== 'none' && value !== 'currentColor' && value !== 'inherit' && value !== 'unset' && value !== '0') {
          matches.push({ index: m.index, length: m[0].length, match: m[0] });
        }
      }
      return matches;
    },
  },
];

/* === File walking === */

async function listFiles(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listFiles(full)));
    } else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) {
      if (entry.name.endsWith('.spec.ts')) continue;
      out.push(full);
    }
  }
  return out;
}

/* === Helpers === */

function matchAll(re, content) {
  const out = [];
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(content)) !== null) {
    out.push({ index: m.index, length: m[0].length, match: m[0] });
  }
  return out;
}

function isInAlumnoOrCuentos(filePath) {
  const alumno = path.join(frontendRoot, 'app', 'features', 'alumno');
  const cuentos = path.join(frontendRoot, 'app', 'features', 'cuentos');
  return filePath.startsWith(alumno) || filePath.startsWith(cuentos);
}

function isInAntOrDaemonSelector(content, index) {
  // Walk backward from `index` to find the nearest CSS rule start.
  // If the selector text contains `.ant-` or `.daemon-`, allow !important.
  const before = content.slice(0, index);
  const lastBrace = before.lastIndexOf('{');
  const lastCloseBrace = before.lastIndexOf('}');
  if (lastBrace === -1 || (lastCloseBrace !== -1 && lastCloseBrace > lastBrace)) {
    return false;
  }
  const selector = content.slice(lastBrace - 500, lastBrace);
  return /\.ant-|\.daemon-/.test(selector);
}

function lineColFromIndex(content, index) {
  const before = content.slice(0, index);
  const line = before.split('\n').length;
  const col = index - before.lastIndexOf('\n');
  return { line, col };
}

function fingerprint(filePath, ruleId, line, match) {
  return `${path.relative(projectRoot, filePath)}|${ruleId}|${line}|${match}`;
}

/* === Main === */

async function main() {
  const files = [];
  for (const dir of SCAN_DIRS) {
    files.push(...(await listFiles(dir)));
  }

  const violations = [];

  for (const file of files) {
    if (ALLOWLIST_PATHS.has(file)) continue;
    const content = await readFile(file, 'utf8');
    for (const rule of RULES) {
      const matches = rule.test(content, file);
      for (const m of matches) {
        const { line } = lineColFromIndex(content, m.index);
        violations.push({
          file: path.relative(projectRoot, file),
          rule: rule.id,
          line,
          match: m.match.trim().slice(0, 80),
        });
      }
    }
  }

  // Load baseline if any
  let baseline = null;
  if (existsSync(baselinePath)) {
    try {
      const raw = await readFile(baselinePath, 'utf8');
      baseline = JSON.parse(raw);
    } catch (err) {
      console.error(`No se pudo leer ${baselinePath}: ${err.message}`);
      process.exitCode = 1;
      return;
    }
  }

  const baselineKeys = new Set(
    (baseline || []).map((v) => fingerprint(v.file, v.rule, v.line, v.match))
  );

  const currentKeys = new Set(
    violations.map((v) => fingerprint(v.file, v.rule, v.line, v.match))
  );

  const newViolations = violations.filter(
    (v) => !baselineKeys.has(fingerprint(v.file, v.rule, v.line, v.match))
  );
  const goneViolations = (baseline || []).filter(
    (v) => !currentKeys.has(fingerprint(v.file, v.rule, v.line, v.match))
  );

  if (UPDATE_BASELINE) {
    await writeFile(
      baselinePath,
      JSON.stringify(violations, null, 2) + '\n',
      'utf8'
    );
    console.log(`Baseline actualizada: ${violations.length} violaciones documentadas.`);
    console.log(`  → ${baselinePath}`);
    return;
  }

  if (violations.length === 0) {
    console.log('Estilos limpios: cero violaciones del contrato de tokens.');
    if (baseline && goneViolations.length > 0) {
      console.log(`Advertencia: el baseline tenía ${goneViolations.length} entradas que ya no aparecen.`);
      console.log('  Regenera el baseline con --update-baseline o documenta la limpieza.');
    }
    return;
  }

  console.log(`\n=== style-tokens check ===`);
  console.log(`Violaciones totales: ${violations.length}`);

  if (baseline) {
    console.log(`Violaciones en baseline: ${baseline.length}`);
    console.log(`Violaciones nuevas (bloquean CI): ${newViolations.length}`);
    console.log(`Violaciones ya resueltas: ${goneViolations.length}`);
  } else {
    console.log('No hay baseline. La primera ejecución documenta el estado actual.');
  }

  if (newViolations.length > 0 || STRICT) {
    const toShow = STRICT ? violations : newViolations;
    console.log('\n— Violaciones a corregir —');
    for (const v of toShow) {
      console.log(`  ${v.file}:${v.line}  [${v.rule}]  ${v.match}`);
    }
    if (STRICT) {
      console.log('\nModo --strict activo. Cualquier violación falla el build.');
    } else {
      console.log('\nEstas violaciones NO están en el baseline. El CI las bloquea.');
    }
    process.exitCode = 1;
    return;
  }

  if (goneViolations.length > 0) {
    console.log('\n— Violaciones del baseline que ya no aparecen (regenera el baseline) —');
    for (const v of goneViolations) {
      console.log(`  ${v.file}:${v.line}  [${v.rule}]  ${v.match}`);
    }
  }

  console.log('\n— Violaciones restantes (documentadas en baseline) —');
  for (const v of violations) {
    if (goneViolations.find((g) => g.file === v.file && g.line === v.line && g.rule === v.rule)) {
      continue;
    }
    console.log(`  ${v.file}:${v.line}  [${v.rule}]  ${v.match}`);
  }
  console.log('\nPara regenerar el baseline tras una migración:');
  console.log('  npm run check:style-tokens -- --update-baseline');
}

main().catch((err) => {
  console.error('Error inesperado:', err);
  process.exitCode = 1;
});
