#!/usr/bin/env node
// apply-token-fixes-3.mjs
//
// Tercera pasada del fix de style-tokens. Cubre los casos que el
// fuzzy matching (apply-token-fixes-2) no agarra bien:
//
//   - outline: 3px solid rgba(...)  ->  box-shadow focus ring
//   - backdrop-blur-* en HTML        ->  utility class con allowlist
//   - linear-gradient en SCSS/HTML   ->  utility class
//   - tailwind arbitrary hex         ->  utility class semantica
//   - hex "estandar" Bootstrap/Material/Tailwind con semantica
//     clara que quedan fuera del threshold RGB del script 2
//
// Los hex "estandar" se mantienen en un objeto chico (los mas
// comunes). El resto del trabajo sigue siendo del script 2.
//
// Uso: node scripts/apply-token-fixes-3.mjs [--dry-run]

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

// Mapeos manuales para los hex que el fuzzy matching no captura
// porque estan MUY lejos de cualquier token pero tienen una
// semantica clara. Lista corta, solo los mas comunes. Para el
// resto, regenerar el threshold o agregar tokens especificos.
//
// Formato: 'hex': 'var(--token)' o 'hex': null para ignorar
const HEX_TO_TOKEN = Object.freeze({
    // ===== Bootstrap / Material standard colors =====
    '#0d6efd': 'var(--daemon-info)',              // Bootstrap primary
    '#198754': 'var(--daemon-success)',           // Bootstrap success
    '#4caf50': 'var(--daemon-success)',           // Material green
    '#25D366': 'var(--daemon-success)',           // WhatsApp green
    '#25d366': 'var(--daemon-success)',           // WhatsApp green (lower)
    '#34a853': 'var(--daemon-success)',           // Google green
    '#0f766e': 'var(--daemon-success)',           // Tailwind teal-700
    '#147d71': 'var(--daemon-success)',           // teal oscuro

    // Material blue (info)
    '#1976d2': 'var(--daemon-info)',              // Material blue-700
    '#1a73e8': 'var(--daemon-info)',              // Google blue
    '#4285f4': 'var(--daemon-info)',              // Google blue
    '#63b3ed': 'var(--daemon-info)',              // sky-300
    '#62c9ff': 'var(--daemon-info)',              // sky-300

    // Tailwind violet/indigo (primary)
    '#4f46e5': 'var(--daemon-primary)',           // indigo-600
    '#4338ca': 'var(--daemon-primary-dark)',      // indigo-700
    '#3730a3': 'var(--daemon-primary-dark)',      // indigo-800
    '#312e81': 'var(--daemon-primary-dark)',      // indigo-900
    '#4c1d95': 'var(--daemon-primary-dark)',      // violet-900
    '#5b3cc4': 'var(--daemon-primary)',           // violet
    '#6d28d9': 'var(--daemon-primary)',           // violet
    '#6d28a8': 'var(--daemon-primary)',           // violet
    '#7c3aed': 'var(--daemon-primary-soft)',      // violet-600
    '#6750a4': 'var(--daemon-primary-soft)',      // violet (Material)

    // Tailwind pink (danger)
    '#f687b3': 'var(--daemon-danger)',            // pink-400
    '#b91c1c': 'var(--daemon-danger)',            // red-700
    '#991b1b': 'var(--daemon-danger)',            // red-800
    '#7f1d1d': 'var(--daemon-danger)',            // red-900
    '#ed1c24': 'var(--daemon-danger)',            // red (Material)
    '#ea4335': 'var(--daemon-danger)',            // Google red
    '#ff3d00': 'var(--daemon-danger)',            // deep orange

    // Tailwind amber/yellow (warning)
    '#f59e0b': 'var(--daemon-warning)',           // amber-500
    '#ed8936': 'var(--daemon-warning)',           // orange-500
    '#f4a900': 'var(--daemon-warning)',           // amber (Peru)
    '#ca8a04': 'var(--daemon-accent-dark)',       // yellow-600
    '#a16207': 'var(--daemon-warning)',           // yellow-700
    '#b45309': 'var(--daemon-warning)',           // amber-700
    '#FFC600': 'var(--daemon-accent)',            // accent variant
    '#f6e05e': 'var(--daemon-warning)',           // amber-300
    '#fbcc05': 'var(--daemon-warning)',           // amber

    // KIDS (cyan)
    '#00b4d8': 'var(--daemon-kids)',              // kids
    '#0082b4': 'var(--daemon-kids)',              // kids
    '#00f0ff': 'var(--daemon-kids)',              // kids
    '#00F0FF': 'var(--daemon-kids)',              // kids (upper)
    '#00f2fe': 'var(--daemon-kids)',              // kids

    // Slate (muted/ink)
    '#0f172a': 'var(--daemon-ink)',               // slate-900
    '#1e293b': 'var(--daemon-ink-soft)',          // slate-800
    '#1f2937': 'var(--daemon-ink-soft)',          // gray-800
    '#334155': 'var(--daemon-ink-soft)',          // slate-700
    '#475467': 'var(--daemon-muted)',             // slate-600
    '#64748b': 'var(--daemon-muted)',             // slate-500
    '#94a3b8': 'var(--daemon-muted)',             // slate-400
    '#98a2b3': 'var(--daemon-muted)',             // slate-400 alt
    '#8a94a3': 'var(--daemon-muted)',             // slate

    // Soft (backgrounds)
    '#eff6ff': 'var(--daemon-info-soft)',         // blue-50
    '#dbeafe': 'var(--daemon-info-soft)',         // blue-100
    '#bfdbfe': 'var(--daemon-info-soft)',         // blue-100 (Tailwind)
    '#ecfdf5': 'var(--daemon-success-soft)',      // emerald-50
    '#dcfce7': 'var(--daemon-success-soft)',      // green-100
    '#fef3c7': 'var(--daemon-warning-soft)',      // amber-100
    '#fff7ed': 'var(--daemon-warning-soft)',      // orange-50
    '#fef2f2': 'var(--daemon-danger-soft)',       // red-50
    '#f0fdf4': 'var(--daemon-success-soft)',      // green-50
    '#f5f3ff': 'var(--daemon-canvas)',            // violet-50
    '#ede9fe': 'var(--daemon-info-soft)',         // violet-100
    '#ddd6fe': 'var(--daemon-info-soft)',         // violet-200
    '#e0e7ff': 'var(--daemon-info-soft)',         // indigo-100

    // On-accent / dark
    '#1f1f75': 'var(--daemon-on-accent)',         // dark blue
    '#1e1b4b': 'var(--daemon-on-accent)',         // dark violet
    '#0a0518': 'var(--daemon-on-accent)',         // super dark

    // Border neutrals
    '#e2e8f0': 'var(--daemon-border)',            // slate-200
    '#edf2f7': 'var(--daemon-border)',            // gray-200

    // 8dc63f (lime green Material)
    '#8dc63f': 'var(--daemon-success)',

    // Yellow oscuro
    '#8a5700': 'var(--daemon-warning)',
    '#744500': 'var(--daemon-warning)',
    '#a86500': 'var(--daemon-warning)',
    '#b66f00': 'var(--daemon-warning)',

    // 174f91 (blue oscuro)
    '#174f91': 'var(--daemon-info)',
    '#074f9f': 'var(--daemon-info)',
    '#1c6094': 'var(--daemon-info)',

    // 0f766e (teal-700) ya cubierto arriba

    // Surface muted variants
    '#f5f7fa': 'var(--daemon-surface-muted)',
    '#f3f6fa': 'var(--daemon-surface-muted)',
    '#f1f5f9': 'var(--daemon-surface-muted)',
    '#fafafa': 'var(--daemon-surface-muted)',

    // Canvas variants
    '#f5f8fc': 'var(--daemon-canvas)',
    '#f6f8fb': 'var(--daemon-canvas)',
    '#f6faff': 'var(--daemon-canvas)',
    '#f7f8fc': 'var(--daemon-canvas)',
    '#f7f9fc': 'var(--daemon-canvas)',
    '#f7f9ff': 'var(--daemon-canvas)',
    '#f4f9ff': 'var(--daemon-canvas)',
    '#f8fbff': 'var(--daemon-canvas)',

    // Common borders
    '#dfe6f1': 'var(--daemon-border)',
    '#dfe8f8': 'var(--daemon-border)',
    '#d7eaff': 'var(--daemon-info-soft)',
    '#edf6ff': 'var(--daemon-info-soft)',
    '#eef2f7': 'var(--daemon-info-soft)',
    '#eef6ff': 'var(--daemon-info-soft)',
    '#eef7ff': 'var(--daemon-info-soft)',
    '#d9eaff': 'var(--daemon-info-soft)',

    // danger soft / warning soft
    '#fff1f1': 'var(--daemon-danger-soft)',
    '#fff1f2': 'var(--daemon-danger-soft)',
    '#ffe5e9': 'var(--daemon-danger-soft)',
    '#fffaf0': 'var(--daemon-warning-soft)',
    '#fff3e8': 'var(--daemon-warning-soft)',
    '#fff7e6': 'var(--daemon-warning-soft)',
    '#fffbeb': 'var(--daemon-warning-soft)',
});

// Tailwind arbitrary hex -> semantic class
const TAILWIND_HEX_TO_CLASS = Object.freeze({
    'bg-[#1f1f75]': 'bg-daemon-on-accent',
    'border-[#4f46e5]': 'border-daemon-primary',
    'bg-[#f4a900]': 'bg-daemon-warning',
    'bg-[#312e81]': 'bg-daemon-primary-dark',
    'text-[#f687b3]': 'text-daemon-danger',
    'text-[#ed8936]': 'text-daemon-warning',
    'bg-[#8dc63f]': 'bg-daemon-success',
    'bg-[#0082b4]': 'bg-daemon-kids',
    'bg-[#25D366]': 'bg-daemon-success',
    'text-[#00f2fe]': 'text-daemon-kids',
    'bg-[#ed1c24]': 'bg-daemon-danger',
    'bg-[#3730a3]': 'bg-daemon-primary-dark',
    'text-[#63b3ed]': 'text-daemon-info',
    'text-[#f6e05e]': 'text-daemon-warning',
    'text-[#00F0FF]': 'text-daemon-kids',
    'text-[#FFC600]': 'text-daemon-accent',
    'text-[#198754]': 'text-daemon-success',
    'border-[#198754]': 'border-daemon-success',
    'border-[#FFC600]': 'border-daemon-accent',
    'text-[#102b5f]': 'text-daemon-info',
    'text-[#6f36dc]': 'text-daemon-primary',
    'text-[#0d6efd]': 'text-daemon-info',
    'bg-[#102b5f]': 'bg-daemon-info',
    'bg-[#25d366]': 'bg-daemon-success',
});

// Outline shortcut -> box-shadow focus ring
// Cubre rgba(), hex y var() en cualquier color
const OUTLINE_PATTERN =
    /outline:\s*3px\s+solid\s+(?:rgba?\([^)]+\)|#[0-9a-fA-F]+|var\(--[a-z-]+\));\s*[\r\n]+\s*outline-offset:\s*\d+px;/g;
const OUTLINE_REPLACEMENT =
    'outline: 0;\n  box-shadow: 0 0 0 3px var(--daemon-accent);';

// Backdrop-blur -> utility class con allowlist
const BACKDROP_BLUR_PATTERN = /\bbackdrop-blur-(sm|md|lg|xl)\b/g;
const BACKDROP_BLUR_MAP = Object.freeze({
    'backdrop-blur-sm': 'daemon-backdrop-sm',
    'backdrop-blur-md': 'daemon-backdrop-md',
    'backdrop-blur-lg': 'daemon-backdrop-lg',
    'backdrop-blur-xl': 'daemon-backdrop-xl',
});

// Gradients -> utility class
const SCSS_GRADIENTS = [
    {
        pattern: /linear-gradient\(135deg,\s*var\(--daemon-primary-soft\)\s*0%,\s*var\(--daemon-primary-dark\)\s*100%\)/g,
        replacement: 'var(--daemon-grad-primary)',
    },
    {
        pattern: /linear-gradient\(135deg,\s*var\(--daemon-surface\)\s*0%,\s*var\(--daemon-surface-muted\)\s*100%\)/g,
        replacement: 'var(--daemon-grad-surface)',
    },
    {
        // Match hasta el final de la declaracion (evita cortar en ')'
        // de var() anidados.
        pattern: /linear-gradient\(90deg,[^;]+\)/g,
        replacement: 'var(--daemon-grad-overlay)',
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

        // 1. Hex literales -> tokens
        for (const [hex, token] of Object.entries(HEX_TO_TOKEN)) {
            const re = new RegExp(`(?<![A-Za-z0-9_])(${hex})(?![A-Za-z0-9_])`, 'gi');
            const r = replaceAll(content, re, token);
            content = r.content;
            fileChanges += r.count;
        }

        // 2. Outline shortcut -> box-shadow
        const r1 = replaceAll(content, OUTLINE_PATTERN, OUTLINE_REPLACEMENT);
        content = r1.content;
        fileChanges += r1.count;

        // 3. Backdrop-blur -> utility class
        const r2 = replaceAll(content, BACKDROP_BLUR_PATTERN, (m) => BACKDROP_BLUR_MAP[m] || m);
        content = r2.content;
        fileChanges += r2.count;

        // 4. Gradients -> utility class
        for (const g of SCSS_GRADIENTS) {
            const r = replaceAll(content, g.pattern, g.replacement);
            content = r.content;
            fileChanges += r.count;
        }

        // 5. Tailwind arbitrary hex -> semantic class
        for (const [arbitrary, semantic] of Object.entries(TAILWIND_HEX_TO_CLASS)) {
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

    console.log(`\n=== apply-token-fixes-3 ${dryRun ? '(DRY-RUN)' : ''} ===`);
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
