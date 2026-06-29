import { Injectable } from '@angular/core';
import { from, Observable, switchMap, tap } from 'rxjs';
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

export interface RegistroFirebaseDatos extends CompletarPerfilGoogleDatos {
  email: string;
  password: string;
}

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
    this.sesion.limpiar();

    return this.api.post<AuthRespuesta>('/auth/firebase', { id_token: idToken, crear_cuenta: crearCuenta })
      .pipe(tap((respuesta) => this.sesion.guardar(respuesta.usuario)));
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

    return from(this.firebaseAuth.crearCuentaEmail(datos.email, datos.password)).pipe(
      switchMap((idToken) => this.loginFirebase(idToken, true)),
      switchMap(() => this.completarPerfilGoogle({
        nombre_completo: datos.nombre_completo,
        usuario: datos.usuario,
        nivel: datos.nivel,
      })),
    );
  }

  completarPerfilGoogle(datos: CompletarPerfilGoogleDatos) {
    return this.api.post<{ usuario: UsuarioSesion }>('/auth/firebase/perfil', datos)
      .pipe(tap((respuesta) => this.sesion.actualizarUsuario(respuesta.usuario)));
  }

  cerrarSesionGoogle(): void {
    void this.firebaseAuth.logout().catch(() => {});
  }

  crearUsuario(datos: Record<string, unknown>) {
    return this.api.post('/auth/usuarios', datos);
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
