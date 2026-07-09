import { Injectable, inject } from '@angular/core';
import { driver, DriveStep } from 'driver.js';
import { Api } from './api';
import { Sesion } from './sesion';

type TipoTour = 'alumno' | 'docente';

@Injectable({
  providedIn: 'root',
})
export class TourService {
  private readonly api = inject(Api);
  private readonly sesion = inject(Sesion);
  private tourActivo = false;
  private guardandoCompletado = false;

  public iniciarTourAlumno(): void {
    if (!this.debeMostrarTour('alumno')) {
      return;
    }

    this.tourActivo = true;

    const steps: DriveStep[] = [
      {
        element: '#sidebar-perfil',
        popover: {
          title: 'Tu Perfil',
          description: 'Aqui puedes ver tu rango, nivel y personalizar tu avatar o fondo.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '#sidebar-alumno-misiones',
        popover: {
          title: 'Misiones Activas',
          description: 'Aca encontraras las tareas que tu docente ha asignado. Completalas para ganar recompensas.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '#sidebar-alumno-recompensas',
        popover: {
          title: 'Tu Mochila',
          description: 'Todo lo que compres en la tienda o las insignias que ganes se guardaran aqui.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '#topbar-tokens',
        popover: {
          title: 'Tokens DAEMON',
          description: 'Esta es tu moneda virtual. Ganas tokens completando misiones y asistiendo a clases.',
          side: 'bottom',
          align: 'end',
        },
      },
    ];

    this.iniciarDriver(steps, 'alumno', 'Terminar');
  }

  public iniciarTourDocente(): void {
    if (!this.debeMostrarTour('docente')) {
      return;
    }

    this.tourActivo = true;

    const steps: DriveStep[] = [
      {
        element: '#sidebar-docente-alumnos',
        popover: {
          title: 'Gestion de Alumnos',
          description: 'Aqui puedes ver el listado de tus alumnos, gestionar sus cuentas y asignar o retirar tokens manualmente.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '#sidebar-docente-misiones',
        popover: {
          title: 'Centro de Misiones',
          description: 'Crea desafios para tus estudiantes y califica sus entregas para otorgarles experiencia y tokens.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '#sidebar-docente-tienda',
        popover: {
          title: 'Tienda de Recompensas',
          description: 'Crea premios personalizados y marca como entregados los canjes que hagan tus alumnos.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '#sidebar-docente-competencia',
        popover: {
          title: 'Competencias en Vivo',
          description: 'Abre la pantalla de TV y gestiona rondas de competencia en tiempo real en el proyector de tu clase.',
          side: 'right',
          align: 'start',
        },
      },
    ];

    this.iniciarDriver(steps, 'docente', 'Entendido');
  }

  private iniciarDriver(steps: DriveStep[], tipo: TipoTour, doneBtnText: string): void {
    setTimeout(() => {
      const pasos = this.pasosDisponibles(steps);

      if (pasos.length === 0) {
        this.tourActivo = false;
        return;
      }

      const driverObj = driver({
        showProgress: true,
        stagePadding: 6,
        stageRadius: 16,
        nextBtnText: 'Siguiente &rarr;',
        prevBtnText: '&larr; Anterior',
        doneBtnText,
        progressText: '{{current}} de {{total}}',
        onDestroyStarted: () => {
          this.marcarComoCompletado(tipo);
          driverObj.destroy();
        },
        onDestroyed: () => {
          this.tourActivo = false;
        },
      });

      driverObj.setSteps(pasos);
      driverObj.drive();
    }, 500);
  }

  private debeMostrarTour(tipo: TipoTour): boolean {
    const usuario = this.sesion.usuario();

    if (!usuario || usuario.tour_completado || this.tourActivo || this.tourCompletadoLocalmente(tipo)) {
      return false;
    }

    const fechaImplementacionTour = new Date('2026-07-08T00:00:00Z');
    const fechaRegistro = usuario.fecha_registro ? new Date(usuario.fecha_registro) : new Date();

    return fechaRegistro >= fechaImplementacionTour;
  }

  private pasosDisponibles(steps: DriveStep[]): DriveStep[] {
    return steps.filter((step) => {
      if (typeof step.element !== 'string') {
        return true;
      }

      return this.elementoResaltable(document.querySelector(step.element));
    });
  }

  private elementoResaltable(elemento: Element | null): elemento is HTMLElement {
    if (!(elemento instanceof HTMLElement)) {
      return false;
    }

    const rect = elemento.getBoundingClientRect();
    const estilo = window.getComputedStyle(elemento);

    return rect.width > 0
      && rect.height > 0
      && estilo.display !== 'none'
      && estilo.visibility !== 'hidden';
  }

  private marcarComoCompletado(tipo: TipoTour): void {
    const usuarioActual = this.sesion.usuario();

    if (!usuarioActual || usuarioActual.tour_completado || this.guardandoCompletado) {
      return;
    }

    this.guardandoCompletado = true;
    this.marcarComoCompletadoLocalmente(tipo);
    this.sesion.actualizarUsuario({ ...usuarioActual, tour_completado: true });

    this.api.post('/auth/me/tour', {}).subscribe({
      complete: () => {
        this.guardandoCompletado = false;
      },
      error: (err) => {
        this.guardandoCompletado = false;
        console.error('Error al marcar tour como completado', err);
      },
    });
  }

  private tourCompletadoLocalmente(tipo: TipoTour): boolean {
    return localStorage.getItem(this.claveTourLocal(tipo)) === 'true';
  }

  private marcarComoCompletadoLocalmente(tipo: TipoTour): void {
    localStorage.setItem(this.claveTourLocal(tipo), 'true');
  }

  private claveTourLocal(tipo: TipoTour): string {
    const usuario = this.sesion.usuario();

    return `daemon_tour_${tipo}_${usuario?.id ?? 'anon'}_completado`;
  }
}
