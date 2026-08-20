import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, signal, ViewChild } from '@angular/core';
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
import { CargaGlobal } from '../../../../core/servicios/carga-global';
import { Autenticacion } from '../../../../core/servicios/autenticacion';
import { Api } from '../../../../core/servicios/api';
import { Sesion } from '../../../../core/servicios/sesion';
import { validarCredenciales } from '../../../../shared/validadores/auth-validadores';

RuntimeLoader.setWasmUrl('/rive/rive.wasm');
RuntimeLoader.setWasmFallbackUrl('/rive/rive_fallback.wasm');
const riveRuntimeReady = RuntimeLoader.awaitInstance().catch(() => undefined);

type TeddyInputs = {
  isChecking?: StateMachineInput;
  isHandsUp?: StateMachineInput;
  numLook?: StateMachineInput;
  trigSuccess?: StateMachineInput;
  trigFail?: StateMachineInput;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login implements AfterViewInit, OnDestroy {
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
  vinculacionGoogle = signal(false);
  usuarioLegacy = '';
  passwordLegacy = '';

  constructor(
    private auth: Autenticacion,
    public sesion: Sesion,
    private router: Router,
    private zone: NgZone,
    private cargaGlobal: CargaGlobal,
    private api: Api,
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
    if (validacion) {
      this.error.set(validacion);
      this.dispararFallo();
      return;
    }

    this.enviando.set(true);
    this.error.set('');
    const carga = this.cargaGlobal.mostrar('Validando tus credenciales...');

    const acceso = this.usuario.includes('@')
      ? this.auth.loginEmailFirebase(this.usuario.trim(), this.password)
      : this.auth.login({ usuario: this.usuario, password: this.password });

    acceso.subscribe({
      next: () => this.completarAcceso(carga),
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

    this.auth.loginGoogleFirebase(false).subscribe({
      next: () => {
        if (this.sesion.usuario()?.perfil_completo === false) {
          this.mostrarVinculacionGoogle(
            carga,
            'Puedes vincular este Google con tu cuenta anterior para conservar progreso, XP y monedas.',
          );
          return;
        }

        this.completarAcceso(carga);
      },
      error: (err) => {
        if (err.error?.requires_registration) {
          this.mostrarVinculacionGoogle(
            carga,
            'Ese Google no esta vinculado. Confirma tu cuenta anterior o crea una cuenta nueva.',
          );
          return;
        }

        this.error.set(err.error?.message ?? err.message ?? 'No se pudo iniciar sesion con Google.');
        this.enviando.set(false);
        this.cargaGlobal.ocultar(carga);
        this.dispararFallo();
      },
    });
  }

  vincularCuentaAnterior(form: NgForm): void {
    const validacion = validarCredenciales(this.usuarioLegacy, this.passwordLegacy);
    if (form.invalid || validacion) {
      this.error.set(validacion ?? 'Completa el usuario y la contrasena de tu cuenta anterior.');
      return;
    }

    this.enviando.set(true);
    this.error.set('');
    const carga = this.cargaGlobal.mostrar('Vinculando tu progreso anterior...');

    this.auth.vincularCuentaLegacyFirebase({
      usuario: this.usuarioLegacy.trim(),
      password: this.passwordLegacy,
    }).subscribe({
      next: () => {
        this.vinculacionGoogle.set(false);
        this.passwordLegacy = '';
        this.completarAcceso(carga);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message ?? 'No se pudo vincular la cuenta anterior.');
        this.enviando.set(false);
        this.cargaGlobal.ocultar(carga);
        this.dispararFallo();
      },
    });
  }

  crearCuentaNuevaGoogle(): void {
    this.enviando.set(true);
    this.error.set('');
    const carga = this.cargaGlobal.mostrar('Creando tu cuenta DAEMON...');

    this.auth.crearCuentaGoogleActual().subscribe({
      next: () => {
        this.vinculacionGoogle.set(false);
        this.completarAcceso(carga);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message ?? 'No se pudo crear la cuenta con Google.');
        this.enviando.set(false);
        this.cargaGlobal.ocultar(carga);
        this.dispararFallo();
      },
    });
  }

  cancelarVinculacionGoogle(): void {
    this.auth.cerrarSesionGoogle();
    this.sesion.limpiar();
    this.vinculacionGoogle.set(false);
    this.usuarioLegacy = '';
    this.passwordLegacy = '';
    this.error.set('');
  }

  private mostrarVinculacionGoogle(carga: symbol, mensaje: string): void {
    this.vinculacionGoogle.set(true);
    this.error.set(mensaje);
    this.enviando.set(false);
    this.cargaGlobal.ocultar(carga);
  }

  private completarAcceso(carga: symbol): void {
    if (!this.sesion.esAlumno()) {
      this.error.set('Este acceso es solo para estudiantes. Usa el portal correspondiente a tu cuenta.');
      this.sesion.limpiar();
      this.enviando.set(false);
      this.cargaGlobal.ocultar(carga);
      this.dispararFallo();
      return;
    }

    this.dispararExito();
    this.cargaGlobal.cambiarMensaje('Abriendo tu portal de estudiante...');
    this.precargarPanelAlumno();
    setTimeout(() => {
      void this.router.navigateByUrl(
        this.sesion.usuario()?.perfil_completo === false ? '/bienvenida' : '/alumno',
      ).finally(() => this.cargaGlobal.ocultar(carga));
    }, 420);
  }

  private precargarPanelAlumno(): void {
    if (this.sesion.usuario()?.perfil_completo === false) {
      return;
    }

    // La animación de acceso y la primera consulta viajan en paralelo. Cuando
    // el panel se crea, Api reutiliza esta misma solicitud en curso.
    this.api.get('/alumno/panel').subscribe({ error: () => undefined });
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
