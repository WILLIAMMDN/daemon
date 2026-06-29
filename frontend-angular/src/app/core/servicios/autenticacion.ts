import { Injectable } from '@angular/core';
import { catchError, from, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { Api } from './api';
import { FirebaseAuth } from './firebase-auth';
import { Sesion, UsuarioSesion } from './sesion';

export interface AuthRespuesta {
  usuario: UsuarioSesion;
}

export interface CompletarPerfilGoogleDatos {
  nombre_completo: string;
  usuario: string;
  nivel: 'KIDS' | 'TEENS' | 'PRO';
}

export interface RegistroFirebaseDatos {
  email: string;
  password: string;
}

type RespuestaReenvioVerificacion = {
  message: string;
  estado?: 'enviado' | 'verificado' | 'fallo_envio';
  enviado: boolean;
  email_verified_at: string | null;
  usuario?: UsuarioSesion;
};

type RespuestaYo = UsuarioSesion | { data: UsuarioSesion };

@Injectable({
  providedIn: 'root',
})
export class Autenticacion {
  constructor(
    private api: Api,
    private sesion: Sesion,
    private firebaseAuth: FirebaseAuth,
  ) {}

  login(datos: { usuario: string; password: string }) {
    return this.api.post<AuthRespuesta>('/auth/login', datos)
      .pipe(tap((respuesta) => this.sesion.guardar(respuesta.usuario)));
  }

  registro(datos: Record<string, unknown>) {
    return this.api.post<AuthRespuesta>('/auth/registro', datos)
      .pipe(tap((respuesta) => this.sesion.guardar(respuesta.usuario)));
  }

  loginGoogle(idToken: string, crearCuenta = false) {
    this.sesion.limpiar();

    return this.api.post<AuthRespuesta>('/auth/google', { id_token: idToken, crear_cuenta: crearCuenta })
      .pipe(tap((respuesta) => this.sesion.guardar(respuesta.usuario)));
  }

  loginFirebase(idToken: string, crearCuenta = false) {
    return this.autenticarConFirebaseToken(idToken, crearCuenta, true);
  }

  loginGoogleFirebase(crearCuenta = false) {
    this.sesion.limpiar();

    return from(this.firebaseAuth.loginGoogle()).pipe(
      switchMap((idToken) => this.loginFirebase(idToken, crearCuenta)),
    );
  }

  loginEmailFirebase(email: string, password: string) {
    this.sesion.limpiar();

    return from(this.firebaseAuth.loginEmail(email, password)).pipe(
      switchMap((idToken) => this.loginFirebase(idToken)),
    );
  }

  registroFirebase(datos: RegistroFirebaseDatos) {
    this.sesion.limpiar();

    // Patrón "login-first, create-on-miss": primero intentamos login
    // con email+password. Si Firebase ya tiene ese usuario (por un
    // intento de registro previo que fallo a mitad de camino, por
    // ejemplo), entramos directamente sin chocar con
    // auth/email-already-in-use. Si Firebase NO lo tiene, ahi si
    // creamos la cuenta.
    return from(this.loginORegistroFirebase(datos)).pipe(
      switchMap((idToken) => this.loginFirebase(idToken, true)),
    );
  }

  /**
   * Helper interno: intenta hacer login con las credenciales. Si el
   * usuario no existe en Firebase, lo crea. Devuelve el idToken en
   * cualquier caso.
   */
  private async loginORegistroFirebase(datos: RegistroFirebaseDatos): Promise<string> {
    try {
      return await this.firebaseAuth.loginEmail(datos.email, datos.password);
    } catch (error) {
      const codigo = (error as { code?: string })?.code ?? '';
      // auth/invalid-credential / auth/user-not-found => el usuario
      // no existe todavia, lo creamos.
      // auth/wrong-password => existe pero la contrasena no coincide
      // con el intento de registro. Re-lanzamos el error para que el
      // usuario sepa que ya tiene cuenta con otra clave.
      if (codigo === 'auth/user-not-found' || codigo === 'auth/invalid-credential') {
        return await this.firebaseAuth.crearCuentaEmail(datos.email, datos.password);
      }
      throw error;
    }
  }

  completarPerfil(datos: CompletarPerfilGoogleDatos) {
    return this.api.patch<{ usuario: UsuarioSesion }>('/auth/me/perfil', datos)
      .pipe(tap((respuesta) => this.sesion.actualizarUsuario(respuesta.usuario)));
  }

  completarPerfilGoogle(datos: CompletarPerfilGoogleDatos) {
    return this.completarPerfil(datos);
  }

  cerrarSesionGoogle(): void {
    void this.firebaseAuth.logout().catch(() => {});
  }

  crearUsuario(datos: Record<string, unknown>) {
    return this.api.post('/auth/usuarios', datos);
  }

  refrescarSesion(): Observable<UsuarioSesion> {
    return this.api.get<RespuestaYo>('/auth/yo').pipe(
      map((respuesta) => ('data' in respuesta ? respuesta.data : respuesta)),
      tap((usuario) => this.sesion.actualizarUsuario(usuario)),
    );
  }

  solicitarRecuperacion(datos: { usuario?: string; email?: string }) {
    return this.api.post<{ message: string }>('/auth/recuperar', datos);
  }

  recuperarPasswordFirebase(email: string) {
    return from(this.firebaseAuth.recuperarPassword(email));
  }

  /**
   * Verifica que el codigo de reseteo del enlace de Firebase sea valido
   * y devuelve el email asociado.
   */
  verificarCodigoResetFirebase(oobCode: string): Observable<string> {
    return from(this.firebaseAuth.verificarCodigoReset(oobCode));
  }

  /**
   * Confirma el reseteo en Firebase y luego sincroniza la nueva contrasena
   * con la base de datos de DAEMON (campo password_hash) para que el login
   * legacy siga funcionando.
   */
  restablecerClave(oobCode: string, nuevaContrasena: string): Observable<AuthRespuesta> {
    // 1) Verificamos el codigo para obtener el email
    return this.verificarCodigoResetFirebase(oobCode).pipe(
      switchMap((email) =>
        // 2) Confirmamos el reset en Firebase
        from(this.firebaseAuth.confirmarResetPassword(oobCode, nuevaContrasena)).pipe(
          // 3) Login automatico con email + nueva clave
          switchMap(() => from(this.firebaseAuth.loginEmail(email, nuevaContrasena))),
        ),
      ),
      switchMap((firebaseIdToken) => this.loginFirebase(firebaseIdToken)),
      switchMap((respuesta) =>
        // 4) Sincronizamos password_hash en DAEMON
        this.sincronizarClave(nuevaContrasena).pipe(
          tap(() => this.sesion.guardar(respuesta.usuario)),
          switchMap(() => from([respuesta])),
        ),
      ),
    );
  }

  /**
   * Confirma el reseteo de clave a partir del token JWT firmado por el
   * backend de Laravel (no usa el oobCode de Firebase). El backend se
   * encarga de actualizar la clave en Firebase y en DAEMON, y devuelve
   * una sesion autenticada lista para guardar.
   */
  confirmarResetConToken(token: string, nuevaContrasena: string): Observable<AuthRespuesta> {
    return this.api.post<AuthRespuesta>('/auth/confirmar-reset', {
      token,
      password: nuevaContrasena,
      password_confirmation: nuevaContrasena,
    }).pipe(tap((respuesta) => this.sesion.guardar(respuesta.usuario)));
  }

  /**
   * Confirma la verificacion de correo a partir del token JWT firmado
   * por el backend. El token llega en el link que recibe el usuario
   * por mail. Si el usuario esta autenticado, actualizamos la sesion
   * local para reflejar el nuevo email_verified_at.
   */
  confirmarVerificacionConToken(token: string): Observable<{ message: string; usuario: UsuarioSesion }> {
    return this.api.post<{ message: string; usuario: UsuarioSesion }>('/auth/confirmar-verificar', {
      token,
    }).pipe(tap((respuesta) => {
      // Si el usuario estaba logueado al confirmar, sincronizamos
      // la sesion local para que la UI deje de mostrar el banner
      // de "verifica tu correo".
      if (respuesta.usuario) {
        this.sesion.actualizarUsuario(respuesta.usuario);
      }
    }));
  }

  /**
   * Reenvia el correo de verificacion. Pensado para usuarios ya
   * autenticados que no recibieron (o perdieron) el mail inicial.
   * Primero usa el correo personalizado de DAEMON; si el proveedor de
   * correo del backend esta temporalmente caido, usa Firebase Auth como
   * respaldo para no dejar bloqueado al estudiante.
   */
  reenviarVerificacion(): Observable<RespuestaReenvioVerificacion> {
    return this.reenviarVerificacionBackend().pipe(
      switchMap((respuesta) => {
        if (respuesta.estado === 'fallo_envio') {
          return this.enviarVerificacionFirebase();
        }

        return of(respuesta);
      }),
      catchError(() => this.enviarVerificacionFirebase()),
    );
  }

  sincronizarVerificacionFirebase(): Observable<{ message: string; usuario: UsuarioSesion }> {
    const usuario = this.sesion.usuario();

    return from(this.firebaseAuth.idTokenVerificadoActual(usuario?.email)).pipe(
      switchMap((idToken) => {
        if (!idToken) {
          return throwError(() => new Error('Todavia no aparece verificado en Firebase. Abre el enlace del correo y vuelve a intentarlo.'));
        }

        return this.autenticarConFirebaseToken(idToken, false, false);
      }),
      map((respuesta) => ({
        message: 'Tu correo quedo verificado y sincronizado con DAEMON.',
        usuario: respuesta.usuario,
      })),
    );
  }

  private enviarVerificacionFirebase(): Observable<RespuestaReenvioVerificacion> {
    const usuario = this.sesion.usuario();

    return from(this.firebaseAuth.enviarVerificacionCorreo(usuario?.email)).pipe(
      switchMap((estado) => {
        if (estado === 'enviado') {
          return of({
            message: 'Te enviamos un correo de Firebase para verificar tu cuenta. Revisa tu bandeja de entrada y spam.',
            estado: 'enviado' as const,
            enviado: true,
            email_verified_at: null,
            usuario: usuario ?? undefined,
          });
        }

        if (estado === 'ya-verificado') {
          return this.sincronizarVerificacionFirebase().pipe(
            map((respuesta) => ({
              message: respuesta.message,
              estado: 'verificado' as const,
              enviado: false,
              email_verified_at: respuesta.usuario.email_verified_at ?? null,
              usuario: respuesta.usuario,
            })),
          );
        }

        return throwError(() => new Error('Necesitamos reactivar tu sesion segura de Firebase para enviar la verificacion. Cierra sesion, vuelve a entrar con tu correo y solicita el envio nuevamente.'));
      }),
      catchError((error) => throwError(() => this.normalizarErrorFirebase(error))),
    );
  }

  private autenticarConFirebaseToken(idToken: string, crearCuenta = false, limpiarSesion = true): Observable<AuthRespuesta> {
    if (limpiarSesion) {
      this.sesion.limpiar();
    }

    return this.api.post<AuthRespuesta>('/auth/firebase', { id_token: idToken, crear_cuenta: crearCuenta })
      .pipe(tap((respuesta) => this.sesion.guardar(respuesta.usuario)));
  }

  private reenviarVerificacionBackend(): Observable<RespuestaReenvioVerificacion> {
    return this.api.post<RespuestaReenvioVerificacion>(
      '/auth/enviar-verificacion',
      {},
    ).pipe(tap((respuesta) => {
      if (respuesta.usuario) {
        this.sesion.actualizarUsuario(respuesta.usuario);
      }
    }));
  }

  private normalizarErrorFirebase(error: unknown): Error {
    const codigo = (error as { code?: string })?.code ?? '';

    if (codigo === 'auth/too-many-requests') {
      return new Error('Firebase bloqueo temporalmente el envio por muchos intentos. Espera unos minutos y vuelve a intentarlo.');
    }

    if (codigo === 'auth/requires-recent-login') {
      return new Error('Por seguridad, vuelve a iniciar sesion y solicita nuevamente la verificacion.');
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('No pudimos enviar el correo de verificacion desde Firebase.');
  }

  private sincronizarClave(password: string): Observable<unknown> {
    return this.api.post('/auth/me/sync-password', {
      password,
      password_confirmation: password,
    });
  }

  cambiarClave(datos: { password_actual: string; password: string; password_confirmation: string }) {
    return this.api.post<{ message: string }>('/auth/cambiar-clave', datos);
  }

  logout() {
    return this.api.post('/auth/logout', {}).pipe(tap(() => {
      this.sesion.limpiar();
      void this.firebaseAuth.logout().catch(() => {});
    }));
  }
}
