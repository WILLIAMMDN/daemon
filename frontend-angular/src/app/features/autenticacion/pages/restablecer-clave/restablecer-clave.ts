import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, signal , ChangeDetectionStrategy} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Autenticacion } from '../../../../core/servicios/autenticacion';
import { CargaGlobal } from '../../../../core/servicios/carga-global';
import { Sesion } from '../../../../core/servicios/sesion';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'formulario' }
  | { tipo: 'exito' }
  | { tipo: 'error'; mensaje: string };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-restablecer-clave',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './restablecer-clave.html',
  styleUrl: '../recuperar-clave/recuperar-clave.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RestablecerClave implements OnInit {
  readonly estado = signal<Estado>({ tipo: 'cargando' });
  readonly enviando = signal(false);

  readonly formulario: FormGroup;

  get mensajeError(): string {
    const e = this.estado();
    return e.tipo === 'error' ? e.mensaje : '';
  }

  private token: string | null = null;
  private modo: 'backend' | 'firebase' | null = null;

  constructor(
    private ruta: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private auth: Autenticacion,
    private sesion: Sesion,
    private cargaGlobal: CargaGlobal,
  ) {
    this.formulario = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.token = this.ruta.snapshot.queryParamMap.get('token')
      ?? this.ruta.snapshot.queryParamMap.get('oobCode');

    if (!this.token || this.token.length < 10) {
      this.estado.set({
        tipo: 'error',
        mensaje: 'El enlace de recuperacion no es valido. Solicita uno nuevo desde la pagina de inicio.',
      });
      return;
    }

    this.modo = this.ruta.snapshot.queryParamMap.has('oobCode') ? 'firebase' : 'backend';

    if (this.modo === 'firebase') {
      const carga = this.cargaGlobal.mostrar('Validando enlace...');

      this.auth.verificarCodigoResetFirebase(this.token).subscribe({
        next: () => {
          this.cargaGlobal.ocultar(carga);
          this.estado.set({ tipo: 'formulario' });
        },
        error: () => {
          this.cargaGlobal.ocultar(carga);
          this.estado.set({
            tipo: 'error',
            mensaje: 'El enlace de Firebase expiro o no es valido. Solicita uno nuevo.',
          });
        },
      });
      return;
    }

    // El token backend lo firmo Laravel con APP_KEY; no necesitamos
    // verificarlo del lado del cliente. Lo unico que validamos aca es que exista.
    this.estado.set({ tipo: 'formulario' });
  }

  restablecer(): void {
    if (this.formulario.invalid || !this.token) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { password, password_confirmation } = this.formulario.value;

    if (password !== password_confirmation) {
      this.formulario.setErrors({ noCoincide: true });
      return;
    }

    this.enviando.set(true);
    const carga = this.cargaGlobal.mostrar('Restableciendo clave...');

    const solicitud = this.modo === 'firebase'
      ? this.auth.restablecerClave(this.token!, password)
      : this.auth.confirmarResetConToken(this.token!, password);

    solicitud.subscribe({
      next: (respuesta) => {
        this.enviando.set(false);
        this.cargaGlobal.ocultar(carga);
        this.estado.set({ tipo: 'exito' });
        const destino = respuesta.usuario.rol === 'docente' ? '/docente' : '/alumno';
        setTimeout(() => this.router.navigateByUrl(destino), 1500);
      },
      error: (err) => {
        this.enviando.set(false);
        this.cargaGlobal.ocultar(carga);
        const mensaje =
          err?.status === 422
            ? 'El enlace expiro o ya fue utilizado. Solicita uno nuevo.'
            : (err?.error?.message ??
              err?.message ??
              'No se pudo restablecer la contrasena. Intentalo de nuevo.');
        this.estado.set({ tipo: 'error', mensaje });
      },
    });
  }
}
