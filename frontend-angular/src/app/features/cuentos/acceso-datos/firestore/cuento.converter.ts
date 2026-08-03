import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from 'firebase/firestore';
import {
  asegurarMapa,
  leerBooleano,
  leerMapaOpcional,
  leerNumero,
  leerNumeroOpcional,
  leerString,
  leerStringOpcional,
  leerTimestamp,
  leerTimestampOpcional,
  validarCampos,
} from './converter-util';

export interface CuentoFirestoreDto {
  schema_version: number;
  autor_uid: string;
  autor_usuario_id?: number | null;
  autor_perfil?: { nombre: string; avatar_ref: string | null } | null;
  audiencia: string;
  aula_id?: string | null;
  estado: string;
  visibilidad: string;
  version_borrador_id: string;
  version_publicada_id?: string | null;
  moderacion_estado: string;
  titulo_publicado?: string | null;
  sinopsis_publicada?: string | null;
  categoria_publicada?: string | null;
  rango_edad_publicado?: string | null;
  paginas_publicadas?: number | null;
  palabras_publicadas?: number | null;
  portada_ref?: string | null;
  stats?: { comentarios: number; reacciones: number; lecturas: number } | null;
  comentarios_bloqueados: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
  submitted_at?: Timestamp | null;
  published_at?: Timestamp | null;
  deleted_at?: Timestamp | null;
  legacy?: Record<string, unknown> | null;
}

const CAMPOS = [
  'schema_version', 'autor_uid', 'autor_usuario_id', 'autor_perfil', 'audiencia', 'aula_id',
  'estado', 'visibilidad', 'version_borrador_id', 'version_publicada_id', 'moderacion_estado',
  'titulo_publicado', 'sinopsis_publicada', 'categoria_publicada', 'rango_edad_publicado',
  'paginas_publicadas', 'palabras_publicadas', 'portada_ref', 'stats', 'comentarios_bloqueados', 'created_at',
  'updated_at', 'submitted_at', 'published_at', 'deleted_at', 'legacy',
] as const;

export const cuentoConverter: FirestoreDataConverter<CuentoFirestoreDto> = {
  toFirestore(modelo: CuentoFirestoreDto): DocumentData {
    return modelo;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): CuentoFirestoreDto {
    const contexto = `cuentos/${snapshot.id}`;
    const datos = asegurarMapa(snapshot.data(options), contexto);
    validarCampos(datos, CAMPOS, contexto);
    const autorPerfil = leerMapaOpcional(datos, 'autor_perfil', contexto);
    const stats = leerMapaOpcional(datos, 'stats', contexto);

    return {
      schema_version: leerNumero(datos, 'schema_version', contexto),
      autor_uid: leerString(datos, 'autor_uid', contexto),
      autor_usuario_id: leerNumeroOpcional(datos, 'autor_usuario_id', contexto),
      autor_perfil: autorPerfil
        ? {
            nombre: leerString(autorPerfil, 'nombre', `${contexto}.autor_perfil`),
            avatar_ref: leerStringOpcional(autorPerfil, 'avatar_ref', `${contexto}.autor_perfil`),
          }
        : null,
      audiencia: leerString(datos, 'audiencia', contexto),
      aula_id: leerStringOpcional(datos, 'aula_id', contexto),
      estado: leerString(datos, 'estado', contexto),
      visibilidad: leerString(datos, 'visibilidad', contexto),
      version_borrador_id: leerString(datos, 'version_borrador_id', contexto),
      version_publicada_id: leerStringOpcional(datos, 'version_publicada_id', contexto),
      moderacion_estado: leerString(datos, 'moderacion_estado', contexto),
      titulo_publicado: leerStringOpcional(datos, 'titulo_publicado', contexto),
      sinopsis_publicada: leerStringOpcional(datos, 'sinopsis_publicada', contexto),
      categoria_publicada: leerStringOpcional(datos, 'categoria_publicada', contexto),
      rango_edad_publicado: leerStringOpcional(datos, 'rango_edad_publicado', contexto),
      paginas_publicadas: leerNumeroOpcional(datos, 'paginas_publicadas', contexto),
      palabras_publicadas: leerNumeroOpcional(datos, 'palabras_publicadas', contexto),
      portada_ref: leerStringOpcional(datos, 'portada_ref', contexto),
      stats: stats
        ? {
            comentarios: leerNumero(stats, 'comentarios', `${contexto}.stats`),
            reacciones: leerNumero(stats, 'reacciones', `${contexto}.stats`),
            lecturas: leerNumero(stats, 'lecturas', `${contexto}.stats`),
          }
        : null,
      comentarios_bloqueados: leerBooleano(datos, 'comentarios_bloqueados', contexto),
      created_at: leerTimestamp(datos, 'created_at', contexto),
      updated_at: leerTimestamp(datos, 'updated_at', contexto),
      submitted_at: leerTimestampOpcional(datos, 'submitted_at', contexto),
      published_at: leerTimestampOpcional(datos, 'published_at', contexto),
      deleted_at: leerTimestampOpcional(datos, 'deleted_at', contexto),
      legacy: leerMapaOpcional(datos, 'legacy', contexto),
    };
  },
};
