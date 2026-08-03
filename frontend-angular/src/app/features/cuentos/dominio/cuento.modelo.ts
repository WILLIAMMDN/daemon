import { EstadoCuento } from './estado-cuento';
import { VisibilidadCuento } from './visibilidad-cuento';
import { PaginaCuento } from './pagina-cuento.modelo';

export const VERSION_ESQUEMA_CUENTO = 2 as const;

export type AudienciaCuento = 'KIDS' | 'TEENS';
export type EstadoModeracionCuento = 'no_solicitada' | 'pendiente' | 'aprobado' | 'rechazado';

export interface InstanteCuento {
  readonly milisegundos: number;
}

export interface AutorCuentoSnapshot {
  readonly nombre: string;
  readonly avatarRef: string | null;
}

export interface EstadisticasCuento {
  readonly comentarios: number;
  readonly reacciones: number;
  readonly lecturas: number;
}

export interface Cuento {
  readonly id: string;
  readonly autorUid: string;
  readonly autorUsuarioId: number | null;
  readonly autor: AutorCuentoSnapshot | null;
  readonly titulo: string;
  readonly descripcion: string;
  readonly portadaRef: string | null;
  readonly categoria: string;
  readonly rangoEdad: string;
  readonly paginasBorrador: number;
  readonly palabras: number;
  readonly estado: EstadoCuento;
  readonly visibilidad: VisibilidadCuento;
  readonly audiencia: AudienciaCuento;
  readonly moderacion: EstadoModeracionCuento;
  readonly estadisticas: EstadisticasCuento;
  readonly versionBorradorId: string;
  readonly versionPublicadaId: string | null;
  readonly creadoEn: InstanteCuento;
  readonly actualizadoEn: InstanteCuento;
  readonly publicadoEn: InstanteCuento | null;
  readonly schemaVersion: typeof VERSION_ESQUEMA_CUENTO;
}

export interface VersionCuento {
  readonly id: string;
  readonly cuentoId: string;
  readonly autorUid: string;
  readonly titulo: string;
  readonly sinopsis: string;
  readonly categoria: string;
  readonly rangoEdad: string;
  readonly portadaRef: string | null;
  readonly paginas: number;
  readonly idioma: string;
  readonly palabras: number;
  readonly tiempoLecturaMinutos: number;
  readonly revision: number;
  readonly creadoEn: InstanteCuento;
  readonly actualizadoEn: InstanteCuento;
  readonly schemaVersion: typeof VERSION_ESQUEMA_CUENTO;
}

export interface CuentoDetalle {
  readonly cuento: Cuento;
  readonly version: VersionCuento;
  readonly paginas: readonly PaginaCuento[];
}

export interface IdentidadBorradorCuento {
  readonly cuentoId: string;
  readonly versionId: string;
}

export interface DatosBorradorCuento {
  readonly cuentoId: string;
  readonly versionId: string;
  readonly titulo: string;
  readonly sinopsis: string;
  readonly categoria: string;
  readonly rangoEdad: string;
  readonly portadaRef: string | null;
  readonly paginas: readonly PaginaCuento[];
  readonly revisionEsperada: number;
}
