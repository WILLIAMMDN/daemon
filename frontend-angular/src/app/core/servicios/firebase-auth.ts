import { Injectable } from '@angular/core';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  ActionCodeSettings,
  GoogleAuthProvider,
  User,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
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
    await credencial.user.reload();

    return credencial.user.getIdToken(true);
  }

  async crearCuentaEmail(email: string, password: string): Promise<string> {
    const credencial = await createUserWithEmailAndPassword(this.requerirAuth(), email, password);

    // Firebase se encarga del correo real de verificacion para evitar
    // depender de un dominio propio en Resend durante la etapa gratuita.
    void this.enviarVerificacionAUsuario(credencial.user).catch(() => {});

    return credencial.user.getIdToken();
  }

  async enviarVerificacionCorreo(emailEsperado?: string | null): Promise<'enviado' | 'ya-verificado' | 'sin-sesion'> {
    const usuario = await this.usuarioActual();

    if (!this.emailCoincide(usuario, emailEsperado)) {
      return 'sin-sesion';
    }

    await usuario.reload();

    if (usuario.emailVerified) {
      return 'ya-verificado';
    }

    await this.enviarVerificacionAUsuario(usuario);

    return 'enviado';
  }

  async idTokenVerificadoActual(emailEsperado?: string | null): Promise<string | null> {
    const usuario = await this.usuarioActual();

    if (!this.emailCoincide(usuario, emailEsperado)) {
      return null;
    }

    await usuario.reload();

    if (!usuario.emailVerified) {
      return null;
    }

    return usuario.getIdToken(true);
  }

  async idTokenActual(emailEsperado?: string | null): Promise<string | null> {
    const usuario = await this.usuarioActual();

    if (!this.emailCoincide(usuario, emailEsperado)) {
      return null;
    }

    await usuario.reload();

    return usuario.getIdToken(true);
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

  private async usuarioActual(): Promise<User | null> {
    const auth = this.requerirAuth();

    if (auth.currentUser) {
      return auth.currentUser;
    }

    return await new Promise<User | null>((resolve) => {
      const timeout = window.setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, 2500);

      const unsubscribe = onAuthStateChanged(auth, (usuario) => {
        window.clearTimeout(timeout);
        unsubscribe();
        resolve(usuario);
      });
    });
  }

  private emailCoincide(usuario: User | null, emailEsperado?: string | null): usuario is User {
    if (!usuario?.email) {
      return false;
    }

    if (!emailEsperado) {
      return true;
    }

    return usuario.email.toLowerCase() === emailEsperado.toLowerCase();
  }

  private async enviarVerificacionAUsuario(usuario: User): Promise<void> {
    const auth = this.requerirAuth();
    auth.languageCode = 'es';

    await sendEmailVerification(usuario, this.emailVerificationSettings());
  }

  private actionCodeSettings(): ActionCodeSettings {
    const origin = globalThis.location?.origin ?? 'http://localhost:4200';

    return {
      url: `${origin}/login?reset=firebase`,
      handleCodeInApp: false,
    };
  }

  private emailVerificationSettings(): ActionCodeSettings {
    const origin = globalThis.location?.origin ?? 'http://localhost:4200';

    return {
      url: `${origin}/alumno?verificacion=firebase`,
      handleCodeInApp: false,
    };
  }
}
