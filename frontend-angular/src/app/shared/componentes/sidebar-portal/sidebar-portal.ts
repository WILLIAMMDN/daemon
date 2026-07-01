import { Component, EventEmitter, HostBinding, HostListener, Input, OnChanges, OnInit, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import {
  faBars,
  faChartLine,
  faChevronDown,
  faChevronRight,
  faEnvelope,
  faGraduationCap,
  faChalkboardUser,
  faHeadset,
  faMagnifyingGlass,
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
 *  - Footer con botón de soporte, cerrar sesión y firma institucional.
 */
@Component({
  selector: 'app-sidebar-portal',
  imports: [
    RouterLink,
    RouterLinkActive,
    FontAwesomeModule,
    DecimalPipe,
    NzAvatarModule,
    NzBadgeModule,
    NzDividerModule,
    NzIconModule,
    NzPopoverModule,
    NzTagModule,
    MonedaDaemon,
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

  /**
   * Contadores dinámicos por item.id. Si se provee y el número es > 0,
   * el badge del item se compone con la cifra (ej. "Hoy · 3").
   * Si el item ya tiene un `badge` estático, se concatena: "Hoy · 3".
   * Si solo hay contador y no badge, se muestra solo el número.
   * Esto convierte al sidebar en un centro de notificaciones inteligente.
   */
  @Input() contadores: Record<string, number> | null = null;

  /**
   * Mostrar saldo DAEMON prominente en el header del sidebar.
   * Default true para que la economía siempre esté visible.
   */
  @Input() mostrarSaldoHeader = true;

  /** Botón de soporte (visible en expandido). Por defecto abre WhatsApp. */
  @Input() soporteLink = 'https://wa.me/51930893675';

  @Output() logout = new EventEmitter<void>();

  readonly anioActual = new Date().getFullYear();

  readonly brandLogo = '/img/brand/daemon.svg';
  readonly brandLogoCompact = '/img/brand/daemon-small.svg';

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
    soporte: faHeadset,
    whatsapp: faWhatsapp,
    buscar: faMagnifyingGlass,
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

  /** Estado del quick switcher (Cmd/Ctrl + K). */
  switcherAbierto = false;
  switcherQuery = '';
  switcherIndex = 0;
  switcherInputRef: HTMLInputElement | null = null;

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

  // ===========================================================
  // Quick switcher (Cmd / Ctrl + K)
  // Overlay profesional de búsqueda sobre los items navegables.
  // ===========================================================

  /**
   * Aplana todos los items navegables (con `ruta`) del sidebar
   * y los etiqueta con la sección a la que pertenecen.
   * Se usa como dataset base del buscador.
   */
  get itemsNavegables(): Array<{ item: PortalSidebarItem; seccion: string }> {
    const resultado: Array<{ item: PortalSidebarItem; seccion: string }> = [];
    for (const seccion of this.secciones) {
      for (const item of seccion.items) {
        if (item.ruta) {
          resultado.push({ item, seccion: seccion.titulo });
        }
        if (item.hijos?.length) {
          for (const hijo of item.hijos) {
            if (hijo.ruta) {
              resultado.push({ item: hijo, seccion: seccion.titulo });
            }
          }
        }
      }
    }
    return resultado;
  }

  /**
   * Resultados del buscador: filtra por etiqueta, detalle o sección
   * (case-insensitive). Si no hay query, devuelve los primeros 8.
   */
  get resultadosBusqueda(): Array<{ item: PortalSidebarItem; seccion: string }> {
    const q = this.switcherQuery.trim().toLowerCase();
    const base = this.itemsNavegables;
    if (!q) {
      return base.slice(0, 8);
    }
    return base
      .filter(({ item, seccion }) =>
        item.etiqueta.toLowerCase().includes(q) ||
        (item.detalle ?? '').toLowerCase().includes(q) ||
        seccion.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }

  /**
   * Compone el texto del badge respetando el orden de prioridad:
   *  - Si hay `contadores[item.id]` y badge estático: "Hoy · 3"
   *  - Si solo hay contador: "3"
   *  - Si solo hay badge estático: "Hoy"
   *  - Si no hay nada: null (no se renderiza)
   */
  badgeDeItem(item: PortalSidebarItem): string | null {
    const contador = this.contadores?.[item.id];
    const estatico = item.badge;
    if (contador !== undefined && contador > 0 && estatico) {
      return `${estatico} · ${contador}`;
    }
    if (contador !== undefined && contador > 0) {
      return String(contador);
    }
    return estatico ?? null;
  }

  abrirSwitcher(): void {
    if (this.switcherAbierto) {
      return;
    }
    this.switcherAbierto = true;
    this.switcherQuery = '';
    this.switcherIndex = 0;
    // Enfocar el input después de que Angular renderice el overlay.
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('.sb-switcher-input');
      if (input) {
        input.focus();
        this.switcherInputRef = input;
      }
    }, 30);
  }

  cerrarSwitcher(): void {
    if (!this.switcherAbierto) {
      return;
    }
    this.switcherAbierto = false;
    this.switcherQuery = '';
    this.switcherIndex = 0;
  }

  seleccionarResultado(resultado: { item: PortalSidebarItem; seccion: string }): void {
    if (resultado.item.ruta) {
      this.router.navigateByUrl(resultado.item.ruta);
    }
    this.cerrarSwitcher();
    this.navegar();
  }

  onSwitcherKeydown(event: KeyboardEvent): void {
    const total = this.resultadosBusqueda.length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.switcherIndex = (this.switcherIndex + 1) % Math.max(total, 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.switcherIndex = (this.switcherIndex - 1 + total) % Math.max(total, 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const sel = this.resultadosBusqueda[this.switcherIndex];
      if (sel) {
        this.seleccionarResultado(sel);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cerrarSwitcher();
    }
  }

  /**
   * Listener global: Cmd+K (Mac) o Ctrl+K (Win/Linux) abre el switcher.
   * Si el switcher ya está abierto, lo cierra (toggle).
   * Ignora cuando hay un input/textarea enfocado para no romper formularios.
   */
  @HostListener('document:keydown', ['$event'])
  onKeydownGlobal(event: KeyboardEvent): void {
    const isToggle = (event.metaKey || event.ctrlKey) && (event.key === 'k' || event.key === 'K');
    if (!isToggle) {
      return;
    }
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    const isEditable = tag === 'input' || tag === 'textarea' || target?.isContentEditable;
    if (isEditable && !this.switcherAbierto) {
      return;
    }
    event.preventDefault();
    if (this.switcherAbierto) {
      this.cerrarSwitcher();
    } else {
      this.abrirSwitcher();
    }
  }
}
