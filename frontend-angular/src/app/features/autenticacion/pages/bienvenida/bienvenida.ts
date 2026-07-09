import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, signal , ChangeDetectionStrategy} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Autenticacion, CompletarPerfilGoogleDatos } from '../../../../core/servicios/autenticacion';
import { CargaGlobal } from '../../../../core/servicios/carga-global';
import { Sesion } from '../../../../core/servicios/sesion';
import { AuthValidators } from '../../../../shared/validadores/auth-validadores';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-bienvenida',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './bienvenida.html',
  styleUrl: './bienvenida.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Bienvenida implements OnInit {
  readonly nombreMinLength = AuthValidators.NOMBRE_MIN_LENGTH;
  readonly usuarioMinLength = AuthValidators.USUARIO_MIN_LENGTH;
  readonly patronUsuario = /^[A-Za-z0-9_-]+$/;

  datos: CompletarPerfilGoogleDatos = {
    nombre_completo: '',
    usuario: '',
    nivel: 'TEENS',
  };

  guardando = signal(false);
  error = signal('');

  constructor(
    private auth: Autenticacion,
    public sesion: Sesion,
    private router: Router,
    private cargaGlobal: CargaGlobal,
  ) {}

  ngOnInit(): void {
    const usuario = this.sesion.usuario();

    if (!usuario) {
      this.router.navigateByUrl('/login');
      return;
    }

    if (usuario.perfil_completo !== false) {
      this.router.navigateByUrl(usuario.rol === 'docente' || usuario.rol === 'admin' ? '/docente' : '/alumno');
      return;
    }

    this.datos = {
      nombre_completo: usuario.nombre_completo?.trim() ?? '',
      usuario: this.usuarioInicial(usuario.usuario, usuario.email),
      nivel: this.normalizarNivel(usuario.nivel),
    };
  }

  actualizarUsuario(valor: string): void {
    this.datos.usuario = this.normalizarUsuario(valor);
  }

  guardar(form: NgForm): void {
    const payload: CompletarPerfilGoogleDatos = {
      nombre_completo: this.datos.nombre_completo.trim(),
      usuario: this.datos.usuario.trim(),
      nivel: this.datos.nivel,
    };

    const validacion = this.validar(payload, form);
    if (validacion) {
      this.error.set(validacion);
      return;
    }

    this.guardando.set(true);
    this.error.set('');
    const carga = this.cargaGlobal.mostrar('Guardando perfil...');

    this.auth.completarPerfil(payload).subscribe({
      next: () => {
        void this.router.navigateByUrl('/alumno').finally(() => this.cargaGlobal.ocultar(carga));
      },
      error: (error) => {
        const errores = error.error?.errors;
        const primerError = errores ? Object.values(errores).flat()[0] : null;
        this.error.set(String(primerError ?? error.error?.message ?? 'No se pudo completar tu perfil.'));
        this.guardando.set(false);
        this.cargaGlobal.ocultar(carga);
      },
    });
  }

  salir(): void {
    if (this.guardando()) {
      return;
    }

    this.guardando.set(true);
    this.error.set('');
    const carga = this.cargaGlobal.mostrar('Cerrando sesion...');

    this.auth.logout().subscribe({
      next: () => this.volverAlLogin(carga),
      error: () => {
        this.sesion.limpiar();
        this.volverAlLogin(carga);
      },
    });
  }

  private volverAlLogin(carga: symbol): void {
    this.cargaGlobal.cambiarMensaje('Volviendo al login...');
    setTimeout(() => {
      void this.router.navigateByUrl('/login').finally(() => this.cargaGlobal.ocultar(carga));
    }, 420);
  }

  private validar(payload: CompletarPerfilGoogleDatos, form: NgForm): string | null {
    if (!payload.nombre_completo || payload.nombre_completo.length < this.nombreMinLength) {
      return `Ingresa tu nombre completo con al menos ${this.nombreMinLength} caracteres.`;
    }

    if (!payload.usuario || payload.usuario.length < this.usuarioMinLength) {
      return `El usuario debe tener al menos ${this.usuarioMinLength} caracteres.`;
    }

    if (!this.patronUsuario.test(payload.usuario)) {
      return 'El usuario solo puede usar letras, numeros, guiones y guiones bajos.';
    }

    if (form.invalid) {
      return AuthValidators.generalFormError;
    }

    return null;
  }

  private normalizarNivel(nivel: string | null | undefined): 'KIDS' | 'TEENS' | 'PRO' {
    return nivel === 'KIDS' || nivel === 'PRO' ? nivel : 'TEENS';
  }

  private usuarioInicial(usuario: string | null | undefined, email: string | null | undefined): string {
    const usuarioNormalizado = this.normalizarUsuario(usuario);

    if (usuarioNormalizado.length >= this.usuarioMinLength) {
      return usuarioNormalizado;
    }

    return this.normalizarUsuario(email?.split('@')[0] ?? '');
  }

  private normalizarUsuario(valor: string | null | undefined): string {
    return (valor ?? '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9_-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^[-_]+|[-_]+$/g, '')
      .slice(0, 50);
  }
}
