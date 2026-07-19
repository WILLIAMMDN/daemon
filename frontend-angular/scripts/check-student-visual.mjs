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

  for (const [index, line] of lines.entries()) {
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
