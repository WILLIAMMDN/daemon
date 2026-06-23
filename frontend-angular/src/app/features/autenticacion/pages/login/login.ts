import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GoogleSigninButtonModule, SocialAuthService } from '@abacritt/angularx-social-login';
import type { Rive, StateMachineInput } from '@rive-app/webgl2';
import { Autenticacion } from '../../../../core/servicios/autenticacion';
import { Sesion } from '../../../../core/servicios/sesion';
import { validarCredenciales } from '../../../../shared/validadores/auth-validadores';

type TeddyInputs = {
  isChecking?: StateMachineInput;
  isHandsUp?: StateMachineInput;
  numLook?: StateMachineInput;
  trigSuccess?: StateMachineInput;
  trigFail?: StateMachineInput;
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, GoogleSigninButtonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('riveCanvas') private riveCanvas?: ElementRef<HTMLCanvasElement>;

  private readonly maquinaLogin = 'Login Machine';
  private readonly inputsRive: TeddyInputs = {};
  private rive?: Rive;
  private readonly reajustarRive = () => this.rive?.resizeDrawingSurfaceToCanvas();

  usuario = '';
  password = '';
  campoActivo = signal<'usuario' | 'password' | ''>('');
  passwordVisible = signal(false);
  riveDisponible = signal(false);
  riveError = signal(false);
  enviando = signal(false);
  error = signal('');

  constructor(
    private auth: Autenticacion,
    public sesion: Sesion,
    private router: Router,
    private socialAuthService: SocialAuthService,
    private zone: NgZone,
  ) {}

  ngOnInit(): void {
    this.socialAuthService.authState.subscribe((googleUser) => {
      if (!googleUser) {
        return;
      }

      this.enviando.set(true);
      this.error.set('');

      this.auth.loginGoogle(googleUser.idToken).subscribe({
        next: () => {
          if (this.sesion.esDocente()) {
            this.error.set('Este acceso es solo para estudiantes. Usa el login docente si eres profesor.');
            this.sesion.limpiar();
            this.enviando.set(false);
            this.dispararFallo();
            return;
          }

          this.dispararExito();
          setTimeout(() => this.router.navigateByUrl('/alumno'), 420);
        },
        error: (err) => {
          if (err.error?.requires_registration) {
            this.auth.cerrarSesionGoogle();
          }

          this.error.set(err.error?.requires_registration
            ? 'Ese Google todavia no tiene una cuenta activa. Termina el registro desde Crear cuenta.'
            : (err.error?.message ?? 'No se pudo iniciar sesion con Google en el servidor.'));
          this.enviando.set(false);
          this.dispararFallo();
        },
      });
    });
  }

  ngAfterViewInit(): void {
    this.cargarRive();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.reajustarRive);
    this.rive?.cleanup();
  }

  activarCampo(campo: 'usuario' | 'password'): void {
    this.campoActivo.set(campo);
    this.actualizarMascota();
  }

  desactivarCampo(campo: 'usuario' | 'password'): void {
    if (this.campoActivo() !== campo) {
      return;
    }

    this.campoActivo.set('');
    this.actualizarMascota();
  }

  actualizarUsuario(valor: string): void {
    this.usuario = valor;
    this.actualizarMirada();
  }

  alternarPassword(): void {
    this.passwordVisible.update((visible) => !visible);
    this.actualizarMascota();
  }

  entrar(form: NgForm): void {
    const validacion = validarCredenciales(this.usuario, this.password);
    if (validacion) {
      this.error.set(validacion);
      this.dispararFallo();
      return;
    }

    this.enviando.set(true);
    this.error.set('');

    this.auth.login({ usuario: this.usuario, password: this.password }).subscribe({
      next: () => {
        if (this.sesion.esDocente()) {
          this.error.set('Este acceso es solo para estudiantes. Usa el login docente si eres profesor.');
          this.sesion.limpiar();
          this.enviando.set(false);
          this.dispararFallo();
          return;
        }

        this.dispararExito();
        setTimeout(() => this.router.navigateByUrl('/alumno'), 420);
      },
      error: (error) => {
        this.error.set(error.error?.message ?? 'Credenciales incorrectas.');
        this.enviando.set(false);
        this.dispararFallo();
      },
    });
  }

  private cargarRive(): void {
    const canvas = this.riveCanvas?.nativeElement;
    if (!canvas) {
      this.riveError.set(true);
      return;
    }

    this.zone.runOutsideAngular(() => {
      void import('@rive-app/webgl2')
        .then(({ Alignment, Fit, Layout, Rive, RuntimeLoader }) => {
          RuntimeLoader.setWasmUrl('/rive/rive.wasm');
          RuntimeLoader.setWasmFallbackUrl('/rive/rive_fallback.wasm');

          this.rive = new Rive({
            src: '/rive/login-teddy.riv',
            canvas,
            artboard: 'Teddy',
            stateMachines: this.maquinaLogin,
            autoplay: true,
            layout: new Layout({
              fit: Fit.Contain,
              alignment: Alignment.Center,
            }),
            onLoad: () => {
              this.rive?.resizeDrawingSurfaceToCanvas();
              this.configurarInputsRive();
              this.actualizarMascota();
              window.addEventListener('resize', this.reajustarRive);
              this.zone.run(() => {
                this.riveDisponible.set(true);
                this.riveError.set(false);
              });
            },
            onLoadError: () => {
              this.zone.run(() => {
                this.riveDisponible.set(false);
                this.riveError.set(true);
              });
            },
          });
        })
        .catch(() => {
          this.zone.run(() => {
            this.riveDisponible.set(false);
            this.riveError.set(true);
          });
        });
    });
  }

  private configurarInputsRive(): void {
    const inputs = this.rive?.stateMachineInputs(this.maquinaLogin) ?? [];
    this.inputsRive.isChecking = inputs.find((input) => input.name === 'isChecking');
    this.inputsRive.numLook = inputs.find((input) => input.name === 'numLook');
    this.inputsRive.isHandsUp = inputs.find((input) => input.name === 'isHandsUp');
    this.inputsRive.trigSuccess = inputs.find((input) => input.name === 'trigSuccess');
    this.inputsRive.trigFail = inputs.find((input) => input.name === 'trigFail');
  }

  private actualizarMascota(): void {
    const campo = this.campoActivo();
    this.setBooleanInput(this.inputsRive.isChecking, campo === 'usuario');
    this.setBooleanInput(this.inputsRive.isHandsUp, campo === 'password' && !this.passwordVisible());
    this.actualizarMirada();
  }

  private actualizarMirada(): void {
    if (this.campoActivo() !== 'usuario') {
      return;
    }

    this.setNumberInput(this.inputsRive.numLook, Math.min(this.usuario.length * 2.4, 100));
  }

  private dispararExito(): void {
    this.fireInput(this.inputsRive.trigSuccess);
  }

  private dispararFallo(): void {
    this.fireInput(this.inputsRive.trigFail);
  }

  private setBooleanInput(input: StateMachineInput | undefined, value: boolean): void {
    if (input) {
      input.value = value;
    }
  }

  private setNumberInput(input: StateMachineInput | undefined, value: number): void {
    if (input) {
      input.value = value;
    }
  }

  private fireInput(input: StateMachineInput | undefined): void {
    input?.fire();
  }
}
