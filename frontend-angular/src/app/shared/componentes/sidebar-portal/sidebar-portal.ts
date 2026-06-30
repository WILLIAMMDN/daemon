import { Component, EventEmitter, HostBinding, Input, OnChanges, OnInit, Output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBars,
  faChevronDown,
  faChevronRight,
  faGraduationCap,
  faChalkboardUser,
  faRightFromBracket,
  faThumbtack,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
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
 *  - User card con avatar, rol, nombre y email.
 *  - Navegación con secciones, submenús, badges e iconos.
 *  - Footer con cerrar sesión.
 */
@Component({
  selector: 'app-sidebar-portal',
  imports: [
    RouterLink,
    RouterLinkActive,
    FontAwesomeModule,
    NzAvatarModule,
    NzBadgeModule,
    NzDividerModule,
    NzIconModule,
    NzTagModule,
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
  @Input() perfilEmail = '';
  @Input() perfilAvatar = '';
  @Input() rol = 'Usuario';
  @Input() secciones: PortalSidebarSection[] = [];
  @Input() storageKey = 'daemon_sidebar_colapsado';

  @Output() logout = new EventEmitter<void>();

  readonly iconos = {
    cerrar: faXmark,
    colapsar: faBars,
    fijar: faThumbtack,
    salir: faRightFromBracket,
    submenuAbierto: faChevronDown,
    submenuCerrado: faChevronRight,
    alumno: faGraduationCap,
    docente: faChalkboardUser,
  };

  /** Estado manual persistido (cuando está fijado). */
  colapsadoManual = false;
  /** Si está fijado, ignora el hover y mantiene el estado manual. */
  fijado = false;
  /** Hover activo (mouse encima). */
  hoverActivo = false;
  mobileOpen = false;

  private readonly gruposAbiertos = new Set<string>();

  constructor(private router: Router) {}

  /**
   * Estado visual efectivo del sidebar.
   *  - Si está fijado, respeta el estado manual persistido.
   *  - Si no, depende del hover.
   */
  get colapsado(): boolean {
    return this.fijado ? this.colapsadoManual : !this.hoverActivo;
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

  ngOnChanges(): void {
    this.sincronizarGruposIniciales();
  }

  /** Etiqueta corta del rol mostrada en el badge del brand bar. */
  get etiquetaRol(): string {
    if (this.modo === 'docente') return 'Docente';
    return 'Alumno';
  }

  abrirMovil(): void {
    this.mobileOpen = true;
  }

  cerrarMovil(): void {
    this.mobileOpen = false;
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

  navegar(): void {
    this.mobileOpen = false;
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