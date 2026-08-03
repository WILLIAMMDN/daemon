import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore';
import { asegurarMapa, leerNumero, leerString, leerStringOpcional, leerTimestamp, validarCampos } from './converter-util';

export interface PaginaCuentoFirestoreDto {
  schema_version: number;
  autor_uid: string;
  orden: number;
  contenido: string;
  ilustracion_ref: string | null;
  texto_alternativo: string;
  fondo_token: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

const CAMPOS = [
  'schema_version', 'autor_uid', 'orden', 'contenido', 'ilustracion_ref', 'texto_alternativo',
  'fondo_token', 'created_at', 'updated_at',
] as const;

export const paginaCuentoConverter: FirestoreDataConverter<PaginaCuentoFirestoreDto> = {
  toFirestore(modelo: PaginaCuentoFirestoreDto): DocumentData {
    return modelo;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): PaginaCuentoFirestoreDto {
    const contexto = `paginas/${snapshot.id}`;
    const datos = asegurarMapa(snapshot.data(options), contexto);
    validarCampos(datos, CAMPOS, contexto);
    return {
      schema_version: leerNumero(datos, 'schema_version', contexto),
      autor_uid: leerString(datos, 'autor_uid', contexto),
      orden: leerNumero(datos, 'orden', contexto),
      contenido: leerString(datos, 'contenido', contexto),
      ilustracion_ref: leerStringOpcional(datos, 'ilustracion_ref', contexto),
      texto_alternativo: leerString(datos, 'texto_alternativo', contexto),
      fondo_token: leerString(datos, 'fondo_token', contexto),
      created_at: leerTimestamp(datos, 'created_at', contexto),
      updated_at: leerTimestamp(datos, 'updated_at', contexto),
    };
  },
};
