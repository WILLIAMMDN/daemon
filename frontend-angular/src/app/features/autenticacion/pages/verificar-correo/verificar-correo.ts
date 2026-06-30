import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Autenticacion } from '../../../../core/servicios/autenticacion';
import { CargaGlobal } from '../../../../core/servicios/carga-global';
import { Sesion } from '../../../../core/servicios/sesion';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'exito'; mensaje: string }
  | { tipo: 'error'; mensaje: string };

/**
 * Pagina de confirmacion de correo electronico.
 *
 * El usuario llega aca haciendo click en el link del mail "Confirma
 * tu correo" que envia el backend tras el registro. El link trae un
 * ?token=JWT firmado con APP_KEY. Esta pagina:
 *
 *   1. Lee el token de la URL.
 *   2. POST /auth/confirmar-verificar para que el backend lo valide
 *      y marque email_verified_at en la DB.
 *   3. Muestra exito y redirige al login (si el usuario no estaba
 *      autenticado) o al portal (si ya estaba logueado).
 */
@Component({
  selector: 'app-verificar-correo',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verificar-correo.html',
  styleUrl: '../recuperar-clave/recuperar-clave.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class VerificarCorreo implements OnInit {
  readonly estado = signal<Estado>({ tipo: 'cargando' });
  readonly reenviando = signal(false);

  get mensajeError(): string {
    const e = this.estado();
    return e.tipo === 'error' ? e.mensaje : '';
  }

  get mensajeExito(): string {
    const e = this.estado();
    return e.tipo === 'exito' ? e.mensaje : '';
  }

  get cargando(): boolean {
    return this.estado().tipo === 'cargando';
  }

  get enExito(): boolean {
    return this.estado().tipo === 'exito';
  }

  get enError(): boolean {
    return this.estado().tipo === 'error';
  }

  private token: string | null = null;

  constructor(
    private ruta: ActivatedRoute,
    private router: Router,
    private auth: Autenticacion,
    private sesion: Sesion,
    private cargaGlobal: CargaGlobal,
  ) {}

  ngOnInit(): void {
    this.token = this.ruta.snapshot.queryParamMap.get('token');

    if (!this.token || this.token.length < 10) {
      this.estado.set({
        tipo: 'error',
        mensaje: 'El enlace de verificacion no es valido. Solicita uno nuevo desde tu portal.',
      });
      return;
    }

    this.confirmar();
  }

  /**
   * Reenvia el correo de verificacion al usuario autenticado.
   * Pensado para cuando el usuario clica el link desde un dispositivo
   * distinto al que se registro y la sesion no esta disponible aca.
   */
  reenviar(): void {
    if (!this.sesion.autenticado()) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.reenviando.set(true);

    this.auth.reenviarVerificacion().subscribe({
      next: (respuesta) => {
        this.reenviando.set(false);
        this.estado.set({
          tipo: 'exito',
          mensaje: respuesta.message,
        });
      },
      error: (error) => {
        this.reenviando.set(false);
        this.estado.set({
          tipo: 'error',
          mensaje: error?.error?.message ?? 'No pudimos reenviar el correo. Intentalo de nuevo desde tu portal.',
        });
      },
    });
  }

  private confirmar(): void {
    const carga = this.cargaGlobal.mostrar('Verificando correo...');

    this.auth.confirmarVerificacionConToken(this.token!).subscribe({
      next: (respuesta) => {
        this.cargaGlobal.ocultar(carga);
        this.estado.set({ tipo: 'exito', mensaje: respuesta.message });

        // Si el usuario estaba logueado, el backend ya actualizo la
        // sesion local via tap. Lo mandamos a su portal. Si NO estaba
        // logueado, lo mandamos al login para que entre con la cuenta
        // recien verificada.
        const destino = this.sesion.autenticado()
          ? (this.sesion.usuario()?.rol === 'docente' ? '/docente' : '/alumno')
          : '/login';

        setTimeout(() => this.router.navigateByUrl(destino), 1800);
      },
      error: (err) => {
        this.cargaGlobal.ocultar(carga);
        const mensaje = err?.status === 422
          ? 'El enlace expiro o ya fue utilizado. Te enviamos uno nuevo si estas logueado.'
          : (err?.error?.message ?? 'No se pudo confirmar el correo. Intentalo de nuevo.');
        this.estado.set({ tipo: 'error', mensaje });
      },
    });
  }
}
