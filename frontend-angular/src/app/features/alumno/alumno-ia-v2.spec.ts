import { alumnoSidebarSections, docenteSidebarSections } from '../../core/layouts/portal-sidebar.config';
import { alumnoRoutes } from './alumno.routes';
import { aprenderRoutes } from './aprender/aprender.routes';
import { arenaRoutes } from './arena/arena.routes';
import { agendaRoutes } from './agenda/agenda.routes';
import { identidadRoutes } from './identidad/identidad.routes';
import { Arena } from './arena/pages/arena/arena';
import { Aprender } from './aprender/pages/aprender/aprender';
import { Agenda } from './agenda/pages/agenda/agenda';
import { TourService } from '../../core/servicios/tour.service';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

describe('DAEMON ARC — Student IA V2 Architecture', () => {
  describe('Canonical Sidebar Navigation (5 Direct Level-1 Destinations)', () => {
    it('should define exactly 1 section with 5 direct Level-1 items and NO accordions/children', () => {
      expect(alumnoSidebarSections.length).toBe(1);
      const items = alumnoSidebarSections[0].items;
      expect(items.length).toBe(5);

      const expected = [
        { id: 'alumno-panel', etiqueta: 'Inicio', ruta: '/alumno' },
        { id: 'alumno-aprender', etiqueta: 'Aprender', ruta: '/alumno/aprender' },
        { id: 'alumno-arena', etiqueta: 'Arena', ruta: '/alumno/arena' },
        { id: 'alumno-agenda', etiqueta: 'Agenda', ruta: '/alumno/agenda' },
        { id: 'alumno-identidad', etiqueta: 'Identidad', ruta: '/alumno/identidad' },
      ];

      for (let i = 0; i < expected.length; i++) {
        expect(items[i].id).toBe(expected[i].id);
        expect(items[i].etiqueta).toBe(expected[i].etiqueta);
        expect(items[i].ruta).toBe(expected[i].ruta);
        expect(items[i].hijos).toBeUndefined();
      }
    });

    it('should preserve docente sidebar configuration untouched', () => {
      expect(docenteSidebarSections.length).toBeGreaterThan(0);
      expect(docenteSidebarSections.some((s) => s.items.some((it) => it.ruta?.includes('/docente')))).toBe(true);
    });
  });

  describe('Student Area Routing & Lazy Boundaries', () => {
    it('should configure lazy boundaries for the 5 canonical areas', () => {
      const paths = alumnoRoutes.map((r) => r.path);
      expect(paths).toContain('');
      expect(paths).toContain('aprender');
      expect(paths).toContain('arena');
      expect(paths).toContain('agenda');
      expect(paths).toContain('identidad');
      expect(paths).toContain('notificaciones');

      // Obsolete areas removed from student routing
      expect(paths).not.toContain('crear');
      expect(paths).not.toContain('comunidad');
      expect(paths).not.toContain('cuentos');
      expect(paths).not.toContain('herramientas');
      expect(paths).not.toContain('laboratorio');
      expect(paths).not.toContain('chatbot');
    });

    it('should maintain minimal documented aliases for direct URLs', () => {
      const perfilRoute = alumnoRoutes.find((r) => r.path === 'perfil');
      expect(perfilRoute).toBeDefined();
      expect(perfilRoute?.redirectTo).toBe('identidad/perfil');

      const tiendaRoute = alumnoRoutes.find((r) => r.path === 'tienda');
      expect(tiendaRoute).toBeDefined();
      expect(tiendaRoute?.redirectTo).toBe('identidad/daems');
    });
  });

  describe('Aprender Area Architecture', () => {
    it('should configure canonical Aprender routes and contextual course space', () => {
      const paths = aprenderRoutes.map((r) => r.path);
      expect(paths).toContain('');
      expect(paths).toContain('curso/:cursoId');
      expect(paths).toContain('curso/:cursoId/ruta');
      expect(paths).toContain('curso/:cursoId/contenido');
      expect(paths).toContain('curso/:cursoId/experiencia/:experienceId');
      expect(paths).toContain('curso/:cursoId/progreso');

      // Standalone global routes removed
      expect(paths).not.toContain('misiones');
      expect(paths).not.toContain('evaluaciones');
      expect(paths).not.toContain('rutas');
    });

    it('should have local nav items for Mis cursos and Explorar', () => {
      TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
      });
      const component = TestBed.createComponent(Aprender).componentInstance;
      expect(component.items).toEqual([
        { etiqueta: 'Mis cursos', ruta: 'mis-cursos' },
        { etiqueta: 'Explorar', ruta: 'explorar' },
      ]);
    });
  });

  describe('Arena Product Shell Architecture', () => {
    it('should configure ONLY canonical /alumno/arena route without premature children', () => {
      const paths = arenaRoutes.map((r) => r.path);
      expect(paths).toEqual(['']);
    });

    it('should render Arena shell with neutral label', () => {
      const arena = new Arena();
      expect(arena.items).toEqual([{ etiqueta: 'Arena', ruta: '/alumno/arena' }]);
    });
  });

  describe('Agenda Area Architecture', () => {
    it('should configure Hoy, Sesiones, and Entregas routes without separate proximamente module', () => {
      const root = agendaRoutes[0];
      const childPaths = root.children?.map((r) => r.path) ?? [];
      expect(childPaths).toContain('hoy');
      expect(childPaths).toContain('sesiones');
      expect(childPaths).toContain('entregas');
      expect(childPaths).not.toContain('proximamente');
    });
  });

  describe('Identidad Area Architecture', () => {
    it('should configure canonical Identidad routes with default to perfil and without resumen or certificates', () => {
      const paths = identidadRoutes.map((r) => r.path);
      expect(paths).toContain('perfil/editar');
      expect(paths).toContain('daems/canjes');
      expect(paths).toContain('');

      expect(paths).not.toContain('resumen');
      expect(paths).not.toContain('certificado');
      expect(paths).not.toContain('certificado/imprimir');

      const root = identidadRoutes.find((r) => r.path === '');
      expect(root?.children?.[0]?.redirectTo).toBe('perfil');

      const childPaths = root?.children?.map((r) => r.path) ?? [];
      expect(childPaths).toContain('perfil');
      expect(childPaths).toContain('progreso');
      expect(childPaths).toContain('personalizacion');
      expect(childPaths).toContain('daems');
      expect(childPaths).not.toContain('resumen');
    });
  });
});
