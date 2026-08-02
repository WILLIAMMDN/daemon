#!/usr/bin/env node
// apply-token-fixes.mjs
//
// Aplica el mapeo hex-literal -> design token a TODOS los archivos
// en src/app/features y src/app/shared. Skip los que estan en la
// allowlist del check-style-tokens.
//
// Uso:  node scripts/apply-token-fixes.mjs [--dry-run]
//
// El mapeo es por CONTEXTO (no por string crudo), para evitar
// falsos positivos como #fff en un nombre de clase o un id.

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

// Mapeo principal: hex -> token CSS.
// Solo hex que matchean EXACTAMENTE el boundary de CSS, no substrings.
const HEX_TO_TOKEN = {
    '#fff': 'var(--daemon-on-primary)',
    '#ffffff': 'var(--daemon-on-primary)',
    '#000': 'var(--daemon-ink)',
    '#000000': 'var(--daemon-ink)',
    '#172033': 'var(--daemon-ink)',
    '#23314a': 'var(--daemon-ink-soft)',
    '#334155': 'var(--daemon-ink-soft)',
    '#4a5775': 'var(--daemon-ink-soft)',
    '#4b5563': 'var(--daemon-ink-soft)',
    '#475569': 'var(--daemon-ink-soft)',
    '#53627a': 'var(--daemon-muted)',
    '#5e34d7': 'var(--daemon-primary)',
    '#5f35d7': 'var(--daemon-primary)',
    '#5b35c9': 'var(--daemon-primary)',
    '#4f2cc7': 'var(--daemon-primary-dark)',
    '#3f2e98': 'var(--daemon-primary-dark)',
    '#5730cf': 'var(--daemon-primary-dark)',
    '#2b1b54': 'var(--daemon-on-accent)',
    '#180a3a': 'var(--daemon-on-accent)',
    '#24194f': 'var(--daemon-on-accent)',
    '#5a4a8c': 'var(--daemon-primary-soft)',
    '#6c5ce7': 'var(--daemon-primary-soft)',
    '#6c3fe8': 'var(--daemon-primary-soft)',
    '#8c76dd': 'var(--daemon-primary-soft)',
    '#7359c8': 'var(--daemon-primary-soft)',
    '#6a4cff': 'var(--daemon-primary-soft)',
    '#667085': 'var(--daemon-muted)',
    '#6c788c': 'var(--daemon-muted)',
    '#65748a': 'var(--daemon-muted)',
    '#6e7c95': 'var(--daemon-muted)',
    '#8c97a8': 'var(--daemon-muted)',
    '#94a3b8': 'var(--daemon-muted)',
    '#4d5b70': 'var(--daemon-muted)',
    '#1a1f36': 'var(--daemon-ink)',
    '#111827': 'var(--daemon-ink)',
    '#1d4f91': 'var(--daemon-info)',
    '#3157a5': 'var(--daemon-info)',
    '#2563eb': 'var(--daemon-info)',
    '#1677ff': 'var(--daemon-teens)',
    '#0d9488': 'var(--daemon-success)',
    '#12a150': 'var(--daemon-success)',
    '#e7f8ef': 'var(--daemon-success-soft)',
    '#e4eaf2': 'var(--daemon-border)',
    '#d8e0ec': 'var(--daemon-border)',
    '#d6e0f0': 'var(--daemon-border)',
    '#e2e8f0': 'var(--daemon-border)',
    '#e1e7f0': 'var(--daemon-border)',
    '#e7ecf3': 'var(--daemon-border)',
    '#e8edf4': 'var(--daemon-border)',
    '#e8eef8': 'var(--daemon-border)',
    '#edf1f6': 'var(--daemon-border)',
    '#f1f5f9': 'var(--daemon-surface-muted)',
    '#f1f5fb': 'var(--daemon-surface-muted)',
    '#f3f4f6': 'var(--daemon-surface-muted)',
    '#f8fafc': 'var(--daemon-surface-muted)',
    '#f8f9fa': 'var(--daemon-surface-muted)',
    '#f4f7fb': 'var(--daemon-canvas)',
    '#cbd5e5': 'var(--daemon-border-strong)',
    '#cbd5e1': 'var(--daemon-border-strong)',
    '#ccd6e4': 'var(--daemon-border-strong)',
    '#b7c8e5': 'var(--daemon-border-strong)',
    '#d1d5db': 'var(--daemon-border-strong)',
    '#dce2ff': 'var(--daemon-teens-soft)',
    '#ffc414': 'var(--daemon-accent)',
    '#ffd24a': 'var(--daemon-accent)',
    '#ffd166': 'var(--daemon-accent)',
    '#ffd64f': 'var(--daemon-accent)',
    '#fcd34d': 'var(--daemon-accent)',
    '#ca8a04': 'var(--daemon-accent-dark)',
    '#a16207': 'var(--daemon-accent-dark)',
    '#b45309': 'var(--daemon-accent-dark)',
    '#fdfaf6': 'var(--daemon-accent-soft)',
    '#fff8dc': 'var(--daemon-tutor-soft)',
    '#fff7d6': 'var(--daemon-accent-soft)',
    '#fce7db': 'var(--daemon-accent-soft)',
    '#b42331': 'var(--daemon-danger)',
    '#ef4444': 'var(--daemon-danger)',
    '#e11d48': 'var(--daemon-danger)',
    '#b91c1c': 'var(--daemon-danger)',
    '#a61d24': 'var(--daemon-danger)',
    '#7a3034': 'var(--daemon-danger)',
    '#f0b8b8': 'var(--daemon-danger-soft)',
    '#fee2e2': 'var(--daemon-danger-soft)',
    '#ffe5e9': 'var(--daemon-danger-soft)',
    '#fdfbfb': 'var(--daemon-surface)',
    '#ebedee': 'var(--daemon-surface-muted)',
    '#eee': 'var(--daemon-border)',
    '#0a0518': 'var(--daemon-on-accent)',
    '#1a1f36': 'var(--daemon-ink)',
    '#dca003': 'var(--daemon-accent-dark)',
};

// Tailwind arbitrary hex a semantic classes (theme-).
// Solo cuando existe una clase semantica equivalente en tailwind.config.js.
const TAILWIND_HEX_TO_CLASS = {
    'bg-[#172033]': 'bg-daemon-ink',
    'bg-[#5e34d7]': 'bg-daemon-primary',
    'bg-[#5f35d7]': 'bg-daemon-primary',
    'bg-[#24194f]': 'bg-daemon-on-accent',
    'bg-[#180a3a]': 'bg-daemon-on-accent',
    'bg-[#ffc414]': 'bg-daemon-accent',
    'bg-[#ffd64f]': 'bg-daemon-accent',
    'bg-[#ffffff]': 'bg-daemon-surface',
    'bg-[#fff]': 'bg-daemon-surface',
    'text-[#172033]': 'text-daemon-ink',
    'text-[#ffffff]': 'text-daemon-on-primary',
    'text-[#1a1f36]': 'text-daemon-ink',
    'text-[#111827]': 'text-daemon-ink',
    'text-[#ffc414]': 'text-daemon-accent',
    'text-[#5e34d7]': 'text-daemon-primary',
    'text-[#667085]': 'text-daemon-muted',
    'text-[#b42331]': 'text-daemon-danger',
    'border-[#ffc414]': 'border-daemon-accent',
    'border-[#5e34d7]': 'border-daemon-primary',
    'border-[#e4eaf2]': 'border-daemon-border',
    'border-[#cbd5e5]': 'border-daemon-border-strong',
    'border-[#ffffff]': 'border-daemon-surface',
    'via-[#180a3a]': 'via-daemon-on-accent',
    'from-[#0a0518]': 'from-daemon-on-accent',
    'to-[#180a3a]': 'to-daemon-on-accent',
    'ring-[#5e34d7]': 'ring-daemon-primary',
    'ring-[#ffc414]': 'ring-daemon-accent',
    'divide-[#e4eaf2]': 'divide-daemon-border',
    'placeholder-[#667085]': 'placeholder-daemon-muted',
    'decoration-[#5e34d7]': 'decoration-daemon-primary',
    'caret-[#5e34d7]': 'caret-daemon-primary',
    'accent-[#5e34d7]': 'accent-daemon-primary',
    'shadow-[#5e34d7]': 'shadow-daemon-primary',
    'fill-[#5e34d7]': 'fill-daemon-primary',
    'stroke-[#5e34d7]': 'stroke-daemon-primary',
    'outline-[#5e34d7]': 'outline-daemon-primary',
};

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

function replaceHexWithToken(content) {
    let updated = content;
    let count = 0;
    for (const [hex, token] of Object.entries(HEX_TO_TOKEN)) {
        // match hex as a CSS value, surrounded by boundaries that
        // avoid matching in a middle of a word, comment, or url
        const re = new RegExp(
            `(?<![A-Za-z0-9_])(${hex.replace(/^#/, '#')})(?![A-Za-z0-9_])`,
            'gi'
        );
        const before = updated;
        updated = updated.replace(re, token);
        if (updated !== before) {
            const diff = (before.match(re) || []).length;
            count += diff;
        }
    }
    return { updated, count };
}

function replaceTailwindArbitraryHex(content) {
    let updated = content;
    let count = 0;
    for (const [arbitrary, semantic] of Object.entries(TAILWIND_HEX_TO_CLASS)) {
        const re = new RegExp(arbitrary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const before = updated;
        updated = updated.replace(re, semantic);
        if (updated !== before) {
            const diff = (before.match(re) || []).length;
            count += diff;
        }
    }
    return { updated, count };
}

async function main() {
    const files = [];
    for (const dir of SCAN_DIRS) {
        files.push(...(await listFiles(dir)));
    }

    let totalFiles = 0;
    let totalHex = 0;
    let totalTw = 0;
    const reports = [];

    for (const file of files) {
        const content = await readFile(file, 'utf8');
        const r1 = replaceHexWithToken(content);
        const r2 = replaceTailwindArbitraryHex(r1.updated);
        if (r1.count > 0 || r2.count > 0) {
            totalFiles += 1;
            totalHex += r1.count;
            totalTw += r2.count;
            reports.push({
                file: path.relative(projectRoot, file),
                hex: r1.count,
                tw: r2.count,
            });
            if (!dryRun) {
                await writeFile(file, r2.updated, 'utf8');
            }
        }
    }

    console.log(`\n=== apply-token-fixes ${dryRun ? '(DRY-RUN)' : ''} ===`);
    console.log(`Archivos modificados: ${totalFiles}`);
    console.log(`Reemplazos hex -> token: ${totalHex}`);
    console.log(`Reemplazos tailwind arbitrary hex: ${totalTw}`);

    if (reports.length > 0) {
        console.log('\n— Detalle por archivo —');
        for (const r of reports) {
            console.log(`  ${r.file}  (hex: ${r.hex}, tw: ${r.tw})`);
        }
    }
}

main().catch((err) => {
    console.error('Error inesperado:', err);
    process.exitCode = 1;
});
