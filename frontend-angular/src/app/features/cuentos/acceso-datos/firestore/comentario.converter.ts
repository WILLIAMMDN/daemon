import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore';
import { asegurarMapa, leerNumero, leerString, leerTimestamp, validarCampos } from './converter-util';

export interface ComentarioFirestoreDto {
  schema_version: number;
  autor_uid: string;
  cuerpo: string;
  estado: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

const CAMPOS = ['schema_version', 'autor_uid', 'cuerpo', 'estado', 'created_at', 'updated_at'] as const;

export const comentarioConverter: FirestoreDataConverter<ComentarioFirestoreDto> = {
  toFirestore(modelo: ComentarioFirestoreDto): DocumentData {
    return modelo;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): ComentarioFirestoreDto {
    const contexto = `comentarios/${snapshot.id}`;
    const datos = asegurarMapa(snapshot.data(options), contexto);
    validarCampos(datos, CAMPOS, contexto);
    return {
      schema_version: leerNumero(datos, 'schema_version', contexto),
      autor_uid: leerString(datos, 'autor_uid', contexto),
      cuerpo: leerString(datos, 'cuerpo', contexto),
      estado: leerString(datos, 'estado', contexto),
      created_at: leerTimestamp(datos, 'created_at', contexto),
      updated_at: leerTimestamp(datos, 'updated_at', contexto),
    };
  },
};
