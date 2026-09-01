/**
 * Contrato real de `/alumno/aprendizaje` (AcademicoController@alumno).
 *
 * El backend devuelve los cursos publicados de las aulas del estudiante con sus
 * unidades, lecciones, objetivos de aprendizaje y el progreso del propio alumno.
 * Estos tipos son la única fuente para todas las vistas de Aprender.
 */

export type EstadoAprendizaje = 'notStarted' | 'inProgress' | 'completed';

export interface ProgresoLeccion {
  estado: EstadoAprendizaje;
  porcentaje: number;
}

/** Evidencia académica (Mastery). No se deriva de XP ni de Daems. */
export interface ObjetivoAprendizaje {
  id: number;
  codigo?: string | null;
  descripcion: string;
  marco?: string | null;
  nivel?: string | null;
}

export interface Leccion {
  id: number;
  titulo: string;
  resumen?: string | null;
  duracion_minutos?: number | null;
  progresos: ProgresoLeccion[];
  objetivos?: ObjetivoAprendizaje[];
}

export interface Unidad {
  id: number;
  titulo: string;
  descripcion?: string | null;
  lecciones: Leccion[];
}

export interface Curso {
  id: number;
  titulo: string;
  descripcion?: string | null;
  nivel?: string | null;
  ilustracion_url?: string | null;
  unidades: Unidad[];
}

export interface ResumenAprendizaje {
  cursos: number;
  lecciones: number;
  completadas: number;
  porcentaje: number;
}

export interface AprendizajeResponse {
  cursos: Curso[];
  resumen: ResumenAprendizaje;
}

// ===== Vistas derivadas =====

export interface LeccionVista extends Leccion {
  progresoActual: ProgresoLeccion;
  orden: number;
}

export interface UnidadVista extends Omit<Unidad, 'lecciones'> {
  orden: number;
  lecciones: LeccionVista[];
  totalLecciones: number;
  leccionesCompletadas: number;
  porcentaje: number;
  estado: EstadoAprendizaje;
}

export interface CursoVista extends Omit<Curso, 'unidades'> {
  unidades: UnidadVista[];
  totalLecciones: number;
  leccionesCompletadas: number;
  porcentaje: number;
  estado: EstadoAprendizaje;
  estadoLabel: string;
  textoBusqueda: string;
  ilustracionUrl: string | null;
  /** Siguiente lección sin completar; `null` cuando el curso está terminado. */
  siguienteLeccion: LeccionVista | null;
  duracionMinutos: number;
  /** Objetivos de aprendizaje distintos cubiertos por el curso. */
  objetivosTotales: number;
  /** Objetivos cubiertos por lecciones ya completadas (evidencia de Mastery). */
  objetivosLogrados: number;
}

export const ETIQUETA_ESTADO_APRENDIZAJE: Record<EstadoAprendizaje, string> = {
  notStarted: 'Por iniciar',
  inProgress: 'En progreso',
  completed: 'Completado',
};

export function progresoDeLeccion(leccion: Leccion): ProgresoLeccion {
  return leccion.progresos?.[0] ?? { estado: 'notStarted', porcentaje: 0 };
}

export function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es');
}

function estadoDesdeConteo(total: number, completadas: number, hayProgreso: boolean): EstadoAprendizaje {
  if (total > 0 && completadas === total) return 'completed';
  return hayProgreso || completadas > 0 ? 'inProgress' : 'notStarted';
}

export function construirCursoVista(curso: Curso): CursoVista {
  const unidades = (curso.unidades ?? []).map<UnidadVista>((unidad, indice) => {
    const lecciones = (unidad.lecciones ?? []).map<LeccionVista>((leccion, posicion) => ({
      ...leccion,
      orden: posicion + 1,
      progresoActual: progresoDeLeccion(leccion),
    }));
    const completadas = lecciones.filter((leccion) => leccion.progresoActual.estado === 'completed').length;
    const enCurso = lecciones.some((leccion) => leccion.progresoActual.estado === 'inProgress');

    return {
      ...unidad,
      orden: indice + 1,
      lecciones,
      totalLecciones: lecciones.length,
      leccionesCompletadas: completadas,
      porcentaje: lecciones.length ? Math.round((completadas * 100) / lecciones.length) : 0,
      estado: estadoDesdeConteo(lecciones.length, completadas, enCurso),
    };
  });

  const lecciones = unidades.flatMap((unidad) => unidad.lecciones);
  const completadas = lecciones.filter((leccion) => leccion.progresoActual.estado === 'completed').length;
  const enCurso = lecciones.some((leccion) => leccion.progresoActual.estado === 'inProgress');
  const estado = estadoDesdeConteo(lecciones.length, completadas, enCurso);

  const objetivos = new Map<number, boolean>();
  for (const leccion of lecciones) {
    const logrado = leccion.progresoActual.estado === 'completed';
    for (const objetivo of leccion.objetivos ?? []) {
      objetivos.set(objetivo.id, (objetivos.get(objetivo.id) ?? false) || logrado);
    }
  }

  const textoBusqueda = normalizarTexto(
    [
      curso.titulo,
      curso.descripcion,
      curso.nivel,
      ...unidades.flatMap((unidad) => [
        unidad.titulo,
        unidad.descripcion,
        ...unidad.lecciones.map((leccion) => leccion.titulo),
      ]),
    ]
      .filter(Boolean)
      .join(' '),
  );

  return {
    ...curso,
    unidades,
    totalLecciones: lecciones.length,
    leccionesCompletadas: completadas,
    porcentaje: lecciones.length ? Math.round((completadas * 100) / lecciones.length) : 0,
    estado,
    estadoLabel: ETIQUETA_ESTADO_APRENDIZAJE[estado],
    textoBusqueda,
    ilustracionUrl: curso.ilustracion_url ?? null,
    siguienteLeccion: lecciones.find((leccion) => leccion.progresoActual.estado !== 'completed') ?? null,
    duracionMinutos: lecciones.reduce((total, leccion) => total + (leccion.duracion_minutos ?? 0), 0),
    objetivosTotales: objetivos.size,
    objetivosLogrados: [...objetivos.values()].filter(Boolean).length,
  };
}
