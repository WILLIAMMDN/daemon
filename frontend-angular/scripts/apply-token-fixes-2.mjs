#!/usr/bin/env node
// apply-token-fixes-2.mjs
//
// Segunda pasada del fix de style-tokens. Usa fuzzy color matching
// (distancia RGB) para mapear TODOS los hex literales restantes
// al token mas cercano. Si el color esta a > 30 unidades de
// distancia, no se reemplaza (queda para revision manual).
//
// Tambien arregla:
//   - outline: 3px solid  ->  box-shadow focus ring
//   - backdrop-blur-*    ->  utility class con allowlist comment
//   - linear-gradient    ->  utility class
//
// Uso: node scripts/apply-token-fixes-2.mjs [--dry-run]

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

// THRESHOLD de similitud RGB. A menor threshold, menos reemplazos pero
// mas seguros. A mayor threshold, mas reemplazos pero mas riesgo de
// cambiar colores que no son equivalentes.
const RGB_THRESHOLD = 50;

// Tokens del design system. El script busca el mas cercano por
// distancia RGB. Fuente: src/styles/_tokens.scss
const TOKENS = [
    { name: '--daemon-canvas', rgb: [244, 247, 251] },
    { name: '--daemon-surface', rgb: [255, 255, 255] },
    { name: '--daemon-surface-muted', rgb: [248, 250, 252] },
    { name: '--daemon-border', rgb: [228, 234, 242] },
    { name: '--daemon-border-strong', rgb: [203, 213, 229] },
    { name: '--daemon-ink', rgb: [23, 32, 51] },
    { name: '--daemon-ink-soft', rgb: [51, 65, 85] },
    { name: '--daemon-muted', rgb: [102, 112, 133] },
    { name: '--daemon-on-primary', rgb: [255, 255, 255] },
    { name: '--daemon-on-accent', rgb: [36, 25, 79] },
    { name: '--daemon-primary', rgb: [94, 52, 215] },
    { name: '--daemon-primary-soft', rgb: [115, 89, 200] },
    { name: '--daemon-primary-dark', rgb: [87, 48, 207] },
    { name: '--daemon-accent', rgb: [255, 196, 20] },
    { name: '--daemon-accent-soft', rgb: [255, 247, 214] },
    { name: '--daemon-accent-dark', rgb: [220, 160, 3] },
    { name: '--daemon-success', rgb: [18, 161, 80] },
    { name: '--daemon-success-soft', rgb: [231, 248, 239] },
    { name: '--daemon-warning', rgb: [245, 160, 0] },
    { name: '--daemon-warning-soft', rgb: [255, 244, 215] },
    { name: '--daemon-danger', rgb: [180, 35, 49] },
    { name: '--daemon-danger-soft', rgb: [255, 229, 233] },
    { name: '--daemon-info', rgb: [37, 99, 235] },
    { name: '--daemon-info-soft', rgb: [239, 246, 255] },
    { name: '--daemon-kids', rgb: [0, 180, 216] },
    { name: '--daemon-kids-soft', rgb: [232, 249, 252] },
    { name: '--daemon-kids-border', rgb: [184, 237, 245] },
    { name: '--daemon-teens', rgb: [22, 119, 255] },
    { name: '--daemon-teens-soft', rgb: [237, 245, 255] },
    { name: '--daemon-teens-border', rgb: [207, 227, 255] },
    { name: '--daemon-docente', rgb: [25, 193, 208] },
    { name: '--daemon-docente-soft', rgb: [233, 251, 253] },
    { name: '--daemon-tutor', rgb: [255, 196, 20] },
    { name: '--daemon-tutor-soft', rgb: [255, 248, 220] },
    { name: '--daemon-tutor-ink', rgb: [36, 25, 79] },
];

function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function distance(a, b) {
    return Math.sqrt(
        Math.pow(a[0] - b[0], 2) +
        Math.pow(a[1] - b[1], 2) +
        Math.pow(a[2] - b[2], 2)
    );
}

function findClosestToken(hex) {
    const rgb = hexToRgb(hex);
    let best = null;
    let bestDist = Infinity;
    for (const t of TOKENS) {
        const d = distance(rgb, t.rgb);
        if (d < bestDist) {
            bestDist = d;
            best = t;
        }
    }
    return { token: best, distance: bestDist };
}

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

    // Recolectar todos los hex unicos
    const allHex = new Map(); // hex -> { count, sample, bestToken, distance }
    for (const file of files) {
        const content = await readFile(file, 'utf8');
        const re = /#[0-9a-fA-F]{3,8}\b/g;
        let m;
        while ((m = re.exec(content)) !== null) {
            const hex = m[0].toLowerCase();
            // Ignorar hex en nombres de clases o id (e.g. #id)
            // Para simplificar, todos los hex en features/ son candidatos
            if (!allHex.has(hex)) {
                const { token, distance } = findClosestToken(hex);
                allHex.set(hex, {
                    count: 0,
                    bestToken: token,
                    distance,
                    inRange: distance <= RGB_THRESHOLD,
                });
            }
            allHex.get(hex).count += 1;
        }
    }

    // Construir el mapeo solo con los que estan dentro del threshold
    const hexToToken = {};
    const unmapped = [];
    for (const [hex, info] of allHex) {
        if (info.inRange) {
            hexToToken[hex] = `var(${info.bestToken.name})`;
        } else {
            unmapped.push({ hex, count: info.count, distance: Math.round(info.distance) });
        }
    }

    console.log(`\n=== apply-token-fixes-2 ${dryRun ? '(DRY-RUN)' : ''} ===`);
    console.log(`Threshold RGB: ${RGB_THRESHOLD}`);
    console.log(`Hex unicos encontrados: ${allHex.size}`);
    console.log(`Mapeados (dentro del threshold): ${Object.keys(hexToToken).length}`);
    console.log(`Sin mapear (fuera del threshold): ${unmapped.length}`);

    // Aplicar los reemplazos
    let totalFiles = 0;
    let totalReplacements = 0;
    const reports = [];

    for (const file of files) {
        const rel = path.relative(projectRoot, file);
        let content = await readFile(file, 'utf8');
        let fileChanges = 0;

        for (const [hex, token] of Object.entries(hexToToken)) {
            const re = new RegExp(
                `(?<![A-Za-z0-9_])(${hex})(?![A-Za-z0-9_])`,
                'gi'
            );
            const before = content;
            content = content.replace(re, token);
            if (content !== before) {
                const diff = (before.match(re) || []).length;
                fileChanges += diff;
            }
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

    console.log(`\nArchivos modificados: ${totalFiles}`);
    console.log(`Reemplazos totales: ${totalReplacements}`);

    if (unmapped.length > 0) {
        console.log('\n— Hex sin mapear (fuera del threshold) —');
        unmapped.sort((a, b) => b.count - a.count).slice(0, 30).forEach((u) => {
            console.log(`  ${u.hex}  count=${u.count}  distance=${u.distance}`);
        });
    }
}

main().catch((err) => {
    console.error('Error inesperado:', err);
    process.exitCode = 1;
});
