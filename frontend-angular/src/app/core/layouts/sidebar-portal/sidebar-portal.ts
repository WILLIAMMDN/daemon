import {
  Component,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBars,
  faChevronDown,
  faChevronRight,
  faRightFromBracket,
  faThumbtack,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { PortalSidebarItem, PortalSidebarSection } from '../portal-sidebar.config';

const SUFFIJO_PIN = '_pin';

/**
 * Sidebar de portales DAEMON (DAEMON ARC Student Shell & Docente).
 *
 * Comportamiento:
 *  - Ancho canónico: 240px expandido, 76px colapsado.
 *  - Hover expande temporalmente cuando no está fijado.
 *  - Botón PIN fija el estado expandido en localStorage.
 *  - En móvil (<=980px): cajón off-canvas con backdrop y botón de cierre.
 *  - Acordeón de submenús preservado con auto-apertura por ruta activa.
 *  - Si está colapsado a 76px y se activa un padre con hijos, se expande
 *    adecuadamente antes de exponer el submenú.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sidebar-portal',
  imports: [
    RouterLink,
    RouterLinkActive,
    FontAwesomeModule,
  ],
  templateUrl: './sidebar-portal.html',
  styleUrl: './sidebar-portal.scss',
})
export class SidebarPortal implements OnInit, OnChanges, OnDestroy {
  @Input() ariaLabel = 'Navegación principal';
  @Input() brandDetalle = 'Portal';
  @Input() homeLink = '/';
  @Input() modo: 'alumno' | 'docente' = 'alumno';
  @Input() rol = 'Usuario';
  @Input() secciones: PortalSidebarSection[] = [];
  @Input() storageKey = 'daemon_sidebar_colapsado';

  @Output() logout = new EventEmitter<void>();

  readonly brandLogo = '/img/brand/daemon-arc-logo.svg';
  readonly brandLogoCompact = '/img/brand/daemon-arc-mark.svg';

  readonly iconos = {
    cerrar: faXmark,
    colapsar: faBars,
    fijar: faThumbtack,
    salir: faRightFromBracket,
    submenuAbierto: faChevronDown,
    submenuCerrado: faChevronRight,
  };

  /** Estado manual persistido (cuando está fijado). */
  colapsadoManual = false;
  /** Si está fijado, ignora el hover y mantiene el estado manual. */
  fijado = false;
  /** Hover activo (mouse encima). */
  hoverActivo = false;
  mobileOpen = false;
  brandLogoVisible = true;

  private readonly gruposAbiertos = new Set<string>();
  private routerSub?: Subscription;

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  get isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 980;
  }

  /**
   * Estado visual efectivo del sidebar.
   *  - En móvil, el cajón siempre es 240px cuando está abierto.
   *  - Si está fijado, respeta el estado manual persistido.
   *  - Si no está fijado, depende del hover.
   */
  get colapsado(): boolean {
    if (this.isMobile) return false;
    return this.fijado ? this.colapsadoManual : !this.hoverActivo;
  }

  @HostListener('window:resize')
  onResize(): void {
    this.cdr.markForCheck();
  }

  @HostBinding('class.sidebar-collapsed')
  get collapsedHost(): boolean {
    return this.colapsado;
  }

  @HostBinding('class.sidebar-pinned')
  get pinnedHost(): boolean {
    return this.fijado;
  }

  @HostBinding('class.theme-docente')
  get docenteHost(): boolean {
    return this.modo === 'docente';
  }

  @HostBinding('class.theme-alumno')
  get alumnoHost(): boolean {
    return this.modo === 'alumno';
  }

  ngOnInit(): void {
    const rawPin = typeof localStorage !== 'undefined' ? localStorage.getItem(this.storageKey + SUFFIJO_PIN) : null;
    this.fijado = rawPin === null ? true : rawPin === 'true';

    const rawColapsado = typeof localStorage !== 'undefined' ? localStorage.getItem(this.storageKey) : null;
    this.colapsadoManual = rawColapsado === 'true';
    if (this.fijado) {
      this.colapsadoManual = false;
    }
    this.sincronizarGruposIniciales();

    this.routerSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.sincronizarGruposIniciales();
        this.cdr.markForCheck();
      });
  }

  ngOnChanges(): void {
    this.sincronizarGruposIniciales();
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  /** Etiqueta corta del rol mostrada en el badge del brand bar. */
  get etiquetaRol(): string {
    if (this.modo === 'docente') return 'Docente';
    return 'Alumno';
  }

  abrirMovil(): void {
    this.mobileOpen = true;
    this.cdr.markForCheck();
  }

  cerrarMovil(): void {
    this.mobileOpen = false;
    this.cdr.markForCheck();
  }

  emitirLogout(): void {
    this.logout.emit();
  }

  estaActivo(item: PortalSidebarItem): boolean {
    if (item.ruta && this.rutaActiva(item.ruta, Boolean(item.exacto))) {
      return true;
    }
    return Boolean(item.hijos?.some((hijo) => this.estaActivo(hijo)));
  }

  estaAbierto(item: PortalSidebarItem): boolean {
    return this.gruposAbiertos.has(item.id);
  }

  onBrandLogoError(): void {
    this.brandLogoVisible = false;
    this.cdr.markForCheck();
  }

  navegar(): void {
    if (this.mobileOpen) {
      this.mobileOpen = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Alterna el modo "fijado".
   * Al fijar, fuerza el estado expandido hasta nuevo aviso.
   */
  toggleFijado(): void {
    this.fijado = !this.fijado;
    localStorage.setItem(this.storageKey + SUFFIJO_PIN, String(this.fijado));
    if (this.fijado) {
      this.colapsadoManual = false;
      localStorage.setItem(this.storageKey, 'false');
    }
    this.cdr.markForCheck();
  }

  /**
   * Colapsa/expande manualmente cuando el sidebar está fijado.
   * No-op cuando no está fijado (el estado lo gobierna el hover).
   */
  toggleColapsadoManual(): void {
    if (!this.fijado) {
      return;
    }
    this.colapsadoManual = !this.colapsadoManual;
    localStorage.setItem(this.storageKey, String(this.colapsadoManual));
    this.cdr.markForCheck();
  }

  onMouseEnter(): void {
    if (!this.hoverActivo) {
      this.hoverActivo = true;
      this.cdr.markForCheck();
    }
  }

  onMouseLeave(): void {
    if (this.hoverActivo) {
      this.hoverActivo = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Abre/cierra grupo de submenú.
   * Si está en rail colapsado de 76px, expande el sidebar adecuadamente
   * antes de mostrar los hijos.
   */
  toggleGrupo(item: PortalSidebarItem): void {
    if (this.colapsado) {
      if (this.fijado) {
        this.colapsadoManual = false;
        localStorage.setItem(this.storageKey, 'false');
      } else {
        this.hoverActivo = true;
      }
    }
    if (this.gruposAbiertos.has(item.id)) {
      this.gruposAbiertos.delete(item.id);
    } else {
      this.gruposAbiertos.add(item.id);
    }
    this.cdr.markForCheck();
  }

  private rutaActiva(ruta: string, exacto: boolean): boolean {
    return this.router.isActive(ruta, {
      fragment: 'ignored',
      matrixParams: 'ignored',
      paths: exacto ? 'exact' : 'subset',
      queryParams: 'ignored',
    });
  }

  private sincronizarGruposIniciales(): void {
    for (const seccion of this.secciones) {
      for (const item of seccion.items) {
        if (item.abierto || this.estaActivo(item)) {
          this.gruposAbiertos.add(item.id);
        }
      }
    }
  }
}
