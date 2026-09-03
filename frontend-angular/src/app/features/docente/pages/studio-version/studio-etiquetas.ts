/**
 * Etiquetas en español para el vocabulario canónico del Learning Core.
 *
 * El dominio sigue siendo canónico (`leccion`, `laboratorio`, `external_link`…);
 * esto es sólo presentación. Un valor desconocido se muestra tal cual en lugar
 * de ocultarse, para que el contenido heredado nunca desaparezca de la vista.
 */

export const ETIQUETAS_TIPO: Readonly<Record<string, string>> = {
  leccion: 'Lección',
  practica: 'Práctica',
  mision: 'Misión',
  laboratorio: 'Laboratorio',
  evaluacion: 'Evaluación',
  proyecto: 'Proyecto',
  desafio: 'Desafío',
};

export const ETIQUETAS_MODALIDAD: Readonly<Record<string, string>> = {
  text: 'Texto',
  structured: 'Estructurada',
  image: 'Imagen',
  pdf: 'PDF',
  external_link: 'Enlace externo',
};

export const ETIQUETAS_MODO: Readonly<Record<string, string>> = {
  manual_review: 'Revisión docente',
  passing_score: 'Puntaje mínimo',
  submission: 'Entrega',
  lesson_completion: 'Lectura completa',
};

export const ETIQUETAS_BLOQUE: Readonly<Record<string, string>> = {
  concepto: 'Concepto',
  ejemplo: 'Ejemplo',
  instrucciones: 'Instrucciones',
  pasos: 'Pasos',
  pregunta: 'Pregunta',
  reflexion: 'Reflexión',
  criterios_exito: 'Criterios de éxito',
};

export const ETIQUETAS_AUDIENCIA: Readonly<Record<string, string>> = {
  KIDS: 'Kids',
  TEENS: 'Teens',
  TODOS: 'Todas',
};

export const ETIQUETAS_ETAPA: Readonly<Record<string, string>> = {
  inicial: 'Inicial',
  intermedia: 'Intermedia',
  avanzada: 'Avanzada',
};

export function etiqueta(diccionario: Readonly<Record<string, string>>, valor: string): string {
  return diccionario[valor] ?? valor;
}
