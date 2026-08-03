import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore';
import { asegurarMapa, leerNumero, leerString, leerTimestamp, validarCampos } from './converter-util';

export interface VersionCuentoFirestoreDto {
  schema_version: number;
  autor_uid: string;
  estado: string;
  titulo: string;
  sinopsis: string;
  categoria: string;
  rango_edad: string;
  portada_ref: string | null;
  paginas: number;
  idioma: string;
  palabras: number;
  tiempo_lectura: number;
  revision: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

const CAMPOS = [
  'schema_version', 'autor_uid', 'estado', 'titulo', 'sinopsis', 'categoria', 'rango_edad',
  'portada_ref', 'paginas', 'idioma', 'palabras', 'tiempo_lectura', 'revision', 'created_at', 'updated_at',
] as const;

export const versionCuentoConverter: FirestoreDataConverter<VersionCuentoFirestoreDto> = {
  toFirestore(modelo: VersionCuentoFirestoreDto): DocumentData {
    return modelo;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): VersionCuentoFirestoreDto {
    const contexto = `versiones/${snapshot.id}`;
    const datos = asegurarMapa(snapshot.data(options), contexto);
    validarCampos(datos, CAMPOS, contexto);
    return {
      schema_version: leerNumero(datos, 'schema_version', contexto),
      autor_uid: leerString(datos, 'autor_uid', contexto),
      estado: leerString(datos, 'estado', contexto),
      titulo: leerString(datos, 'titulo', contexto),
      sinopsis: leerString(datos, 'sinopsis', contexto),
      categoria: leerString(datos, 'categoria', contexto),
      rango_edad: leerString(datos, 'rango_edad', contexto),
      portada_ref: datos['portada_ref'] === null ? null : leerString(datos, 'portada_ref', contexto),
      paginas: leerNumero(datos, 'paginas', contexto),
      idioma: leerString(datos, 'idioma', contexto),
      palabras: leerNumero(datos, 'palabras', contexto),
      tiempo_lectura: leerNumero(datos, 'tiempo_lectura', contexto),
      revision: leerNumero(datos, 'revision', contexto),
      created_at: leerTimestamp(datos, 'created_at', contexto),
      updated_at: leerTimestamp(datos, 'updated_at', contexto),
    };
  },
};
