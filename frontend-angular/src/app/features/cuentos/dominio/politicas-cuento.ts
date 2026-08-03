import { DatosBorradorCuento } from './cuento.modelo';
import { ErrorCuento } from './errores-cuento';
import { PaginaCuento } from './pagina-cuento.modelo';

const MAXIMO_PAGINAS = 100;
const MAXIMO_CONTENIDO_PAGINA = 20_000;

export function validarBorradorCuento(datos: DatosBorradorCuento): void {
  if (!datos.titulo.trim() || datos.titulo.trim().length > 120) {
    throw new ErrorCuento('DATOS_INVALIDOS', 'El título debe tener entre 1 y 120 caracteres.', false);
  }
  if (datos.sinopsis.length > 500) {
    throw new ErrorCuento('DATOS_INVALIDOS', 'La sinopsis no puede superar 500 caracteres.', false);
  }
  if (datos.paginas.length < 1 || datos.paginas.length > MAXIMO_PAGINAS) {
    throw new ErrorCuento('DATOS_INVALIDOS', 'El cuento debe tener entre 1 y 100 páginas.', false);
  }

  const ids = new Set<string>();
  datos.paginas.forEach((pagina, indice) => validarPagina(pagina, indice, ids));
}

function validarPagina(pagina: PaginaCuento, indice: number, ids: Set<string>): void {
  if (!pagina.id || ids.has(pagina.id)) {
    throw new ErrorCuento('DATOS_INVALIDOS', 'Cada página necesita un identificador único.', false);
  }
  ids.add(pagina.id);
  if (pagina.orden !== indice + 1) {
    throw new ErrorCuento('DATOS_INVALIDOS', 'El orden de las páginas no es consistente.', false);
  }
  if (pagina.contenido.length > MAXIMO_CONTENIDO_PAGINA) {
    throw new ErrorCuento('DATOS_INVALIDOS', `La página ${indice + 1} supera el límite permitido.`, false);
  }
  if (pagina.ilustracionRef?.startsWith('data:')) {
    throw new ErrorCuento('DATOS_INVALIDOS', 'Las imágenes deben guardarse como referencias de Storage.', false);
  }
}

export function contarPalabras(paginas: readonly PaginaCuento[]): number {
  const texto = paginas.map((pagina) => pagina.contenido.replace(/<[^>]*>?/g, ' ')).join(' ');
  return texto.trim() ? texto.trim().split(/\s+/).length : 0;
}

export function minutosLectura(palabras: number): number {
  return palabras === 0 ? 0 : Math.ceil(palabras / 150);
}
