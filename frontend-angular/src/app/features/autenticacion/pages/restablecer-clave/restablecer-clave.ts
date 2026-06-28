import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Autenticacion } from '../../../../core/servicios/autenticacion';
import { Sesion } from '../../../../core/servicios/sesion';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'formulario'; email: string }
  | { tipo: 'exito' }
  | { tipo: 'error'; mensaje: string };

@Component({
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

  get emailDetectado(): string {
    const e = this.estado();
    return e.tipo === 'formulario' ? e.email : '';
  }

  get mensajeError(): string {
    const e = this.estado();
    return e.tipo === 'error' ? e.mensaje : '';
  }

  private oobCode: string | null = null;

  constructor(
    private ruta: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private auth: Autenticacion,
    private sesion: Sesion,
  ) {
    this.formulario = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.oobCode = this.ruta.snapshot.queryParamMap.get('oobCode');

    if (!this.oobCode) {
      this.estado.set({
        tipo: 'error',
        mensaje: 'El enlace de recuperacion no es valido. Solicita uno nuevo desde la pagina de inicio.',
      });
      return;
    }

    this.auth.verificarCodigoResetFirebase(this.oobCode).subscribe({
      next: (email) => {
        this.estado.set({ tipo: 'formulario', email });
      },
      error: () => {
        this.estado.set({
          tipo: 'error',
          mensaje: 'El enlace expiro o ya fue utilizado. Solicita uno nuevo.',
        });
      },
    });
  }

  restablecer(): void {
    if (this.formulario.invalid || !this.oobCode) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { password, password_confirmation } = this.formulario.value;

    if (password !== password_confirmation) {
      this.formulario.setErrors({ noCoincide: true });
      return;
    }

    this.enviando.set(true);

    this.auth.restablecerClave(this.oobCode!, password).subscribe({
      next: () => {
        this.enviando.set(false);
        this.estado.set({ tipo: 'exito' });
        const destino = this.sesion.esDocente() ? '/docente' : '/alumno';
        setTimeout(() => this.router.navigateByUrl(destino), 1500);
      },
      error: (err) => {
        this.enviando.set(false);
        this.estado.set({
          tipo: 'error',
          mensaje:
            err?.error?.message ??
            err?.message ??
            'No se pudo restablecer la contrasena. Intentalo de nuevo.',
        });
      },
    });
  }
}