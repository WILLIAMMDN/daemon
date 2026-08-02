#!/usr/bin/env node
// apply-gradient-fixes.mjs
//
// Aplica los reemplazos finales para dejar 0 violaciones nuevas:
//   - Linear-gradient con tokens en SCSS  -> utility class (.daemon-grad-*)
//   - bg-gradient-to-* en HTML Tailwind  -> utility class + colores de token
//   - outline: 3px solid                  -> box-shadow (focus ring)
//   - #9333ea (purple)                    -> var(--daemon-primary-soft)
//
// Uso: node scripts/apply-gradient-fixes.mjs [--dry-run]

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

const REPLACEMENTS = [
    // SCSS: linear-gradient(135deg, var(--daemon-primary-soft) 0%, var(--daemon-primary-dark) 100%)
    {
        id: 'scss-grad-primary',
        filePattern: /\.scss$/,
        pattern: /linear-gradient\(135deg,\s*var\(--daemon-primary-soft\)\s*0%,\s*var\(--daemon-primary-dark\)\s*100%\)/g,
        replacement: 'var(--daemon-grad-primary)',
        context: 'background:',
    },
    // SCSS: linear-gradient(135deg, var(--daemon-surface) 0%, var(--daemon-surface-muted) 100%)
    {
        id: 'scss-grad-surface',
        filePattern: /\.scss$/,
        pattern: /linear-gradient\(135deg,\s*var\(--daemon-surface\)\s*0%,\s*var\(--daemon-surface-muted\)\s*100%\)/g,
        replacement: 'var(--daemon-grad-surface)',
        context: 'background:',
    },
    // SCSS: linear-gradient(90deg, rgba(...)...) sobre hero de cuento
    // Lo reemplazamos por la utility class daemon-grad-overlay aplicada al elemento
    {
        id: 'scss-grad-hero-overlay',
        filePattern: /crear-cuento\.scss$/,
        pattern: /background:\s*linear-gradient\(\s*90deg,\s*rgba\(10,\s*5,\s*24,\s*0\.6\)\s*0%,\s*rgba\(24,\s*10,\s*58,\s*0\.2\)\s*50%,\s*transparent\s*100%\s*\)\s*;/g,
        replacement: 'background: var(--daemon-grad-overlay);',
        context: null,
    },
    // SCSS: outline: 3px solid var(--daemon-accent)  -> box-shadow
    {
        id: 'scss-outline-to-box-shadow',
        filePattern: /\.scss$/,
        pattern: /outline:\s*3px\s+solid\s+var\(--daemon-accent\);[\s\S]{0,30}outline-offset:\s*3px;/g,
        replacement:
            'outline: 0;\n  box-shadow: 0 0 0 3px var(--daemon-accent);',
        context: null,
    },
    // TS: '#9333ea' (literal suelto) -> 'var(--daemon-primary-soft)'
    {
        id: 'ts-hex-9333ea',
        filePattern: /\.ts$/,
        pattern: /'#9333ea'/g,
        replacement: "'var(--daemon-primary-soft)'",
        context: null,
    },
];

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

async function main() {
    const files = [];
    for (const dir of SCAN_DIRS) {
        files.push(...(await listFiles(dir)));
    }

    const reports = [];
    for (const file of files) {
        const rel = path.relative(projectRoot, file);
        let content = await readFile(file, 'utf8');
        let fileChanges = 0;

        for (const r of REPLACEMENTS) {
            if (!r.filePattern.test(rel)) continue;
            const before = content;
            content = content.replace(r.pattern, r.replacement);
            if (content !== before) {
                const diff = (before.match(r.pattern) || []).length;
                fileChanges += diff;
                reports.push({ file: rel, rule: r.id, count: diff });
            }
        }

        if (fileChanges > 0 && !dryRun) {
            await writeFile(file, content, 'utf8');
        }
    }

    console.log(`\n=== apply-gradient-fixes ${dryRun ? '(DRY-RUN)' : ''} ===`);
    if (reports.length === 0) {
        console.log('Sin cambios. Verifica que los patrones siguen siendo validos.');
    } else {
        const grouped = {};
        for (const r of reports) {
            grouped[r.rule] = (grouped[r.rule] || 0) + r.count;
        }
        console.log('Reemplazos por regla:');
        for (const [rule, count] of Object.entries(grouped)) {
            console.log(`  ${rule}: ${count}`);
        }
        console.log('\nDetalle:');
        for (const r of reports) {
            console.log(`  ${r.file}  [${r.rule}]  x${r.count}`);
        }
    }
}

main().catch((err) => {
    console.error('Error inesperado:', err);
    process.exitCode = 1;
});
