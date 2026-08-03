#!/usr/bin/env node
/**
 * check-student-visual.mjs
 * --------------------------------------------------------------
 * Enforces the visual contract of the student portal, as defined
 * in docs/sistema-diseno/ (decisiones D-05 y D-06) and
 * docs/sistema-visual-portal-alumno.md.
 *
 * Rules:
 *   1. No CSS gradients (linear/radial/conic) in student modules.
 *      Exception: the `.daemon-grad-*` utility classes defined in
 *      `_components.scss` (they are the design system's own
 *      allowlisted gradient utilities).
 *   2. No Tailwind gradient utilities (`bg-gradient-*`).
 *   3. No `Outfit` typography (Inter is the only family, D-05).
 *   4. No glassmorphism (`backdrop-blur-*`, `shadow-glass`).
 *   5. No decorative vertical translation on hover
 *      (`hover:-translate-y-*`).
 *   6. No radius above the visual system (`rounded-[2x+px]`).
 *
 * Exits:
 *   0 — contract valid
 *   1 — violations (CI fails)
 *
 * Run:
 *   node scripts/check-student-visual.mjs
 */

import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const root = new URL('../', import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/, (value) => value.slice(1));
const targets = [
  'src/app/core/layouts/layout-alumno',
  'src/app/features/alumno',
  'src/app/features/misiones',
  'src/app/features/ranking',
  'src/app/features/tienda',
  'src/app/features/herramientas',
  'src/styles.scss',
  'src/styles/_components.scss',
];

const rules = [
  { name: 'degradado CSS', pattern: /(?:linear|radial)-gradient\s*\(/g },
  { name: 'degradado Tailwind', pattern: /\bbg-gradient(?:-[^\s"']+)?/g },
  { name: 'tipografía Outfit', pattern: /\bOutfit\b/g },
  { name: 'glassmorphism', pattern: /\b(?:backdrop-blur|shadow-glass)(?:-[^\s"']+)?/g },
  { name: 'desplazamiento vertical decorativo', pattern: /\bhover:-translate-y-(?!0\b)[^\s"']+/g },
  { name: 'radio mayor al sistema visual', pattern: /\brounded-\[(?:2\d|3\d|[4-9]\d)px\]/g },
];

/**
 * Utilities propias del sistema de diseño. Definen los gradientes
 * permitidos (`.daemon-grad-*` en `_components.scss`); no son
 * violaciones, son la allowlist del contrato.
 */
function esUtilityDeGradiente(line) {
  return /\.daemon-grad-[\w-]+\s*\{/.test(line);
}

async function filesAt(path) {
  const absolute = join(root, path);
  const entries = await readdir(absolute, { withFileTypes: true }).catch(() => null);

  if (!entries) return [absolute];

  const nested = await Promise.all(entries.map((entry) => {
    const child = join(absolute, entry.name);
    return entry.isDirectory() ? filesAt(relative(root, child)) : [child];
  }));

  return nested.flat();
}

const files = (await Promise.all(targets.map(filesAt)))
  .flat()
  .filter((file) => ['.html', '.scss', '.ts'].includes(extname(file)));
const violations = [];

for (const file of files) {
  const content = await readFile(file, 'utf8');
  const lines = content.split(/\r?\n/);
  // Rastrea si la línea actual está dentro de un bloque `.daemon-grad-*`
  // (las utilities de gradiente permitidas viven en varias líneas).
  let dentroDeGradiente = false;

  for (const [index, line] of lines.entries()) {
    if (esUtilityDeGradiente(line)) {
      dentroDeGradiente = true;
    }
    if (dentroDeGradiente && /^\s*}/.test(line)) {
      dentroDeGradiente = false;
    }
    if (dentroDeGradiente) continue;

    for (const rule of rules) {
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(line)) {
        violations.push(`${relative(root, file)}:${index + 1} — ${rule.name}`);
      }
    }
  }
}

if (violations.length) {
  console.error('El portal alumno incumple el contrato visual:\n');
  console.error(violations.map((violation) => `- ${violation}`).join('\n'));
  process.exit(1);
}

console.log(`Contrato visual del portal alumno válido (${files.length} archivos revisados).`);
