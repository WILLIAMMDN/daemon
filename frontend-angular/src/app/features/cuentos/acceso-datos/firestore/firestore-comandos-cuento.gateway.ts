import { Injectable, inject } from '@angular/core';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { FirebaseAuth } from '../../../../core/servicios/firebase-auth';
import { FirestoreApp } from '../../../../core/servicios/firestore-app';
import { Sesion } from '../../../../core/servicios/sesion';
import { reportarError } from '../../../../core/servicios/observabilidad';
import { ComentarioCuento } from '../../dominio/comentario-cuento.modelo';
import { VERSION_ESQUEMA_CUENTO } from '../../dominio/cuento.modelo';
import { ErrorCuento, normalizarErrorCuento } from '../../dominio/errores-cuento';
import {
  TIPOS_REACCION_CUENTO,
  TipoReaccionCuento,
  esTipoReaccionCuento,
} from '../../dominio/reaccion-cuento.modelo';
import {
  ComandosCuentoGateway,
  EstadisticasInteraccionCuento,
  ResultadoComandoCuento,
} from '../comandos-cuento.gateway';

interface CuentoRaizDto {
  schema_version: number;
  autor_uid: string;
  audiencia: 'KIDS' | 'TEENS';
  estado: string;
  visibilidad: string;
  version_borrador_id: string;
  version_publicada_id: string | null;
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
  deleted_at?: Timestamp | null;
}

interface VersionDto {
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

/**
 * Ejecuta los comandos del módulo de cuentos directamente contra Firestore
 * desde el navegador, sin pasar por el API de Laravel. Las reglas validaan
 * cada transición (publicación directa del autor, eliminación suave,
 * comentarios y reacciones con contadores transaccionales).
 */
@Injectable({ providedIn: 'root' })
export class FirestoreComandosCuentoGateway implements ComandosCuentoGateway {
  private readonly firestore = inject(FirestoreApp);
  private readonly firebaseAuth = inject(FirebaseAuth);
  private readonly sesion = inject(Sesion);

  async solicitarPublicacion(cuentoId: string, _idempotencia: string): Promise<ResultadoComandoCuento> {
    try {
      const uid = await this.firebaseAuth.uidActual();
      const db = this.firestore.db();
      const cuentoRef = doc(db, 'cuentos', cuentoId);
      const cuentoSnapshot = await getDoc(cuentoRef);
      if (!cuentoSnapshot.exists()) {
        throw new ErrorCuento('NO_ENCONTRADO', 'El cuento ya no existe.', false);
      }
      const cuento = cuentoSnapshot.data() as CuentoRaizDto;
      if (cuento.autor_uid !== uid) {
        throw new ErrorCuento('NO_AUTORIZADO', 'Solo el autor puede publicar este cuento.', false);
      }
      if (cuento.estado === 'eliminado') {
        throw new ErrorCuento('NO_ENCONTRADO', 'El cuento ya no existe.', false);
      }
      if (cuento.estado === 'publicado') {
        return { estado: 'publicado', repetido: true };
      }
      if (cuento.estado !== 'borrador') {
        throw new ErrorCuento('NO_AUTORIZADO', 'El cuento ya no admite publicación.', false);
      }

      const versionId = cuento.version_borrador_id;
      const versionSnapshot = await getDoc(doc(db, 'cuentos', cuentoId, 'versiones', versionId));
      if (!versionSnapshot.exists()) {
        throw new ErrorCuento('NO_ENCONTRADO', 'La versión del cuento no existe.', false);
      }
      const version = versionSnapshot.data() as VersionDto;
      const usuario = this.sesion.usuario();

      await updateDoc(cuentoRef, {
        estado: 'publicado',
        visibilidad: 'comunidad',
        moderacion_estado: 'aprobado',
        version_publicada_id: versionId,
        titulo_publicado: version.titulo,
        sinopsis_publicada: version.sinopsis,
        categoria_publicada: version.categoria,
        rango_edad_publicado: version.rango_edad,
        paginas_publicadas: version.paginas,
        palabras_publicadas: version.palabras,
        portada_ref: version.portada_ref,
        autor_perfil: {
          nombre: usuario?.nombre_completo || usuario?.usuario || 'Autor DAEMON',
          avatar_ref: usuario?.avatar ?? null,
        },
        comentarios_bloqueados: false,
        submitted_at: serverTimestamp(),
        published_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      return { estado: 'publicado', repetido: false };
    } catch (error) {
      throw normalizarErrorCuento(error);
    }
  }

  async eliminar(cuentoId: string, _idempotencia: string): Promise<ResultadoComandoCuento> {
    try {
      const uid = await this.firebaseAuth.uidActual();
      const db = this.firestore.db();
      const cuentoRef = doc(db, 'cuentos', cuentoId);
      const cuentoSnapshot = await getDoc(cuentoRef);
      if (!cuentoSnapshot.exists()) {
        throw new ErrorCuento('NO_ENCONTRADO', 'El cuento ya no existe.', false);
      }
      const cuento = cuentoSnapshot.data() as CuentoRaizDto;
      if (cuento.autor_uid !== uid) {
        throw new ErrorCuento('NO_AUTORIZADO', 'Solo el autor puede eliminar este cuento.', false);
      }
      if (cuento.estado === 'eliminado') {
        return { estado: 'eliminado', repetido: true };
      }
      await updateDoc(cuentoRef, {
        estado: 'eliminado',
        deleted_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      return { estado: 'eliminado', repetido: false };
    } catch (error) {
      throw normalizarErrorCuento(error);
    }
  }

  async comentar(cuentoId: string, cuerpo: string, _idempotencia: string): Promise<ComentarioCuento> {
    try {
      const uid = await this.firebaseAuth.uidActual();
      const db = this.firestore.db();
      const comentarioRef = doc(collection(db, 'cuentos', cuentoId, 'comentarios'));
      const cuentoRef = doc(db, 'cuentos', cuentoId);
      const comentarioId = comentarioRef.id;
      const ahora = Date.now();

      await runTransaction(db, async (transaccion) => {
        const cuentoSnapshot = await transaccion.get(cuentoRef);
        if (!cuentoSnapshot.exists()) {
          throw new ErrorCuento('NO_ENCONTRADO', 'El cuento ya no existe.', false);
        }
        const cuento = cuentoSnapshot.data() as CuentoRaizDto;
        const stats = cuento.stats ?? { comentarios: 0, reacciones: 0, lecturas: 0 };
        transaccion.set(comentarioRef, {
          schema_version: VERSION_ESQUEMA_CUENTO,
          autor_uid: uid,
          cuerpo,
          estado: 'visible',
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        transaccion.update(cuentoRef, {
          stats: { ...stats, comentarios: stats.comentarios + 1 },
          updated_at: serverTimestamp(),
        });
      });

      return {
        id: comentarioId,
        cuentoId,
        autorUid: uid,
        cuerpo,
        estado: 'visible',
        creadoEn: { milisegundos: ahora },
        actualizadoEn: { milisegundos: ahora },
        schemaVersion: VERSION_ESQUEMA_CUENTO,
      };
    } catch (error) {
      throw normalizarErrorCuento(error);
    }
  }

  async editarComentario(cuentoId: string, comentarioId: string, cuerpo: string): Promise<ComentarioCuento> {
    try {
      await this.firebaseAuth.uidActual();
      const ref = doc(this.firestore.db(), 'cuentos', cuentoId, 'comentarios', comentarioId);
      await updateDoc(ref, { cuerpo, updated_at: serverTimestamp() });
      const snapshot = await getDoc(ref);
      const datos = snapshot.data() as {
        autor_uid: string;
        cuerpo: string;
        estado: string;
        created_at?: Timestamp;
        updated_at?: Timestamp;
      };
      return this.mapearComentario(cuentoId, comentarioId, datos);
    } catch (error) {
      throw normalizarErrorCuento(error);
    }
  }

  async eliminarComentario(cuentoId: string, comentarioId: string): Promise<void> {
    try {
      const uid = await this.firebaseAuth.uidActual();
      const db = this.firestore.db();
      const comentarioRef = doc(db, 'cuentos', cuentoId, 'comentarios', comentarioId);
      const cuentoRef = doc(db, 'cuentos', cuentoId);

      await runTransaction(db, async (transaccion) => {
        const comentarioSnapshot = await transaccion.get(comentarioRef);
        if (!comentarioSnapshot.exists()) {
          throw new ErrorCuento('NO_ENCONTRADO', 'El comentario ya no existe.', false);
        }
        const comentario = comentarioSnapshot.data() as { autor_uid: string; estado: string };
        if (comentario.autor_uid !== uid) {
          throw new ErrorCuento('NO_AUTORIZADO', 'Solo el autor puede eliminar su comentario.', false);
        }
        if (comentario.estado === 'visible') {
          const cuentoSnapshot = await transaccion.get(cuentoRef);
          const cuento = cuentoSnapshot.exists()
            ? (cuentoSnapshot.data() as CuentoRaizDto)
            : null;
          const stats = cuento?.stats ?? { comentarios: 0, reacciones: 0, lecturas: 0 };
          transaccion.update(cuentoRef, {
            stats: { ...stats, comentarios: Math.max(0, stats.comentarios - 1) },
            updated_at: serverTimestamp(),
          });
        }
        transaccion.update(comentarioRef, {
          estado: 'eliminado',
          updated_at: serverTimestamp(),
        });
      });
    } catch (error) {
      throw normalizarErrorCuento(error);
    }
  }

  async reaccionar(
    cuentoId: string,
    tipo: TipoReaccionCuento | null,
    _idempotencia: string,
  ): Promise<void> {
    try {
      const uid = await this.firebaseAuth.uidActual();
      const db = this.firestore.db();
      const reaccionId = `${cuentoId}_${uid}`;
      const reaccionRef = doc(db, 'cuentos', cuentoId, 'reacciones', reaccionId);
      const cuentoRef = doc(db, 'cuentos', cuentoId);

      await runTransaction(db, async (transaccion) => {
        const cuentoSnapshot = await transaccion.get(cuentoRef);
        if (!cuentoSnapshot.exists()) {
          throw new ErrorCuento('NO_ENCONTRADO', 'El cuento ya no existe.', false);
        }
        const cuento = cuentoSnapshot.data() as CuentoRaizDto;
        const stats = cuento.stats ?? { comentarios: 0, reacciones: 0, lecturas: 0 };
        const reaccionSnapshot = await transaccion.get(reaccionRef);

        if (tipo === null) {
          if (reaccionSnapshot.exists()) {
            transaccion.delete(reaccionRef);
            transaccion.update(cuentoRef, {
              stats: { ...stats, reacciones: Math.max(0, stats.reacciones - 1) },
              updated_at: serverTimestamp(),
            });
          }
          return;
        }
        if (reaccionSnapshot.exists()) {
          transaccion.update(reaccionRef, { tipo, updated_at: serverTimestamp() });
        } else {
          transaccion.set(reaccionRef, {
            schema_version: VERSION_ESQUEMA_CUENTO,
            usuario_uid: uid,
            tipo,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          });
          transaccion.update(cuentoRef, {
            stats: { ...stats, reacciones: stats.reacciones + 1 },
            updated_at: serverTimestamp(),
          });
        }
      });
    } catch (error) {
      throw normalizarErrorCuento(error);
    }
  }

  async obtenerEstadisticas(cuentoId: string): Promise<EstadisticasInteraccionCuento> {
    const vacias = (): EstadisticasInteraccionCuento => ({
      comentarios: 0,
      reacciones: { total: 0, propia: null, porTipo: this.conteosVacios() },
    });
    try {
      const uid = await this.firebaseAuth.uidActual();
      const db = this.firestore.db();
      const cuentoSnapshot = await getDoc(doc(db, 'cuentos', cuentoId));
      if (!cuentoSnapshot.exists()) return vacias();
      const cuento = cuentoSnapshot.data() as CuentoRaizDto;
      const stats = cuento.stats ?? { comentarios: 0, reacciones: 0, lecturas: 0 };

      const [reaccionesSnapshot, propiaSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'cuentos', cuentoId, 'reacciones'), limit(100))),
        getDoc(doc(db, 'cuentos', cuentoId, 'reacciones', `${cuentoId}_${uid}`)),
      ]);

      const porTipo = this.conteosVacios();
      let total = 0;
      for (const documento of reaccionesSnapshot.docs) {
        const dato = documento.data() as { tipo?: string };
        if (esTipoReaccionCuento(dato.tipo)) {
          porTipo[dato.tipo] += 1;
          total += 1;
        }
      }
      if (!Number.isFinite(stats.reacciones) || stats.reacciones < 0 || stats.reacciones > total) {
        // Los contadores de la raíz son transaccionales; si el total real de
        // documentos no coincide, se prefiere el conteo real de Firestore.
        total = total > 0 ? total : stats.reacciones;
      }
      const propiaDato = propiaSnapshot.exists()
        ? (propiaSnapshot.data() as { tipo?: string })
        : null;

      return {
        comentarios: Number.isInteger(stats.comentarios) && stats.comentarios >= 0
          ? stats.comentarios
          : 0,
        reacciones: {
          total,
          propia: propiaDato && esTipoReaccionCuento(propiaDato.tipo) ? propiaDato.tipo : null,
          porTipo,
        },
      };
    } catch (error) {
      reportarError(error, { area: 'cuentos-comandos', recuperable: true });
      return vacias();
    }
  }

  private mapearComentario(
    cuentoId: string,
    comentarioId: string,
    datos: {
      autor_uid: string;
      cuerpo: string;
      estado: string;
      created_at?: Timestamp;
      updated_at?: Timestamp;
    },
  ): ComentarioCuento {
    const creadoEn = datos.created_at?.toMillis() ?? Date.now();
    return {
      id: comentarioId,
      cuentoId,
      autorUid: datos.autor_uid,
      cuerpo: datos.cuerpo,
      estado: ['visible', 'oculto', 'eliminado', 'spam'].includes(datos.estado)
        ? (datos.estado as ComentarioCuento['estado'])
        : 'visible',
      creadoEn: { milisegundos: creadoEn },
      actualizadoEn: { milisegundos: datos.updated_at?.toMillis() ?? creadoEn },
      schemaVersion: VERSION_ESQUEMA_CUENTO,
    };
  }

  private conteosVacios(): Record<TipoReaccionCuento, number> {
    return Object.fromEntries(
      TIPOS_REACCION_CUENTO.map((tipo) => [tipo, 0]),
    ) as Record<TipoReaccionCuento, number>;
  }
}
