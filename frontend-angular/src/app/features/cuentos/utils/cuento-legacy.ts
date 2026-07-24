/**
 * Utilidades para migrar contenido legacy de DAEMON al sistema nuevo.
 *
 * El sistema viejo de cuentos (antes del editor Quill) guardaba el
 * contenido como un objeto JSON con la forma:
 *
 *   {
 *     bubbles: [{ text: 'Hola mundo', x: 10, y: 20 }, ...],
 *     chars:   [{ src: 'page-1.jpg', x: 5, y: 30 }, ...]
 *   }
 *
 * - `bubbles` son burbujas de diálogo con texto.
 * - `chars` son sprites de personajes colocados sobre un escenario.
 *
 * En el sistema actual sólo nos interesa el TEXTO. Los sprites
 * referencian archivos (`page-1.jpg`, etc.) que ya no existen en el
 * bucket, así que si los renderizamos producimos 404s en consola y
 * placeholders rotos. La migración los descarta.
 */

/**
 * Convierte el contenido legacy a HTML seguro para el editor/visor.
 *
 * Comportamiento:
 * - Si el valor es `null`/`undefined` → devuelve `''`.
 * - Si es un objeto, lo serializa a string.
 * - Si el string NO empieza con `{` ni `[`, se devuelve tal cual
 *   (es HTML/texto normal).
 * - Si parece JSON, lo parsea:
 *     • `bubbles[].text` → concatenados como `<p>`.
 *     • `chars[]`        → descartados con un `console.info` para
 *       auditoría.
 *     • Si no hay nada extraíble, devuelve el string crudo.
 * - Si el parseo falla, devuelve el string crudo (no rompemos nada).
 */
export function migrarContenidoLegacy(raw: unknown): string {
  if (raw == null) return '';
  let str: string;
  if (typeof raw === 'string') {
    str = raw;
  } else {
    try {
      str = JSON.stringify(raw);
    } catch {
      return '';
    }
  }

  const trimmed = str.trim();
  if (!trimmed) return '';

  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return trimmed;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== 'object') return trimmed;

    const fragmentos: string[] = [];

    if (Array.isArray((parsed as any).bubbles)) {
      for (const b of (parsed as any).bubbles) {
        if (b && typeof b === 'object' && typeof b.text === 'string') {
          const limpio = b.text.trim();
          if (limpio) fragmentos.push(limpio);
        } else if (typeof b === 'string') {
          const limpio = b.trim();
          if (limpio) fragmentos.push(limpio);
        }
      }
    }

    if (Array.isArray((parsed as any).chars) && (parsed as any).chars.length > 0) {
      // eslint-disable-next-line no-console
      console.info(
        `[cuentos-legacy] Migración: ${(parsed as any).chars.length} sprite(s) de personaje descartados.`,
      );
    }

    if (fragmentos.length > 0) {
      return fragmentos
        .map((t) => `<p>${escaparHtml(t)}</p>`)
        .join('');
    }
  } catch {
    // No era JSON válido a pesar del { inicial — devolvemos crudo.
  }

  return trimmed;
}

/** Escapa HTML básico para que la sugerencia no rompa el editor. */
function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
