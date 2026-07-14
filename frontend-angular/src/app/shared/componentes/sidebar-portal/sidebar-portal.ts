import { Component, EventEmitter, HostBinding, HostListener, Input, OnChanges, OnInit, Output, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBars,
  faChartLine,
  faChevronDown,
  faChevronRight,
  faEnvelope,
  faGraduationCap,
  faChalkboardUser,
  faRightFromBracket,
  faThumbtack,
  faUserTag,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { MonedaDaemon } from '../moneda-daemon/moneda-daemon';
import { FloatingShape } from '../floating-shape/floating-shape';
import { PortalSidebarItem, PortalSidebarSection } from '../../../core/layouts/portal-sidebar.config';

const SUFFIJO_PIN = '_pin';

/**
 * Sidebar de portales DAEMON.
 *
 * Comportamiento:
 *  - Por defecto, está colapsado (~88px) y se expande al recibir hover.
 *  - El usuario puede "fijarlo" con el botón pin para que quede siempre expandido
 *    según el estado manual persistido en localStorage.
 *  - En mobile, se muestra/oculta con el botón hamburguesa y un backdrop.
 *
 * Estructura visual:
 *  - Brand bar superior con color sólido institucional (alumno / docente).
 *  - Bloque de perfil limpio tipo University: avatar grande arriba (nz-avatar),
 *    nombre + chevron debajo; click en el bloque abre un popover con toda la
 *    información de la cuenta (correo, rol, nivel, tokens).
 *  - Saldo de la moneda DAEMON visible debajo del rol, sin necesidad de abrir
 *    el popover (usa el componente reutilizable <app-moneda-daemon>).
 *  - Navegación con secciones, submenús, badges e iconos.
 *  - Footer con cerrar sesión y firma institucional.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sidebar-portal',
  imports: [
    RouterLink,
    RouterLinkActive,
    FontAwesomeModule,
    DecimalPipe,
    TitleCasePipe,
    NzAvatarModule,
    NzBadgeModule,
    NzDividerModule,
    NzIconModule,
    NzPopoverModule,
    NzTagModule,
    MonedaDaemon,
    FloatingShape,
  ],
  templateUrl: './sidebar-portal.html',
  styleUrl: './sidebar-portal.scss',
})
export class SidebarPortal implements OnInit, OnChanges {
  @Input() ariaLabel = 'Navegación principal';
  @Input() brandDetalle = 'Portal';
  @Input() homeLink = '/';
  @Input() modo: 'alumno' | 'docente' = 'alumno';
  @Input() perfilDetalle = '';
  @Input() perfilNombre = 'Cuenta activa';
  @Input() perfilUsuario = '';
  @Input() perfilEmail = '';
  @Input() perfilAvatar = '';
  @Input() perfilNivel: string | null = null;
  @Input() perfilTokens: number | null = null;
  @Input() rol = 'Usuario';
  @Input() secciones: PortalSidebarSection[] = [];
  @Input() storageKey = 'daemon_sidebar_colapsado';

  @Output() logout = new EventEmitter<void>();

  readonly brandLogo = '/img/brand/daemon-transparent.png';
  readonly brandLogoCompact = '/img/brand/daemon-small-transparent.png';

  readonly iconos = {
    cerrar: faXmark,
    colapsar: faBars,
    fijar: faThumbtack,
    salir: faRightFromBracket,
    submenuAbierto: faChevronDown,
    submenuCerrado: faChevronRight,
    chevronDown: faChevronDown,
    alumno: faGraduationCap,
    docente: faChalkboardUser,
    correo: faEnvelope,
    rolIcono: faUserTag,
    nivel: faChartLine,
  };

  /** Estado manual persistido (cuando está fijado). */
  colapsadoManual = false;
  /** Si está fijado, ignora el hover y mantiene el estado manual. */
  fijado = false;
  /** Hover activo (mouse encima). */
  hoverActivo = false;
  mobileOpen = false;
  /**
   * Estado del popover del bloque de perfil (click sobre avatar/nombre/chevron).
   * Lo expone `[(nzPopoverVisible)]` para que el click toggle lo abra/cierre.
   */
  profilePopoverOpen = false;
  /**
   * Si la imagen del avatar falla al cargar (404, CORS, etc.),
   * se vuelve false y nz-avatar vuelve a mostrar las iniciales.
   */
  avatarSrcVisible = true;
  brandLogoVisible = true;

  private readonly gruposAbiertos = new Set<string>();

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  get isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 980;
  }

  /**
   * Estado visual efectivo del sidebar.
   *  - Si está fijado, respeta el estado manual persistido.
   *  - Si no, depende del hover.
   */
  get colapsado(): boolean {
    if (this.isMobile) return false;
    return this.fijado ? this.colapsadoManual : !this.hoverActivo;
  }

  @HostListener('window:resize')
  onResize(): void {
    // Fuerzo la evaluación de isMobile para recalcular colapsado
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.profilePopoverOpen = false;
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
    this.colapsadoManual = localStorage.getItem(this.storageKey) === 'true';
    this.fijado = localStorage.getItem(this.storageKey + SUFFIJO_PIN) === 'true';
    if (this.fijado) {
      this.colapsadoManual = false;
    }
    this.sincronizarGruposIniciales();
  }

  /** Etiqueta corta del rol mostrada en el badge del brand bar. */
  get etiquetaRol(): string {
    if (this.modo === 'docente') return 'Docente';
    return 'Alumno';
  }

  get perfilNombreCorto(): string {
    const base = (this.perfilNombre || this.perfilUsuario || 'Cuenta activa').trim();
    const partes = base.split(/\s+/).filter(Boolean);
    if (partes.length <= 2) {
      return base || 'Cuenta activa';
    }
    return `${partes[0]} ${partes[1]}`;
  }

  get profilePopoverClass(): string {
    const responsiveClass = this.isMobile ? 'profile-popover--mobile' : 'profile-popover--desktop';
    return `profile-popover profile-popover--${this.modo} ${responsiveClass}`;
  }

  get profilePopoverPlacement(): string {
    return this.isMobile ? 'bottomLeft' : 'rightTop';
  }

  abrirMovil(): void {
    this.mobileOpen = true;
    this.cdr.markForCheck();
  }

  cerrarMovil(): void {
    this.mobileOpen = false;
    this.profilePopoverOpen = false;
    this.cdr.markForCheck();
  }

  cerrarProfilePopover(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.profilePopoverOpen = false;
  }

  emitirLogout(): void {
    this.profilePopoverOpen = false;
    this.logout.emit();
  }

  estaActivo(item: PortalSidebarItem): boolean {
    if (item.ruta && this.rutaActiva(item.ruta, Boolean(item.exacto))) {
      return true;
    }
    return Boolean(item.hijos?.some((hijo) => this.estaActivo(hijo)));
  }

  estaAbierto(item: PortalSidebarItem): boolean {
    return this.gruposAbiertos.has(item.id) || this.estaActivo(item);
  }

  iniciales(): string {
    const base = this.perfilNombre || 'DAEMON';
    return (
      base
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0]?.toUpperCase())
        .join('') || 'D'
    );
  }

  /**
   * URL resuelta del avatar, lista para pasar a nz-avatar.
   * Vacía cuando no hay avatar para que nz-avatar muestre nzText.
   */
  avatarSrc(): string {
    return this.perfilAvatar?.trim() ?? '';
  }

  /**
   * Se ejecuta cuando la imagen del avatar falla al cargar.
   * Vuelve a las iniciales automáticamente.
   */
  onAvatarError(): void {
    this.avatarSrcVisible = false;
  }

  onBrandLogoError(): void {
    this.brandLogoVisible = false;
  }

  ngOnChanges(): void {
    // Cuando cambia el avatar (login, actualización de perfil), re-intentar mostrarlo.
    this.avatarSrcVisible = true;
    this.sincronizarGruposIniciales();
  }

  navegar(): void {
    this.mobileOpen = false;
    this.profilePopoverOpen = false;
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
  }

  onMouseEnter(): void {
    this.hoverActivo = true;
  }

  onMouseLeave(): void {
    this.hoverActivo = false;
  }

  toggleGrupo(item: PortalSidebarItem): void {
    // Si está visualmente colapsado, primero expandirlo para mostrar el submenú.
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
