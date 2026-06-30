import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCloud, faPaperPlane, faPlane, faStar } from '@fortawesome/free-solid-svg-icons';
import { Router, RouterLink } from '@angular/router';
import { Footer } from '../../../../core/layouts/footer/footer';
import { Header } from '../../../../core/layouts/header/header';
import { Activos } from '../../../../core/servicios/activos';
import { Autenticacion } from '../../../../core/servicios/autenticacion';
import { CargaGlobal } from '../../../../core/servicios/carga-global';
import { Sesion } from '../../../../core/servicios/sesion';
import { FloatingShape } from '../../../../shared/componentes/floating-shape/floating-shape';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    RouterLink,
    Header,
    Footer,
    FontAwesomeModule,
    FloatingShape,
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio implements OnInit, OnDestroy {
  readonly procesandoGoogle = signal(false);
  readonly errorGoogle = signal<string | null>(null);
  readonly heroSlideIndex = signal(0);
  private heroTimer: number | null = null;

  iconoAvion = faPlane;
  iconoAvionPapel = faPaperPlane;
  iconoNube = faCloud;
  iconoEstrella = faStar;

  readonly novedades = [
    {
      id: 'novedad-1',
      anterior: 'novedad-3',
      siguiente: 'novedad-2',
      imagen: 'img/banners/online-banner.jpg',
      alt: 'Estudiante explorando herramientas de inteligencia artificial',
      categoria: 'PLATAFORMA',
      fecha: 'Hace 2 dias',
      titulo: 'Clases 100% en linea con IA integrada',
      descripcion: 'Los estudiantes ahora pueden acceder a tutorias personalizadas y recursos interactivos potenciados por IA en su portal.',
      accion: 'Ingresar al portal',
      ruta: '/login',
    },
    {
      id: 'novedad-2',
      anterior: 'novedad-1',
      siguiente: 'novedad-3',
      imagen: 'img/banners/scratch-banner.jpg',
      alt: 'IA + Scratch: Estudiantes programando un juego arcade con IA',
      categoria: 'ACADEMICO',
      fecha: '15 de junio, 2026',
      titulo: 'IA + Scratch: Aprende creando desde cero',
      descripcion: 'En DAEMON, los estudiantes combinan Inteligencia Artificial y Scratch para crear ideas, personajes y proyectos interactivos mientras desarrollan logica, creatividad y habilidades digitales.',
      accion: 'Crear cuenta',
      ruta: '/registro',
    },
    {
      id: 'novedad-3',
      anterior: 'novedad-2',
      siguiente: 'novedad-1',
      imagen: 'img/banners/tienda_banner.jpg',
      alt: 'Panel de tokens y recompensas de DAEMON',
      categoria: 'ECONOMIA',
      fecha: '08 de junio, 2026',
      titulo: 'Actualizacion en la Tienda DAEMON',
      descripcion: 'Nuevos premios disponibles. Acumula tokens y canjealos desde tu portal.',
      accion: 'Ver mis premios',
      ruta: '/login',
    },
  ];

  readonly heroSlides = [
    {
      imagen: 'img/banners/zoe-banner.png',
      alt: 'Estudiantes en clases de DAEMON',
      estilo: 'contain-left',
    },
    {
      imagen: 'img/banners/ia_banner.jpg',
      alt: 'Clase de inteligencia artificial para estudiantes',
      estilo: 'cover-center',
    },
    {
      imagen: 'img/banners/online-banner.jpg',
      alt: 'Estudiante explorando recursos digitales de DAEMON',
      estilo: 'cover-center',
    },
    {
      imagen: 'img/banners/scratch-banner.jpg',
      alt: 'Estudiantes creando proyectos con IA y Scratch',
      estilo: 'cover-center',
    },
  ];

  constructor(
    private autenticacion: Autenticacion,
    private sesion: Sesion,
    private router: Router,
    public activos: Activos,
    private cargaGlobal: CargaGlobal,
  ) {}

  ngOnInit(): void {
    this.iniciarCarruselHero();
  }

  ngOnDestroy(): void {
    this.detenerCarruselHero();
  }

  irAHeroSlide(index: number): void {
    this.heroSlideIndex.set(index);
    this.reiniciarCarruselHero();
  }

  siguienteHeroSlide(): void {
    this.avanzarHeroSlide();
    this.reiniciarCarruselHero();
  }

  anteriorHeroSlide(): void {
    this.heroSlideIndex.update((actual) => (
      actual === 0 ? this.heroSlides.length - 1 : actual - 1
    ));
    this.reiniciarCarruselHero();
  }

  continuarConGoogle(): void {
    this.errorGoogle.set(null);
    this.procesandoGoogle.set(true);
    const carga = this.cargaGlobal.mostrar('Conectando con Google...');

    this.autenticacion.loginGoogleFirebase(true).subscribe({
      next: () => {
        const usuario = this.sesion.usuario();

        if (usuario?.rol === 'alumno') {
          this.cargaGlobal.cambiarMensaje('Abriendo tu portal de estudiante...');
          void this.router.navigateByUrl(usuario.perfil_completo === false ? '/bienvenida' : '/alumno')
            .finally(() => this.cargaGlobal.ocultar(carga));
          return;
        }

        this.errorGoogle.set('Este acceso es solo para estudiantes. Usa el login docente si eres profesor.');
        this.sesion.limpiar();
        this.procesandoGoogle.set(false);
        this.cargaGlobal.ocultar(carga);
      },
      error: (err) => {
        if (err.error?.requires_registration) {
          this.autenticacion.cerrarSesionGoogle();
        }

        this.errorGoogle.set(err.error?.requires_registration
          ? 'Ese Google todavia no tiene una cuenta DAEMON. Crea tu cuenta desde el registro.'
          : (err.error?.message ?? err.message ?? 'No se pudo iniciar sesion con Google.'));
        this.procesandoGoogle.set(false);
        this.cargaGlobal.ocultar(carga);
      },
    });
  }

  private iniciarCarruselHero(): void {
    this.detenerCarruselHero();
    this.heroTimer = window.setInterval(() => this.avanzarHeroSlide(), 6500);
  }

  private detenerCarruselHero(): void {
    if (this.heroTimer !== null) {
      window.clearInterval(this.heroTimer);
      this.heroTimer = null;
    }
  }

  private reiniciarCarruselHero(): void {
    this.iniciarCarruselHero();
  }

  private avanzarHeroSlide(): void {
    this.heroSlideIndex.update((actual) => (actual + 1) % this.heroSlides.length);
  }
}
