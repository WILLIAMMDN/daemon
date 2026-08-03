import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore';
import { asegurarMapa, leerNumero, leerString, leerTimestamp, validarCampos } from './converter-util';

export interface ReaccionFirestoreDto {
  schema_version: number;
  usuario_uid: string;
  tipo: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

const CAMPOS = ['schema_version', 'usuario_uid', 'tipo', 'created_at', 'updated_at'] as const;

export const reaccionConverter: FirestoreDataConverter<ReaccionFirestoreDto> = {
  toFirestore(modelo: ReaccionFirestoreDto): DocumentData {
    return modelo;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): ReaccionFirestoreDto {
    const contexto = `reacciones/${snapshot.id}`;
    const datos = asegurarMapa(snapshot.data(options), contexto);
    validarCampos(datos, CAMPOS, contexto);
    return {
      schema_version: leerNumero(datos, 'schema_version', contexto),
      usuario_uid: leerString(datos, 'usuario_uid', contexto),
      tipo: leerString(datos, 'tipo', contexto),
      created_at: leerTimestamp(datos, 'created_at', contexto),
      updated_at: leerTimestamp(datos, 'updated_at', contexto),
    };
  },
};
