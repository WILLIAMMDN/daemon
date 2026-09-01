#!/usr/bin/env node
/**
 * wcag-contrast.mjs
 * --------------------------------------------------------------
 * Calcula el ratio de contraste WCAG 2.1 entre dos colores hex.
 * Referencia: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 *
 *   sRGB -> linear:    L = 0.2126*R + 0.7152*G + 0.0722*B
 *   ratio:            (L1 + 0.05) / (L2 + 0.05)  con L1 >= L2
 *
 * Uso:  node scripts/dev/wcag-contrast.mjs <fg-hex> <bg-hex>
 *       node scripts/dev/wcag-contrast.mjs               # corre bateria DAEMON
 */
import process from 'node:process';

function hexToRgb(hex) {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (full.length !== 6) throw new Error(`Hex invalido: ${hex}`);
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relativeLuminance({ r, g, b }) {
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
}

function contrastRatio(fgHex, bgHex) {
  const fg = relativeLuminance(hexToRgb(fgHex));
  const bg = relativeLuminance(hexToRgb(bgHex));
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

function classify(ratio) {
  // Texto normal: AA >= 4.5, AAA >= 7.  Texto grande (>=18.66px bold o >=24px): AA >= 3, AAA >= 4.5.
  // UI no textual: AA >= 3.
  return {
    'AA texto normal (>= 4.5)':     ratio >= 4.5 ? 'PASA' : 'NO PASA',
    'AAA texto normal (>= 7)':     ratio >= 7   ? 'PASA' : 'NO PASA',
    'AA texto grande (>= 3)':      ratio >= 3   ? 'PASA' : 'NO PASA',
    'AAA texto grande (>= 4.5)':   ratio >= 4.5 ? 'PASA' : 'NO PASA',
    'UI no textual (>= 3)':        ratio >= 3   ? 'PASA' : 'NO PASA',
  };
}

const pairs = [
  // Cita textual del brief
  ['#FFFFFF', '#10105D', 'white sobre navy-900  (sidebar, texto)'],
  ['#B9C0E4', '#10105D', 'sidebar-muted sobre navy-900  (texto secundario)'],
  ['#10105D', '#FEC514', 'navy-900 sobre yellow-500  (CTA KIDS, item activo)'],
  ['#FFFFFF', '#5630CE', 'white sobre purple-600  (boton ranking)'],
  ['#FFFFFF', '#EB590C', 'white sobre orange-500  (misiones, CTA)'],
  ['#FFFFFF', '#16A34A', 'white sobre success-#16A34A  (boton)'],
  ['#667085', '#FFFFFF', 'muted sobre white  (texto secundario sobre surface)'],
  ['#98A2B3', '#FFFFFF', 'disabled sobre white  (texto deshabilitado)'],
  ['#76CF1A', '#FFFFFF', 'green-500 sobre white  (acento KIDS en tarjeta blanca)'],
  ['#FEC514', '#FFFFFF', 'yellow-500 sobre white  (acento sobre surface)'],
  // Complementos utiles
  ['#FFFFFF', '#76CF1A', 'white sobre green-500  (progreso, success)'],
  ['#10105D', '#FFFFFF', 'navy-900 sobre white  (texto principal sobre surface)'],
  ['#5630CE', '#FFFFFF', 'purple-600 sobre white  (label, kicker)'],
  ['#5630CE', '#FEC514', 'purple-600 sobre yellow-500  (mini-progress en hero)'],
  ['#172033', '#FFFFFF', 'ink-#172033 sobre white  (texto principal)'],
  ['#172033', '#F4F7FB', 'ink-#172033 sobre canvas  (texto principal sobre canvas)'],
  ['#EB590C', '#FFFFFF', 'orange-500 sobre white  (label, kicker)'],
  ['#16A34A', '#FFFFFF', 'success-#16A34A sobre white  (label, kicker)'],
  ['#667085', '#10105D', 'muted sobre navy-900  (texto secundario sobre sidebar)'],
  ['#CBD5E1', '#10105D', 'border-strong sobre navy-900  (divisor)'],
  // Las opacidades (rgba(255,255,255,0.86)) se evalúan aparte componiendo
  // contra navy-900 segun la formula WCAG; ver 02-COLOR-ACCESSIBILITY-REPORT-V1.md.
];

if (process.argv.length >= 4) {
  const [, , fg, bg] = process.argv;
  const ratio = contrastRatio(fg, bg);
  console.log(`${fg} sobre ${bg}: ${ratio.toFixed(2)}`);
  console.log(classify(ratio));
} else {
  console.log('DAEMON — Contraste WCAG 2.1 (texto y UI)');
  console.log('============================================');
  console.log('Pair                                      Ratio     AA-txt   AAA-txt  AA-big   UI');
  console.log('-------------------------------------------------------------------------------------');
  for (const [fg, bg, label] of pairs) {
    const ratio = contrastRatio(fg, bg);
    const c = classify(ratio);
    const aaTxt = c['AA texto normal (>= 4.5)'] === 'PASA' ? '✅' : '❌';
    const aaaTxt = c['AAA texto normal (>= 7)'] === 'PASA' ? '✅' : '❌';
    const aaBig = c['AA texto grande (>= 3)'] === 'PASA' ? '✅' : '❌';
    const ui = c['UI no textual (>= 3)'] === 'PASA' ? '✅' : '❌';
    const labelShort = label.length > 38 ? label.slice(0, 37) + '…' : label.padEnd(38);
    console.log(`${labelShort}  ${ratio.toFixed(2).padStart(5)}    ${aaTxt}      ${aaaTxt}      ${aaBig}     ${ui}`);
  }
  console.log('-------------------------------------------------------------------------------------');
  console.log('Abreviaturas: AA-txt = AA texto normal · AAA-txt = AAA texto normal ·');
  console.log('              AA-big = AA texto grande (>=18.66px bold o >=24px) ·');
  console.log('              UI = UI no textual (>=3, controles, graficos, iconos).');
}
