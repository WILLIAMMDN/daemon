import { Injectable } from '@angular/core';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import { environment } from '../../../environments/environment';

const firestoreConEmulador = new WeakSet<Firestore>();

@Injectable({
  providedIn: 'root',
})
export class FirestoreApp {
  private instancia: Firestore | null = null;

  async inicializar(): Promise<void> {
    if (this.instancia) {
      return;
    }

    const app = this.obtenerApp();
    if (app) {
      const { connectFirestoreEmulator, getFirestore } = await import('firebase/firestore');
      this.instancia = getFirestore(app);

      const emulator = environment.firebaseEmulators;
      if (emulator.enabled && !firestoreConEmulador.has(this.instancia)) {
        connectFirestoreEmulator(this.instancia, emulator.firestoreHost, emulator.firestorePort);
        firestoreConEmulador.add(this.instancia);
      }
    }
  }

  db(): Firestore {
    if (!this.instancia) {
      throw new Error('Firestore no está inicializado.');
    }

    return this.instancia;
  }

  disponible(): boolean {
    return this.instancia !== null;
  }

  private obtenerApp(): FirebaseApp | null {
    const config = environment.firebase;
    if (!config?.apiKey || !config.projectId || !config.appId) {
      return null;
    }

    // FirebaseAuth usa también la primera app registrada. Inicializarla aquí
    // permite compartir la instancia sin acoplar Firestore al SDK de Auth.
    return getApps()[0] ?? initializeApp(config);
  }
}
