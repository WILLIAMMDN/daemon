import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { Autenticacion } from '../../servicios/autenticacion';
import { FirestoreApp } from '../../servicios/firestore-app';
import { Sesion } from '../../servicios/sesion';

interface EnlaceAula {
  readonly etiqueta: string;
  readonly ruta: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-layout-aula',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NzAvatarModule,
    NzBadgeModule,
    NzBreadCrumbModule,
    NzButtonModule,
    NzLayoutModule,
    NzMenuModule,
  ],
  templateUrl: './layout-aula.html',
  styleUrl: './layout-aula.scss',
})
export class LayoutAula {
  readonly sesion = inject(Sesion);
  readonly sidebarColapsada = signal(false);
  readonly firestoreDisponible = inject(FirestoreApp).disponible();
  readonly enlaces: readonly EnlaceAula[] = [
    { etiqueta: 'Inicio', ruta: '/aula/inicio' },
    { etiqueta: 'Cursos', ruta: '/aula/cursos' },
    { etiqueta: 'Misiones', ruta: '/aula/misiones' },
    { etiqueta: 'Entregas', ruta: '/aula/entregas' },
    { etiqueta: 'Perfil', ruta: '/aula/perfil' },
  ];

  private readonly autenticacion = inject(Autenticacion);
  private readonly router = inject(Router);

  alternarSidebar(): void {
    this.sidebarColapsada.update((colapsada) => !colapsada);
  }

  iniciales(): string {
    const usuario = this.sesion.usuario();
    const nombre = usuario?.nombre_completo || usuario?.usuario || usuario?.email || 'DAEMON';

    return nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join('') || 'D';
  }

  nombreUsuario(): string {
    const usuario = this.sesion.usuario();
    return usuario?.nombre_completo || usuario?.usuario || usuario?.email || 'Usuario DAEMON';
  }

  rolUsuario(): string {
    const rol = this.sesion.usuario()?.rol;
    const etiquetas = {
      admin: 'Administrador',
      alumno: 'Estudiante',
      docente: 'Docente',
      tutor: 'Tutor',
    } as const;

    return rol ? etiquetas[rol] : 'Sin rol';
  }

  salir(): void {
    this.autenticacion.logout().subscribe({
      next: () => {
        void this.router.navigateByUrl('/login');
      },
      error: () => {
        this.sesion.limpiar();
        void this.router.navigateByUrl('/login');
      },
    });
  }
}
