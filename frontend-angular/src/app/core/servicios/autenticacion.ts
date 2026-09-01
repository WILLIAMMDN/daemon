import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, from, map, Observable, of, switchMap, tap, throwError, timer, timeout, TimeoutError } from 'rxjs';
import { NivelAlumno } from '../dominio/nivel-alumno';
import { Api, ApiError } from './api';
import { FirebaseAuth } from './firebase-auth';
import { Sesion, UsuarioSesion } from './sesion';

export interface AuthRespuesta {
  usuario: UsuarioSesion;
  /**
   * Custom token de Firebase para que el cliente haga signInWithCustomToken()
   * y las reglas de Firestore v2 autoricen al alumno. Solo presente cuando
   * Firebase esta configurado en el backend.
   */
  firebase_token?: string;
}

export interface CompletarPerfilGoogleDatos {
  nombre_completo: string;
  usuario: string;
  nivel: NivelAlumno;
  acepta_privacidad: boolean;
  email_tutor?: string;
  autorizacion_tutor_declarada?: boolean;
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
    return this.reintentarEnFrio(() => this.api.post<AuthRespuesta>('/auth/login', datos))
      .pipe(
        tap((respuesta) => this.sesion.guardar(respuesta.usuario)),
        switchMap((respuesta) =>
          from(this.vincularFirebase(respuesta.firebase_token)).pipe(
            map(() => respuesta),
            // Best-effort: si Firebase no esta configurado o el endpoint
            // falla, el login local nunca se rompe por la vinculacion.
            catchError(() => of(respuesta)),
          ),
        ),
      );
  }

  /**
   * Si la respuesta del login incluye firebase_token, lo canjea con
   * signInWithCustomToken() para que Firestore Rules v2 autoricen al alumno.
   * No lanza: los errores se silencian para no romper el login legacy.
   */
  private async vincularFirebase(token: string | undefined): Promise<void> {
    if (!token || !this.firebaseAuth.disponible()) {
      return;
    }
    try {
      await this.firebaseAuth.iniciarConCustomToken(token);
    } catch {
      // Best-effort: si falla, el login local sigue funcionando
      // pero las consultas a Firestore no tendran sesion de Firebase.
    }
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

  loginTutorEmailFirebase(email: string, password: string) {
    this.sesion.limpiar();

    return from(this.firebaseAuth.loginEmail(email, password)).pipe(
      switchMap((idToken) => this.autenticarTutorToken(idToken, false)),
    );
  }

  loginTutorGoogleFirebase(crearCuenta = false) {
    this.sesion.limpiar();

    return from(this.firebaseAuth.loginGoogle()).pipe(
      switchMap((idToken) => this.autenticarTutorToken(idToken, crearCuenta)),
    );
  }

  registroTutorFirebase(datos: RegistroFirebaseDatos) {
    this.sesion.limpiar();

    return from(this.loginORegistroTutorFirebase(datos)).pipe(
      switchMap((idToken) => this.autenticarTutorToken(idToken, true)),
      timeout({ first: this.registroTimeoutMs }),
      catchError((error) => throwError(() => this.normalizarErrorRegistro(error))),
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

  private async loginORegistroTutorFirebase(datos: RegistroFirebaseDatos): Promise<string> {
    try {
      return await this.firebaseAuth.loginEmail(datos.email, datos.password);
    } catch (error) {
      const codigo = (error as { code?: string })?.code ?? '';
      if (codigo === 'auth/user-not-found' || codigo === 'auth/invalid-credential') {
        return await this.firebaseAuth.crearCuentaEmail(datos.email, datos.password, '/familias?verificacion=firebase');
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
  reenviarVerificacion(returnUrl = '/alumno?verificacion=firebase'): Observable<RespuestaReenvioVerificacion> {
    const usuario = this.sesion.usuario();

    return from(this.firebaseAuth.enviarVerificacionCorreo(usuario?.email, returnUrl)).pipe(
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

    return this.reintentarEnFrio(() => this.api.post<AuthRespuesta>('/auth/firebase', { id_token: idToken, crear_cuenta: crearCuenta }))
      .pipe(tap((respuesta) => this.sesion.guardar(respuesta.usuario)));
  }

  private autenticarTutorToken(idToken: string, crearCuenta: boolean): Observable<AuthRespuesta> {
    return this.reintentarEnFrio(() => this.api.post<AuthRespuesta>('/auth/tutor/firebase', {
      id_token: idToken,
      crear_cuenta: crearCuenta,
      ...(crearCuenta ? { acepta_privacidad: true } : {}),
    }))
      .pipe(tap((respuesta) => this.sesion.guardar(respuesta.usuario)));
  }

  /**
   * Reintenta una vez las peticiones de login cuando el error es de red
   * o del arranque en frío del servidor:
   *  - timeout (Render tardó más de lo esperado en despertar);
   *  - sin conexión (status 0);
   *  - 502/503 (el proxy de Render los devuelve mientras la instancia
   *    arranca o se reinicia).
   *
   * NUNCA reintenta errores 4xx: una clave incorrecta o una cuenta
   * inexistente deben mostrarse tal cual, no duplicar la espera.
   */
  private reintentarEnFrio<T>(peticion: () => Observable<T>, reintentos = 1): Observable<T> {
    return peticion().pipe(
      catchError((error) => {
        if (reintentos > 0 && this.esErrorDeArranqueEnFrio(error)) {
          return timer(800).pipe(
            switchMap(() => this.reintentarEnFrio(peticion, reintentos - 1)),
          );
        }
        return throwError(() => error);
      }),
    );
  }

  private esErrorDeArranqueEnFrio(error: unknown): boolean {
    if (error instanceof ApiError) {
      return error.kind === 'timeout' || error.kind === 'offline';
    }

    if (error instanceof HttpErrorResponse) {
      return error.status === 502 || error.status === 503;
    }

    return false;
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
