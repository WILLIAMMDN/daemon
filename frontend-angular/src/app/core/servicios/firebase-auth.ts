import { Injectable } from '@angular/core';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  ActionCodeSettings,
  GoogleAuthProvider,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FirebaseAuth {
  private readonly app: FirebaseApp | null = this.crearApp();
  private readonly auth: Auth | null = this.app ? getAuth(this.app) : null;

  disponible(): boolean {
    return this.auth !== null;
  }

  async loginGoogle(): Promise<string> {
    const auth = this.requerirAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const credencial = await signInWithPopup(auth, provider);

    return credencial.user.getIdToken();
  }

  /**
   * Canjea un Google ID token (proveniente de Google Identity Services)
   * por una sesion de Firebase y devuelve el Firebase ID token listo para el backend.
   */
  async signInWithGoogleIdToken(googleIdToken: string): Promise<string> {
    const auth = this.requerirAuth();
    const credential = GoogleAuthProvider.credential(googleIdToken);
    const resultado = await signInWithCredential(auth, credential);

    return resultado.user.getIdToken();
  }

  async loginEmail(email: string, password: string): Promise<string> {
    const credencial = await signInWithEmailAndPassword(this.requerirAuth(), email, password);

    return credencial.user.getIdToken();
  }

  async crearCuentaEmail(email: string, password: string): Promise<string> {
    const credencial = await createUserWithEmailAndPassword(this.requerirAuth(), email, password);

    return credencial.user.getIdToken();
  }

  async recuperarPassword(email: string): Promise<void> {
    const auth = this.requerirAuth();
    auth.languageCode = 'es';

    await sendPasswordResetEmail(auth, email, this.actionCodeSettings());
  }

  /**
   * Verifica que un codigo de reseteo (oobCode) sea valido y devuelve
   * el email asociado. Si el codigo expiro o ya fue usado, lanza error.
   */
  async verificarCodigoReset(oobCode: string): Promise<string> {
    return await verifyPasswordResetCode(this.requerirAuth(), oobCode);
  }

  /**
   * Confirma un reseteo de contrasena. Despues de esto, el usuario puede
   * iniciar sesion con la nueva contrasena.
   */
  async confirmarResetPassword(oobCode: string, nuevaContrasena: string): Promise<void> {
    await confirmPasswordReset(this.requerirAuth(), oobCode, nuevaContrasena);
  }

  async logout(): Promise<void> {
    if (! this.auth) {
      return;
    }

    await signOut(this.auth);
  }

  private crearApp(): FirebaseApp | null {
    const config = environment.firebase;

    if (! config?.apiKey || ! config.projectId || ! config.appId) {
      return null;
    }

    return getApps()[0] ?? initializeApp(config);
  }

  private requerirAuth(): Auth {
    if (! this.auth) {
      throw new Error('Firebase Auth todavia no esta configurado.');
    }

    return this.auth;
  }

  private actionCodeSettings(): ActionCodeSettings {
    const origin = globalThis.location?.origin ?? 'http://localhost:4200';

    return {
      url: `${origin}/restablecer-clave`,
      handleCodeInApp: false,
    };
  }
}
