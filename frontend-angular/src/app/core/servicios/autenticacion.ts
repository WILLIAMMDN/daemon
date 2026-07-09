import { Injectable } from '@angular/core';
import { catchError, from, map, Observable, of, switchMap, tap, throwError, timeout, TimeoutError } from 'rxjs';
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
  private readonly registroTimeoutMs = 60000;
  private readonly sinSesionFirebasePerfil = 'SinSesionFirebasePerfil';

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
      timeout({ first: this.registroTimeoutMs }),
      catchError((error) => throwError(() => this.normalizarErrorRegistro(error))),
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
    return this.completarPerfilFirebaseActual(datos).pipe(
      catchError((error) => {
        if (this.debeUsarSesionParaCompletarPerfil(error)) {
          return this.completarPerfilConSesion(datos);
        }

        return throwError(() => error);
      }),
    );
  }

  private completarPerfilFirebaseActual(datos: CompletarPerfilGoogleDatos) {
    const usuario = this.sesion.usuario();

    return from(this.firebaseAuth.idTokenActual(usuario?.email)).pipe(
      switchMap((idToken) => {
        if (!idToken) {
          const error = new Error('No encontramos una sesion activa de Firebase para completar tu perfil.');
          error.name = this.sinSesionFirebasePerfil;

          return throwError(() => error);
        }

        return this.api.post<AuthRespuesta>('/auth/firebase/perfil', {
          ...datos,
          id_token: idToken,
        });
      }),
      tap((respuesta) => this.sesion.guardar(respuesta.usuario)),
    );
  }

  private completarPerfilConSesion(datos: CompletarPerfilGoogleDatos) {
    return this.api.patch<{ usuario: UsuarioSesion }>('/auth/me/perfil', datos)
      .pipe(tap((respuesta) => this.sesion.actualizarUsuario(respuesta.usuario)));
  }

  private debeUsarSesionParaCompletarPerfil(error: unknown): boolean {
    const posibleError = error as { name?: string; message?: string };

    return posibleError?.name === this.sinSesionFirebasePerfil
      || posibleError?.message === 'Firebase Auth todavia no esta configurado.';
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
   * Reenvia el correo de verificacion desde Firebase Auth. Es menos
   * personalizable que el mail propio, pero funciona sin dominio de
   * correo verificado y sirve para alumnos reales desde el plan gratis.
   */
  reenviarVerificacion(): Observable<RespuestaReenvioVerificacion> {
    const usuario = this.sesion.usuario();

    return from(this.firebaseAuth.enviarVerificacionCorreo(usuario?.email)).pipe(
      switchMap((estadoFirebase) => {
        if (estadoFirebase === 'ya-verificado') {
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

        if (estadoFirebase === 'sin-sesion') {
          return throwError(() => new Error('Inicia sesion nuevamente con tu correo y vuelve a enviar la verificacion.'));
        }

        return of({
          message: 'Te enviamos un correo de Firebase con el enlace de verificacion.',
          estado: 'enviado' as const,
          enviado: true,
          email_verified_at: usuario?.email_verified_at ?? null,
          usuario: usuario ?? undefined,
        });
      }),
      catchError((error) => of({
        message: error?.message ?? 'No pudimos enviar la verificacion en este momento.',
        estado: 'fallo_envio' as const,
        enviado: false,
        email_verified_at: usuario?.email_verified_at ?? null,
        usuario: usuario ?? undefined,
      })),
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

  private autenticarConFirebaseToken(idToken: string, crearCuenta = false, limpiarSesion = true): Observable<AuthRespuesta> {
    if (limpiarSesion) {
      this.sesion.limpiar();
    }

    return this.api.post<AuthRespuesta>('/auth/firebase', { id_token: idToken, crear_cuenta: crearCuenta })
      .pipe(tap((respuesta) => this.sesion.guardar(respuesta.usuario)));
  }

  private sincronizarClave(password: string): Observable<unknown> {
    return this.api.post('/auth/me/sync-password', {
      password,
      password_confirmation: password,
    });
  }

  private normalizarErrorRegistro(error: unknown): unknown {
    if (error instanceof TimeoutError) {
      return new Error('El registro tardo demasiado en responder. Si el correo fue creado, vuelve a intentar con el mismo email y contrasena para terminar la cuenta.');
    }

    return error;
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
