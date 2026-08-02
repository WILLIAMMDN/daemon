import { Injectable, inject } from '@angular/core';
import { FirestoreApp } from '../../../core/servicios/firestore-app';
import { Sesion } from '../../../core/servicios/sesion';
import { CuentoRegistro } from '../models/cuento.models';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy, setDoc } from 'firebase/firestore';
import { from, Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Cuento {
  private firestore = inject(FirestoreApp);
  private sesion = inject(Sesion);
  private coleccionCuentos = 'cuentos';

  listar(fresh = false): Observable<CuentoRegistro[]> {
    const db = this.firestore.db();
    const cuentosRef = collection(db, this.coleccionCuentos);
    const q = query(cuentosRef, orderBy('fecha_creacion', 'desc'));
    
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ 
        id: doc.id as any,
        ...doc.data() 
      } as CuentoRegistro)))
    );
  }

  detalle(id: string | number): Observable<{ cuento: CuentoRegistro; autor: unknown }> {
    const db = this.firestore.db();
    const docRef = doc(db, this.coleccionCuentos, String(id));
    
    return from(getDoc(docRef)).pipe(
      map(docSnap => {
        if (!docSnap.exists()) {
          throw new Error('Cuento no encontrado');
        }
        const data = docSnap.data();
        return {
          cuento: { id: docSnap.id as any, ...data } as CuentoRegistro,
          autor: { nombre_completo: data['autor'], avatar: data['avatar'] }
        };
      })
    );
  }

  mio(fresh = false): Observable<CuentoRegistro | null> {
    const usuarioActual = this.sesion.usuario();
    if (!usuarioActual) return from([null]);

    const db = this.firestore.db();
    const cuentosRef = collection(db, this.coleccionCuentos);
    const q = query(cuentosRef, where('id_alumno', '==', String(usuarioActual.id)));
    
    return from(getDocs(q)).pipe(
      map(snapshot => {
        if (snapshot.empty) return null;
        const primerDoc = snapshot.docs[0];
        return { id: primerDoc.id as any, ...primerDoc.data() } as CuentoRegistro;
      })
    );
  }

  guardar(datos: any): Observable<CuentoRegistro> {
    const usuarioActual = this.sesion.usuario();
    const db = this.firestore.db();
    const cuentosRef = collection(db, this.coleccionCuentos);

    // `id` es la llave del documento, no un campo del payload. Lo separamos
    // para que Firestore no se queje y para que updateDoc no intente
    // reescribir la clave.
    const { id: idCrudo, ...payloadSinId } = datos;
    const idLimpio = typeof idCrudo === 'string' && idCrudo ? idCrudo : null;

    // Firestore rechaza `undefined`. `null` SÍ está permitido (en updateDoc
    // borra el campo; en addDoc es un valor normal). Filtramos sólo undefined.
    const limpio = this.eliminarUndefined(payloadSinId);

    if (idLimpio) {
      const docRef = doc(db, this.coleccionCuentos, idLimpio);
      // setDoc con merge: true crea el documento si no existe o lo
      // actualiza si ya existe. Así un cuento nuevo puede "tener ID
      // propio" desde antes de su primer guardado (necesario para subir
      // la portada a Supabase con un ID estable).
      return from(setDoc(docRef, limpio, { merge: true })).pipe(
        map(() => ({ id: idLimpio, ...limpio } as unknown as CuentoRegistro))
      );
    }

    return from((async () => {
      let firebaseUid: string | null = null;
      try {
        const { getAuth } = await import('firebase/auth');
        const { getApp } = await import('firebase/app');
        firebaseUid = getAuth(getApp()).currentUser?.uid || null;
      } catch (e) {
        console.warn('No se pudo obtener firebase_uid', e);
      }

      const nuevoCuento = {
        ...limpio,
        id_alumno: usuarioActual?.id ? String(usuarioActual.id) : null,
        firebase_uid: firebaseUid,
        autor: usuarioActual?.nombre_completo || usuarioActual?.usuario,
        avatar: usuarioActual?.avatar,
        fecha_creacion: new Date().toISOString(),
        reacciones_count: 0,
      };

      const docRef = await addDoc(cuentosRef, nuevoCuento);
      return { id: docRef.id as any, ...nuevoCuento } as CuentoRegistro;
    })());
  }

  /**
   * Recorre el objeto en profundidad y elimina cualquier valor `undefined`.
   * Los `null` se conservan a propósito (Firestore los trata como "borrar
   * el campo" en updateDoc y como valor normal en addDoc).
   */
  private eliminarUndefined<T>(valor: T): T {
    if (Array.isArray(valor)) {
      return valor.map((v) => this.eliminarUndefined(v)) as unknown as T;
    }
    if (valor !== null && typeof valor === 'object') {
      const limpio: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(valor as Record<string, unknown>)) {
        if (v === undefined) continue;
        limpio[k] = this.eliminarUndefined(v);
      }
      return limpio as T;
    }
    return valor;
  }

  eliminar(id: string): Observable<void> {
    const db = this.firestore.db();
    const docRef = doc(db, this.coleccionCuentos, id);
    return from(deleteDoc(docRef));
  }

  // --- Colección Raíz de Comentarios ---
  listarComentarios(cuentoId: string | number): Observable<any[]> {
    const db = this.firestore.db();
    const comentariosRef = collection(db, 'cuento_comentarios');
    const q = query(comentariosRef, where('cuento_id', '==', String(cuentoId)));
    
    return from(getDocs(q)).pipe(
      map(snapshot => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Ordenar en memoria para evitar requerir índices compuestos en Firestore
        return docs.sort((a: any, b: any) => 
          new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime()
        );
      })
    );
  }

  agregarComentario(cuentoId: string | number, contenido: string): Observable<any> {
    const usuarioActual = this.sesion.usuario();
    const db = this.firestore.db();
    const comentariosRef = collection(db, 'cuento_comentarios');
    
    const nuevoComentario = {
      cuento_id: String(cuentoId),
      contenido,
      autor_id: usuarioActual?.id,
      autor_nombre: usuarioActual?.nombre_completo || usuarioActual?.usuario,
      avatar: usuarioActual?.avatar,
      fecha_creacion: new Date().toISOString()
    };

    return from(addDoc(comentariosRef, nuevoComentario)).pipe(
      map(docRef => ({ id: docRef.id, ...nuevoComentario }))
    );
  }

  editarComentario(comentarioId: string, nuevoContenido: string): Observable<void> {
    const db = this.firestore.db();
    const docRef = doc(db, 'cuento_comentarios', comentarioId);
    return from(updateDoc(docRef, { contenido: nuevoContenido }));
  }

  eliminarComentario(comentarioId: string): Observable<void> {
    const db = this.firestore.db();
    const docRef = doc(db, 'cuento_comentarios', comentarioId);
    return from(deleteDoc(docRef));
  }

  // --- Colección Raíz de Reacciones ---
  listarReacciones(cuentoId: string | number): Observable<any[]> {
    const db = this.firestore.db();
    const reaccionesRef = collection(db, 'cuento_reacciones');
    const q = query(reaccionesRef, where('cuento_id', '==', String(cuentoId)));
    
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
  }

  agregarReaccion(cuentoId: string | number, tipo: string): Observable<any> {
    const usuarioActual = this.sesion.usuario();
    const db = this.firestore.db();
    const docId = `${cuentoId}_${usuarioActual?.id || Date.now()}`;
    const reaccionDoc = doc(db, 'cuento_reacciones', docId);
    
    const nuevaReaccion = {
      cuento_id: String(cuentoId),
      tipo,
      fecha_creacion: new Date().toISOString()
    };

    return from(setDoc(reaccionDoc, nuevaReaccion)).pipe(
      map(() => ({ id: docId, ...nuevaReaccion }))
    );
  }
}
