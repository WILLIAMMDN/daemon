import { Component, EventEmitter, HostBinding, Input, OnChanges, OnInit, Output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBars,
  faChevronDown,
  faChevronRight,
  faCircleDot,
  faRightFromBracket,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { PortalSidebarItem, PortalSidebarSection } from '../../../core/layouts/portal-sidebar.config';

@Component({
  selector: 'app-sidebar-portal',
  imports: [RouterLink, RouterLinkActive, FontAwesomeModule],
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
  @Input() rol = 'Usuario';
  @Input() secciones: PortalSidebarSection[] = [];
  @Input() storageKey = 'daemon_sidebar_colapsado';

  @Output() logout = new EventEmitter<void>();

  readonly iconos = {
    cerrar: faXmark,
    colapsar: faBars,
    desplegar: faChevronRight,
    salir: faRightFromBracket,
    submenuAbierto: faChevronDown,
    submenuCerrado: faChevronRight,
    punto: faCircleDot,
  };

  collapsed = false;
  mobileOpen = false;
  private readonly gruposAbiertos = new Set<string>();

  @HostBinding('class.sidebar-collapsed')
  get collapsedHost(): boolean {
    return this.collapsed;
  }

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.collapsed = localStorage.getItem(this.storageKey) === 'true';
    this.sincronizarGruposIniciales();
  }

  ngOnChanges(): void {
    this.sincronizarGruposIniciales();
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

  navegar(): void {
    this.mobileOpen = false;
  }

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
    localStorage.setItem(this.storageKey, String(this.collapsed));
  }

  toggleGrupo(item: PortalSidebarItem): void {
    if (this.collapsed) {
      this.collapsed = false;
      localStorage.setItem(this.storageKey, 'false');
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
