import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, signal , ChangeDetectionStrategy} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  Alignment,
  Fit,
  Layout,
  RuntimeLoader,
  Rive as RiveCanvas,
  type Rive,
  type StateMachineInput,
} from '@rive-app/canvas';
import { Autenticacion } from '../../../../core/servicios/autenticacion';

RuntimeLoader.setWasmUrl('/rive/rive.wasm');
RuntimeLoader.setWasmFallbackUrl('/rive/rive_fallback.wasm');
const riveRuntimeReady = RuntimeLoader.awaitInstance().catch(() => undefined);
import { CargaGlobal } from '../../../../core/servicios/carga-global';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login-docente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login-docente.html',
  styleUrls: ['../login/login.scss'],
})
export class LoginDocente implements AfterViewInit, OnDestroy {
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
    private sesion: Sesion,
    private router: Router,
    private zone: NgZone,
    private cargaGlobal: CargaGlobal,
  ) {}

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
    if (validacion || form.invalid) {
      this.error.set(validacion ?? 'Revisa tus credenciales.');
      this.dispararFallo();
      return;
    }

    this.enviando.set(true);
    this.error.set('');
    const carga = this.cargaGlobal.mostrar('Validando acceso docente...');

    const acceso = this.usuario.includes('@')
      ? this.auth.loginEmailFirebase(this.usuario.trim(), this.password)
      : this.auth.login({ usuario: this.usuario, password: this.password });

    acceso.subscribe({
      next: () => this.entrarComoDocente(carga),
      error: (error) => {
        this.error.set(error.error?.message ?? 'Credenciales incorrectas.');
        this.enviando.set(false);
        this.cargaGlobal.ocultar(carga);
        this.dispararFallo();
      },
    });
  }

  continuarConGoogle(): void {
    this.enviando.set(true);
    this.error.set('');
    const carga = this.cargaGlobal.mostrar('Conectando con Google...');

    this.auth.loginGoogleFirebase().subscribe({
      next: () => this.entrarComoDocente(carga),
      error: (err) => {
        if (err.error?.requires_registration) {
          this.auth.cerrarSesionGoogle();
        }

        this.error.set(err.error?.requires_registration
          ? 'Ese Google no esta vinculado a una cuenta docente o administradora de DAEMON.'
          : (err.error?.message ?? err.message ?? 'No se pudo iniciar sesion con Google.'));
        this.enviando.set(false);
        this.cargaGlobal.ocultar(carga);
        this.dispararFallo();
      },
    });
  }

  private entrarComoDocente(carga: symbol): void {
    if (this.sesion.esDocente()) {
      this.dispararExito();
      this.cargaGlobal.cambiarMensaje('Abriendo el portal docente...');
      setTimeout(() => {
        void this.router.navigateByUrl('/docente').finally(() => this.cargaGlobal.ocultar(carga));
      }, 420);
      return;
    }

    this.error.set('Este usuario no tiene permiso docente.');
    this.sesion.limpiar();
    this.enviando.set(false);
    this.cargaGlobal.ocultar(carga);
    this.dispararFallo();
  }

  private cargarRive(): void {
    const canvas = this.riveCanvas?.nativeElement;
    if (!canvas) {
      this.riveError.set(true);
      return;
    }

    this.zone.runOutsideAngular(() => {
      void riveRuntimeReady
        .then(() => {
          const layout = new Layout({
            fit: Fit.Contain,
            alignment: Alignment.Center,
          });

          const marcarListo = () => {
            this.rive?.resizeDrawingSurfaceToCanvas();
            this.configurarInputsRive();
            this.actualizarMascota();
            window.addEventListener('resize', this.reajustarRive);
            this.zone.run(() => {
              this.riveDisponible.set(true);
              this.riveError.set(false);
            });
          };

          const marcarError = () => {
            this.zone.run(() => {
              this.riveDisponible.set(false);
              this.riveError.set(true);
            });
          };

          const cargar = (interactivo: boolean) => {
            this.rive = new RiveCanvas({
              src: '/rive/login-teddy.riv',
              canvas,
              ...(interactivo ? { artboard: 'Teddy', stateMachines: this.maquinaLogin } : {}),
              autoplay: true,
              layout,
              onLoad: marcarListo,
              onLoadError: () => {
                if (interactivo) {
                  this.rive?.cleanup();
                  cargar(false);
                  return;
                }

                marcarError();
              },
            });
          };

          cargar(true);
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
