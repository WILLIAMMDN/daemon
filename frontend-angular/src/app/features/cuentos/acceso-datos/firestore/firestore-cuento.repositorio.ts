import { Injectable, inject } from '@angular/core';
import {
  QueryDocumentSnapshot,
  QueryConstraint,
  UpdateData,
  WithFieldValue,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  where,
  writeBatch,
} from 'firebase/firestore';
import { FirebaseAuth } from '../../../../core/servicios/firebase-auth';
import { FirestoreApp } from '../../../../core/servicios/firestore-app';
import { ComentarioCuento, EstadoComentarioCuento } from '../../dominio/comentario-cuento.modelo';
import {
  AudienciaCuento,
  Cuento,
  CuentoDetalle,
  DatosBorradorCuento,
  EstadoModeracionCuento,
  IdentidadBorradorCuento,
  VERSION_ESQUEMA_CUENTO,
  VersionCuento,
} from '../../dominio/cuento.modelo';
import { ErrorCuento, normalizarErrorCuento } from '../../dominio/errores-cuento';
import { EstadoCuento, esEstadoCuento } from '../../dominio/estado-cuento';
import { PaginaCuento } from '../../dominio/pagina-cuento.modelo';
import { esVisibilidadCuento } from '../../dominio/visibilidad-cuento';
import { contarPalabras, minutosLectura, validarBorradorCuento } from '../../dominio/politicas-cuento';
import {
  CuentoRepositorio,
  CursorCuentos,
  PaginaResultados,
} from '../cuento.repositorio';
import { ComentarioFirestoreDto, comentarioConverter } from './comentario.converter';
import { CuentoFirestoreDto, cuentoConverter } from './cuento.converter';
import { PaginaCuentoFirestoreDto, paginaCuentoConverter } from './pagina-cuento.converter';
import { VersionCuentoFirestoreDto, versionCuentoConverter } from './version-cuento.converter';

const ESTADOS_PROPIOS: readonly EstadoCuento[] = [
  'borrador', 'en_revision', 'publicado', 'rechazado', 'archivado',
];

@Injectable({ providedIn: 'root' })
export class FirestoreCuentoRepositorio implements CuentoRepositorio {
  private readonly firestore = inject(FirestoreApp);
  private readonly firebaseAuth = inject(FirebaseAuth);

  reservarIdentidad(): IdentidadBorradorCuento {
    const db = this.firestore.db();
    const cuentoRef = doc(collection(db, 'cuentos'));
    const versionRef = doc(collection(db, 'cuentos', cuentoRef.id, 'versiones'));
    return { cuentoId: cuentoRef.id, versionId: versionRef.id };
  }

  async crearBorrador(datos: DatosBorradorCuento, audiencia: AudienciaCuento): Promise<CuentoDetalle> {
    validarBorradorCuento(datos);
    try {
      const uid = await this.firebaseAuth.uidActual();
      const db = this.firestore.db();
      const cuentoRef = doc(db, 'cuentos', datos.cuentoId).withConverter(cuentoConverter);
      const versionRef = doc(db, 'cuentos', datos.cuentoId, 'versiones', datos.versionId)
        .withConverter(versionCuentoConverter);
      const batch = writeBatch(db);
      const palabras = contarPalabras(datos.paginas);

      const cuento: WithFieldValue<CuentoFirestoreDto> = {
        schema_version: VERSION_ESQUEMA_CUENTO,
        autor_uid: uid,
        audiencia,
        estado: 'borrador',
        visibilidad: 'privado',
        version_borrador_id: datos.versionId,
        moderacion_estado: 'no_solicitada',
        comentarios_bloqueados: true,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };
      const version: WithFieldValue<VersionCuentoFirestoreDto> = {
        schema_version: VERSION_ESQUEMA_CUENTO,
        autor_uid: uid,
        estado: 'borrador',
        titulo: datos.titulo.trim(),
        sinopsis: datos.sinopsis,
        categoria: datos.categoria,
        rango_edad: datos.rangoEdad,
        portada_ref: datos.portadaRef,
        paginas: datos.paginas.length,
        idioma: 'es-PE',
        palabras,
        tiempo_lectura: minutosLectura(palabras),
        revision: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      batch.set(cuentoRef, cuento);
      batch.set(versionRef, version);
      for (const pagina of datos.paginas) {
        const paginaRef = doc(
          db,
          'cuentos',
          datos.cuentoId,
          'versiones',
          datos.versionId,
          'paginas',
          pagina.id,
        ).withConverter(paginaCuentoConverter);
        batch.set(paginaRef, this.paginaNuevaParaEscritura(pagina, uid));
      }
      await batch.commit();
      return await this.obtenerDetalle(datos.cuentoId);
    } catch (error) {
      throw normalizarErrorCuento(error);
    }
  }

  async actualizarBorrador(datos: DatosBorradorCuento): Promise<CuentoDetalle> {
    validarBorradorCuento(datos);
    try {
      const uid = await this.firebaseAuth.uidActual();
      const db = this.firestore.db();
      const cuentoRef = doc(db, 'cuentos', datos.cuentoId).withConverter(cuentoConverter);
      const versionRef = doc(db, 'cuentos', datos.cuentoId, 'versiones', datos.versionId)
        .withConverter(versionCuentoConverter);
      const paginasColeccion = collection(
        db,
        'cuentos',
        datos.cuentoId,
        'versiones',
        datos.versionId,
        'paginas',
      ).withConverter(paginaCuentoConverter);
      const existentes = await getDocs(query(paginasColeccion, orderBy('orden', 'asc'), limit(100)));
      const existentesPorId = new Map(existentes.docs.map((snapshot) => [snapshot.id, snapshot.ref]));
      const palabras = contarPalabras(datos.paginas);

      await runTransaction(db, async (transaccion) => {
        const cuentoSnapshot = await transaccion.get(cuentoRef);
        const versionSnapshot = await transaccion.get(versionRef);
        for (const ref of existentesPorId.values()) await transaccion.get(ref);
        if (!cuentoSnapshot.exists() || !versionSnapshot.exists()) {
          throw new ErrorCuento('NO_ENCONTRADO', 'El borrador ya no existe.', false);
        }
        const cuento = cuentoSnapshot.data();
        const version = versionSnapshot.data();
        if (cuento.autor_uid !== uid || version.autor_uid !== uid) {
          throw new ErrorCuento('NO_AUTORIZADO', 'Este borrador pertenece a otra cuenta.', false);
        }
        // El autor edita su borrador, y también la versión de un cuento
        // publicado propio (borrador y publicada coinciden tras publicar).
        const versionCoincide = cuento.estado === 'borrador'
          ? cuento.version_borrador_id === datos.versionId
          : cuento.estado === 'publicado' && cuento.version_publicada_id === datos.versionId;
        if (!versionCoincide) {
          throw new ErrorCuento('NO_AUTORIZADO', 'La versión ya no admite edición.', false);
        }
        if (version.revision !== datos.revisionEsperada) {
          throw new ErrorCuento(
            'CONFLICTO_REVISION',
            'El borrador cambió en otra pestaña. Conservamos tu copia local para que puedas recuperarla.',
            true,
          );
        }

        transaccion.update(cuentoRef, {
          updated_at: serverTimestamp(),
        });
        transaccion.update(versionRef, {
          titulo: datos.titulo.trim(),
          sinopsis: datos.sinopsis,
          categoria: datos.categoria,
          rango_edad: datos.rangoEdad,
          portada_ref: datos.portadaRef,
          paginas: datos.paginas.length,
          palabras,
          tiempo_lectura: minutosLectura(palabras),
          revision: version.revision + 1,
          updated_at: serverTimestamp(),
        });

        const idsSiguientes = new Set(datos.paginas.map((pagina) => pagina.id));
        for (const pagina of datos.paginas) {
          const ref = doc(paginasColeccion, pagina.id);
          if (existentesPorId.has(pagina.id)) {
            transaccion.update(ref, this.paginaParaActualizacion(pagina));
          } else {
            transaccion.set(ref, this.paginaNuevaParaEscritura(pagina, uid));
          }
        }
        for (const [id, ref] of existentesPorId) {
          if (!idsSiguientes.has(id)) transaccion.delete(ref);
        }
      });

      return await this.obtenerDetalle(datos.cuentoId);
    } catch (error) {
      throw normalizarErrorCuento(error);
    }
  }

  async obtenerDetalle(cuentoId: string): Promise<CuentoDetalle> {
    try {
      const uid = await this.firebaseAuth.uidActual();
      const db = this.firestore.db();
      const cuentoSnapshot = await getDoc(doc(db, 'cuentos', cuentoId).withConverter(cuentoConverter));
      if (!cuentoSnapshot.exists()) throw new ErrorCuento('NO_ENCONTRADO', 'Cuento no encontrado.', false);
      const cuentoDto = cuentoSnapshot.data();
      const esPropio = cuentoDto.autor_uid === uid;
      const versionId = esPropio ? cuentoDto.version_borrador_id : cuentoDto.version_publicada_id;
      if (!versionId) throw new ErrorCuento('NO_AUTORIZADO', 'El cuento todavía no tiene una versión visible.', false);
      const versionSnapshot = await getDoc(
        doc(db, 'cuentos', cuentoId, 'versiones', versionId).withConverter(versionCuentoConverter),
      );
      if (!versionSnapshot.exists()) throw new ErrorCuento('NO_ENCONTRADO', 'La versión del cuento no existe.', false);
      const paginasSnapshot = await getDocs(
        query(
          collection(db, 'cuentos', cuentoId, 'versiones', versionId, 'paginas')
            .withConverter(paginaCuentoConverter),
          orderBy('orden', 'asc'),
          limit(100),
        ),
      );
      const version = this.mapearVersion(cuentoId, versionSnapshot.id, versionSnapshot.data());
      return {
        cuento: this.enriquecerConVersion(this.mapearCuento(cuentoSnapshot.id, cuentoDto), version),
        version,
        paginas: paginasSnapshot.docs.map((snapshot) =>
          this.mapearPagina(cuentoId, versionId, snapshot.id, snapshot.data()),
        ),
      };
    } catch (error) {
      throw normalizarErrorCuento(error);
    }
  }

  async listarGaleria(cursor?: CursorCuentos, maximo = 24): Promise<PaginaResultados<Cuento>> {
    try {
      const db = this.firestore.db();
      const coleccion = collection(db, 'cuentos').withConverter(cuentoConverter);
      const restricciones: QueryConstraint[] = [
        where('schema_version', '==', VERSION_ESQUEMA_CUENTO),
        where('estado', '==', 'publicado'),
        where('visibilidad', '==', 'comunidad'),
        where('moderacion_estado', '==', 'aprobado'),
        orderBy('updated_at', 'desc'),
        limit(Math.min(Math.max(maximo, 1), 50)),
      ];
      if (cursor?.valor) {
        restricciones.splice(restricciones.length - 1, 0, startAfter(cursor.valor as QueryDocumentSnapshot<CuentoFirestoreDto>));
      }
      const snapshot = await getDocs(query(coleccion, ...restricciones));
      const ultimo = snapshot.docs.at(-1) ?? null;
      return {
        elementos: snapshot.docs.map((item) => this.mapearCuento(item.id, item.data())),
        siguienteCursor: snapshot.docs.length === Math.min(Math.max(maximo, 1), 50) && ultimo
          ? { valor: ultimo }
          : null,
      };
    } catch (error) {
      throw normalizarErrorCuento(error);
    }
  }

  async listarPropios(maximo = 20): Promise<readonly Cuento[]> {
    try {
      const uid = await this.firebaseAuth.uidActual();
      const snapshot = await getDocs(
        query(
          collection(this.firestore.db(), 'cuentos').withConverter(cuentoConverter),
          where('schema_version', '==', VERSION_ESQUEMA_CUENTO),
          where('autor_uid', '==', uid),
          where('estado', 'in', ESTADOS_PROPIOS),
          orderBy('updated_at', 'desc'),
          limit(Math.min(Math.max(maximo, 1), 50)),
        ),
      );
      return await Promise.all(snapshot.docs.map(async (item) => {
        const cuento = this.mapearCuento(item.id, item.data());
        const versionSnapshot = await getDoc(
          doc(this.firestore.db(), 'cuentos', item.id, 'versiones', cuento.versionBorradorId)
            .withConverter(versionCuentoConverter),
        );
        return versionSnapshot.exists()
          ? this.enriquecerConVersion(cuento, this.mapearVersion(item.id, versionSnapshot.id, versionSnapshot.data()))
          : cuento;
      }));
    } catch (error) {
      throw normalizarErrorCuento(error);
    }
  }

  async listarComentarios(
    cuentoId: string,
    cursor?: CursorCuentos,
    maximo = 20,
  ): Promise<PaginaResultados<ComentarioCuento>> {
    try {
      const coleccion = collection(this.firestore.db(), 'cuentos', cuentoId, 'comentarios')
        .withConverter(comentarioConverter);
      const restricciones: QueryConstraint[] = [
        where('schema_version', '==', VERSION_ESQUEMA_CUENTO),
        where('estado', '==', 'visible'),
        orderBy('created_at', 'asc'),
        limit(Math.min(Math.max(maximo, 1), 50)),
      ];
      if (cursor?.valor) {
        restricciones.splice(restricciones.length - 1, 0, startAfter(cursor.valor as QueryDocumentSnapshot<ComentarioFirestoreDto>));
      }
      const snapshot = await getDocs(query(coleccion, ...restricciones));
      const ultimo = snapshot.docs.at(-1) ?? null;
      return {
        elementos: snapshot.docs.map((item) => this.mapearComentario(cuentoId, item.id, item.data())),
        siguienteCursor: snapshot.docs.length === Math.min(Math.max(maximo, 1), 50) && ultimo
          ? { valor: ultimo }
          : null,
      };
    } catch (error) {
      // Un cuento con comentarios bloqueados (borrador propio, o moderado)
      // no admite lista directa: se muestra como "sin comentarios" en vez
      // de un error. Los errores reales (red, esquema) sí se propagan.
      const normalizado = normalizarErrorCuento(error);
      if (normalizado.codigo === 'NO_AUTORIZADO') {
        return { elementos: [], siguienteCursor: null };
      }
      throw normalizado;
    }
  }

  private paginaNuevaParaEscritura(
    pagina: PaginaCuento,
    uid: string,
  ): WithFieldValue<PaginaCuentoFirestoreDto> {
    return {
      schema_version: VERSION_ESQUEMA_CUENTO,
      autor_uid: uid,
      orden: pagina.orden,
      contenido: pagina.contenido,
      ilustracion_ref: pagina.ilustracionRef,
      texto_alternativo: pagina.textoAlternativo,
      fondo_token: pagina.fondoToken,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
  }

  private paginaParaActualizacion(pagina: PaginaCuento): UpdateData<PaginaCuentoFirestoreDto> {
    return {
      orden: pagina.orden,
      contenido: pagina.contenido,
      ilustracion_ref: pagina.ilustracionRef,
      texto_alternativo: pagina.textoAlternativo,
      fondo_token: pagina.fondoToken,
      updated_at: serverTimestamp(),
    };
  }

  private mapearCuento(id: string, datos: CuentoFirestoreDto): Cuento {
    if (datos.schema_version !== VERSION_ESQUEMA_CUENTO || !esEstadoCuento(datos.estado)
      || !esVisibilidadCuento(datos.visibilidad)
      || !['KIDS', 'TEENS'].includes(datos.audiencia)
      || !['no_solicitada', 'pendiente', 'aprobado', 'rechazado'].includes(datos.moderacion_estado)) {
      throw new ErrorCuento('DATOS_INVALIDOS', `El cuento ${id} usa un contrato no soportado.`, false);
    }
    return {
      id,
      autorUid: datos.autor_uid,
      autorUsuarioId: datos.autor_usuario_id ?? null,
      autor: datos.autor_perfil
        ? { nombre: datos.autor_perfil.nombre, avatarRef: datos.autor_perfil.avatar_ref }
        : null,
      titulo: datos.titulo_publicado ?? '',
      descripcion: datos.sinopsis_publicada ?? '',
      portadaRef: datos.portada_ref ?? null,
      categoria: datos.categoria_publicada ?? 'Sin clasificar',
      rangoEdad: datos.rango_edad_publicado ?? '',
      paginasBorrador: datos.paginas_publicadas ?? 0,
      palabras: datos.palabras_publicadas ?? 0,
      estado: datos.estado,
      visibilidad: datos.visibilidad,
      audiencia: datos.audiencia as AudienciaCuento,
      moderacion: datos.moderacion_estado as EstadoModeracionCuento,
      estadisticas: datos.stats ?? { comentarios: 0, reacciones: 0, lecturas: 0 },
      versionBorradorId: datos.version_borrador_id,
      versionPublicadaId: datos.version_publicada_id ?? null,
      creadoEn: { milisegundos: datos.created_at.toMillis() },
      actualizadoEn: { milisegundos: datos.updated_at.toMillis() },
      publicadoEn: datos.published_at ? { milisegundos: datos.published_at.toMillis() } : null,
      schemaVersion: VERSION_ESQUEMA_CUENTO,
    };
  }

  private mapearVersion(cuentoId: string, id: string, datos: VersionCuentoFirestoreDto): VersionCuento {
    if (datos.schema_version !== VERSION_ESQUEMA_CUENTO) {
      throw new ErrorCuento('DATOS_INVALIDOS', `La versión ${id} no es compatible.`, false);
    }
    return {
      id,
      cuentoId,
      autorUid: datos.autor_uid,
      titulo: datos.titulo,
      sinopsis: datos.sinopsis,
      categoria: datos.categoria,
      rangoEdad: datos.rango_edad,
      portadaRef: datos.portada_ref,
      paginas: datos.paginas,
      idioma: datos.idioma,
      palabras: datos.palabras,
      tiempoLecturaMinutos: datos.tiempo_lectura,
      revision: datos.revision,
      creadoEn: { milisegundos: datos.created_at.toMillis() },
      actualizadoEn: { milisegundos: datos.updated_at.toMillis() },
      schemaVersion: VERSION_ESQUEMA_CUENTO,
    };
  }

  private enriquecerConVersion(cuento: Cuento, version: VersionCuento): Cuento {
    return {
      ...cuento,
      titulo: version.titulo,
      descripcion: version.sinopsis,
      portadaRef: version.portadaRef,
      categoria: version.categoria,
      rangoEdad: version.rangoEdad,
      paginasBorrador: version.paginas,
      palabras: version.palabras,
    };
  }

  private mapearPagina(
    cuentoId: string,
    versionId: string,
    id: string,
    datos: PaginaCuentoFirestoreDto,
  ): PaginaCuento {
    return {
      id,
      cuentoId,
      versionId,
      orden: datos.orden,
      contenido: datos.contenido,
      ilustracionRef: datos.ilustracion_ref,
      textoAlternativo: datos.texto_alternativo,
      fondoToken: datos.fondo_token,
      sugerencia: null,
      creadoEn: { milisegundos: datos.created_at.toMillis() },
      actualizadoEn: { milisegundos: datos.updated_at.toMillis() },
      schemaVersion: VERSION_ESQUEMA_CUENTO,
    };
  }

  private mapearComentario(
    cuentoId: string,
    id: string,
    datos: ComentarioFirestoreDto,
  ): ComentarioCuento {
    if (!['visible', 'oculto', 'eliminado', 'spam'].includes(datos.estado)) {
      throw new ErrorCuento('DATOS_INVALIDOS', `El comentario ${id} tiene un estado inválido.`, false);
    }
    return {
      id,
      cuentoId,
      autorUid: datos.autor_uid,
      cuerpo: datos.cuerpo,
      estado: datos.estado as EstadoComentarioCuento,
      creadoEn: { milisegundos: datos.created_at.toMillis() },
      actualizadoEn: { milisegundos: datos.updated_at.toMillis() },
      schemaVersion: VERSION_ESQUEMA_CUENTO,
    };
  }
}
