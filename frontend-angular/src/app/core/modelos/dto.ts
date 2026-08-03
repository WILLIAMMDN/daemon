/**
 * core/modelos/dto.ts
 *
 * DTOs compartidos del frontend, derivados del contrato real que las páginas
 * consumen (rutas /api/v1 y la forma de las respuestas que ya procesan los
 * servicios). Viven en `core` para que `features` los importe; `shared` NO
 * debe importar `core` (regla de arquitectura).
 */

// ===== Académico / organización =====

export interface Aula {
  id: number;
  nombre: string;
  nivel?: string | null;
  codigo?: string | null;
  alumnos_count?: number;
  docentes_count?: number;
  usuarios_count?: number;
}

export interface AlcanceAcademico {
  tipo: 'global' | 'aula' | 'sin_aula' | string;
  titulo: string;
  descripcion: string;
  aula?: Aula | null;
}

/** Envoltorios que el backend usa según el endpoint: arreglo directo o `{ data }`. */
export interface RespuestaPagina<T> {
  data?: T[];
  alcance?: AlcanceAcademico | null;
}

/** Alumno tal como lo devuelve /docente/alumnos. */
export interface AlumnoDocente {
  id: number;
  nombre_completo: string;
  usuario: string;
  nivel?: string | null;
  rango?: string | null;
  tokens: number;
  id_aula?: number | null;
  aula?: Aula | null;
}

/** Docente tal como lo devuelve /docente/docentes. */
export interface DocenteUsuario {
  id: number;
  nombre_completo: string;
  usuario: string;
  id_aula?: number | null;
  aula?: Aula | null;
}

export interface Insignia {
  id: number;
  nombre: string;
  descripcion?: string | null;
  imagen?: string | null;
  fecha?: string | null;
}

export interface MovimientoToken {
  id: number;
  fecha: string;
  alumno_nombre: string;
  tipo: 'ingreso' | 'egreso' | string;
  cantidad: number;
  concepto: string;
}

/**
 * Envoltorio flexible de listas: el backend a veces devuelve un arreglo
 * directo y otras `{ data, alcance }` o `{ alumnos, alcance }` según el
 * endpoint y el rol del docente.
 */
export interface RespuestaColeccion<T> {
  data?: T[];
  alcance?: AlcanceAcademico | null;
  alumnos?: T[];
  docentes?: T[];
  insignias?: T[];
  aulas?: T[];
}

export type RespuestaLista<T> = T[] | RespuestaColeccion<T>;

/**
 * Respuesta de /certificados y /certificados/{usuario} usada por el
 * certificado académico y el carnet imprimible.
 */
export interface CertificadoData {
  usuario: {
    nombre_completo: string;
    usuario: string;
    nivel: string;
    tokens: number;
  };
  emitido_en: string;
  insignias: Insignia[];
}

// ===== Tienda =====

export interface CosmeticoPremio {
  codigo: string;
  slot: string;
  rareza: string;
  asset_capa?: string | null;
  asset_miniatura?: string | null;
  orden_capa: number;
  especies: number[];
  activo: boolean;
}

export interface PremioTienda {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  imagen?: string | null;
  categoria: string;
  tipo_entrega: string;
  ya_posee?: boolean;
  cosmetico?: CosmeticoPremio | null;
}

export interface RespuestaTienda {
  saldo: number;
  premios: PremioTienda[];
}

export interface RespuestaCanje {
  saldo: number;
  cosmetico?: { nombre: string } | null;
  codigo?: string | null;
}

export interface Canje {
  id: number;
  nombre?: string | null;
  descripcion?: string | null;
  estado: 'pendiente' | 'entregado' | string;
  tipo_entrega?: string | null;
  fecha?: string | null;
  dato_publico?: string | null;
  dato_privado?: string | null;
  alumno?: string | null;
  premio?: string | null;
}

export interface EspecieMascota {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  asset_base?: string | null;
  asset_miniatura?: string | null;
  lienzo_ancho: number;
  lienzo_alto: number;
  orden: number;
  activo: boolean;
}

export interface SlotMascota {
  codigo: string;
  etiqueta?: string;
  orden_sugerido: number;
}

export interface ConfiguracionMascota {
  especies: EspecieMascota[];
  slots: SlotMascota[];
  rarezas: string[];
}

export interface RespuestaAdministracionTienda {
  premios: PremioTienda[];
  canjes: Canje[];
  mascota: ConfiguracionMascota;
}

/** Formulario de creación/edición de un premio (sin id de persistencia). */
export interface PremioForm {
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  imagen?: string | null;
  categoria: string;
  tipo_entrega: string;
  cosmetico: CosmeticoPremio;
}

// ===== Competencia =====

export interface RondaCompetencia {
  estado: 'espera' | 'votacion' | 'cerrado' | string;
  duracion?: number | null;
  promedio_alumnos?: number | null;
}

export interface CandidatoCompetencia {
  id: number;
  nombre_completo: string;
  usuario: string;
  nivel: string;
  avatar?: string | null;
}

export interface VotoCompetencia {
  puntuacion: number;
  comentario?: string | null;
}

export interface EstadoCompetencia {
  ronda: RondaCompetencia;
  candidato?: CandidatoCompetencia | null;
  promedio?: number | null;
  mi_voto?: VotoCompetencia | null;
}

export interface RondaHistorial {
  id: number;
  fecha: string;
  nivel: string;
  ganador_nombre: string;
  ganador_promedio: number;
}
