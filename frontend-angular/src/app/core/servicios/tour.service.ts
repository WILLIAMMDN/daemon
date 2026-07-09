import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Sesion } from './sesion';
import { driver, DriveStep } from 'driver.js';

@Injectable({
  providedIn: 'root'
})
export class TourService {
  private readonly http = inject(HttpClient);
  private readonly sesion = inject(Sesion);
  private readonly apiUrl = environment.apiUrl;

  public iniciarTourAlumno(): void {
    const usuario = this.sesion.usuario();
    
    // Si ya lo completó o no hay usuario, abortar
    if (!usuario || usuario.tour_completado) {
      return;
    }

    // No mostrar el tour a cuentas antiguas creadas antes de la implementación
    const fechaImplementacionTour = new Date('2026-07-08T00:00:00Z');
    const fechaRegistro = usuario.fecha_registro ? new Date(usuario.fecha_registro) : new Date();
    if (fechaRegistro < fechaImplementacionTour) {
      return;
    }

    const steps: DriveStep[] = [
      {
        element: '#sidebar-perfil',
        popover: {
          title: 'Tu Perfil',
          description: 'Aquí puedes ver tu rango, nivel y personalizar tu avatar o fondo.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#sidebar-misiones',
        popover: {
          title: 'Misiones Activas',
          description: 'Acá encontrarás las tareas que tu docente ha asignado. ¡Complétalas para ganar recompensas!',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#sidebar-mochila',
        popover: {
          title: 'Tu Mochila',
          description: 'Todo lo que compres en la tienda o las insignias que ganes se guardarán aquí.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#topbar-tokens',
        popover: {
          title: 'Tokens DAEMON',
          description: 'Esta es tu moneda virtual. Ganas tokens completando misiones y asistiendo a clases.',
          side: 'bottom',
          align: 'end'
        }
      }
    ];

    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Siguiente &rarr;',
      prevBtnText: '&larr; Anterior',
      doneBtnText: 'Terminar',
      progressText: '{{current}} de {{total}}',
      onDestroyStarted: () => {
        // Cuando el usuario cierra o termina el tour
        this.marcarComoCompletado();
        driverObj.destroy();
      }
    });

    driverObj.setSteps(steps);
    
    // Esperar un poco para que el DOM esté completamente renderizado
    setTimeout(() => {
      driverObj.drive();
    }, 500);
  }

  public iniciarTourDocente(): void {
    const usuario = this.sesion.usuario();
    
    if (!usuario || usuario.tour_completado) {
      return;
    }

    // No mostrar el tour a cuentas antiguas creadas antes de la implementación
    const fechaImplementacionTour = new Date('2026-07-08T00:00:00Z');
    const fechaRegistro = usuario.fecha_registro ? new Date(usuario.fecha_registro) : new Date();
    if (fechaRegistro < fechaImplementacionTour) {
      return;
    }

    const steps: DriveStep[] = [
      {
        element: '#sidebar-docente-alumnos',
        popover: {
          title: 'Gestión de Alumnos',
          description: 'Aquí puedes ver el listado de tus alumnos, gestionar sus cuentas y asignar o retirar tokens manualmente.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#sidebar-docente-misiones',
        popover: {
          title: 'Centro de Misiones',
          description: 'Crea desafíos para tus estudiantes y califica sus entregas para otorgarles experiencia y tokens.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#sidebar-docente-tienda',
        popover: {
          title: 'Tienda de Recompensas',
          description: 'Crea premios personalizados y marca como entregados los canjes que hagan tus alumnos.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#sidebar-docente-competencia',
        popover: {
          title: 'Competencias en Vivo',
          description: 'Abre la pantalla de TV y gestiona rondas de competencia en tiempo real en el proyector de tu clase.',
          side: 'right',
          align: 'start'
        }
      }
    ];

    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Siguiente &rarr;',
      prevBtnText: '&larr; Anterior',
      doneBtnText: '¡Entendido!',
      progressText: '{{current}} de {{total}}',
      onDestroyStarted: () => {
        this.marcarComoCompletado();
        driverObj.destroy();
      }
    });

    driverObj.setSteps(steps);
    
    setTimeout(() => {
      driverObj.drive();
    }, 500);
  }

  private marcarComoCompletado(): void {
    this.http.post(`${this.apiUrl}/auth/me/tour`, {}).subscribe({
      next: () => {
        const usuarioActual = this.sesion.usuario();
        if (usuarioActual) {
          this.sesion.actualizarUsuario({ ...usuarioActual, tour_completado: true });
        }
      },
      error: (err) => console.error('Error al marcar tour como completado', err)
    });
  }
}
