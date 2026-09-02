import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCalendarAlt,
  faClock,
  faGraduationCap,
  faVideo,
  faArrowRight,
  faComments,
  faChevronDown,
  faChevronUp,
  faMagnifyingGlass,
  faDisplay,
  faBolt,
  faRotate,
  faBullseye,
} from '@fortawesome/free-solid-svg-icons';

interface ModuloSyllabus {
  semana: number;
  titulo: string;
  descripcion: string;
  items: string[];
}

interface PreguntaFaq {
  pregunta: string;
  respuesta: string;
}

@Component({
  selector: 'app-landing-matematica',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  templateUrl: './landing-matematica.html',
  styleUrl: './landing-matematica.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingMatematica {
  // Icons
  readonly icCalendar = faCalendarAlt;
  readonly icClock = faClock;
  readonly icCap = faGraduationCap;
  readonly icVideo = faVideo;
  readonly icArrow = faArrowRight;
  readonly icChat = faComments;
  readonly icDown = faChevronDown;
  readonly icUp = faChevronUp;
  readonly icSearch = faMagnifyingGlass;
  readonly icDisplay = faDisplay;
  readonly icBolt = faBolt;
  readonly icRotate = faRotate;
  readonly icBullseye = faBullseye;

  // Signals for interactive accordions
  readonly semanaAbierta = signal<number>(1);
  readonly faqAbierta = signal<number | null>(0);

  // Commercial Offer Lock
  readonly oferta = {
    nombre: 'Matemática DAEMON',
    subtitulo: 'Refuerzo + Retos',
    duracion: '6 semanas',
    precioTotal: 149,
    montoReserva: 20,
    whatsappNumero: '51987654321',
    whatsappMensaje: encodeURIComponent(
      '¡Hola Daemon! Deseo reservar mi cupo de S/ 20 para el programa Matemática DAEMON.'
    ),
  };

  // 6 Weeks Route Data (Exact Figma Node 145:3)
  readonly semanas: ModuloSyllabus[] = [
    {
      semana: 1,
      titulo: 'Reforzar una base clave + primera misión',
      descripcion:
        'Se empieza por una base prioritaria detectada en la evaluación inicial y se usa de inmediato en un reto para comprobar que el estudiante no solo recuerda un procedimiento, sino que sabe cuándo y cómo usarlo.',
      items: [
        'Refuerza el punto de partida que más necesita atención.',
        'Resuelve su primera misión y explica cómo llegó a la respuesta.',
        'Recibe orientación y vuelve a intentarlo si es necesario.',
      ],
    },
    {
      semana: 2,
      titulo: 'Practicar una estrategia y ganar seguridad',
      descripcion:
        'Entrena la estrategia aprendida en variaciones controladas para afianzar el razonamiento y reducir la inseguridad ante ejercicios distintos.',
      items: [
        'Resuelve problemas con menor ayuda del docente.',
        'Identifica qué datos son clave antes de operar.',
        'Explica el paso a paso de su solución.',
      ],
    },
    {
      semana: 3,
      titulo: 'Usar lo aprendido en un problema nuevo',
      descripcion:
        'Aplica el método en problemas con enunciados más complejos o contextos cotidianos donde debe elegir la herramienta correcta.',
      items: [
        'Formula su propia hipótesis de resolución.',
        'Detecta y corrige errores en procedimientos ajenos.',
        'Gana soltura en la justificación de resultados.',
      ],
    },
    {
      semana: 4,
      titulo: 'Combinar habilidades en un reto más completo',
      descripcion:
        'Integra múltiples conceptos para resolver desafíos que requieren más de un paso analítico.',
      items: [
        'Conecta temas previos con el nuevo desafío.',
        'Desarrolla persistencia ante problemas extensos.',
        'Recibe retroalimentación personalizada del docente.',
      ],
    },
    {
      semana: 5,
      titulo: 'Desafío acumulativo + refuerzo personalizado',
      descripcion:
        'Sesión de consolidación para cerrar dudas específicas detectadas durante las primeras 4 semanas.',
      items: [
        'Refuerza debilidades individuales en grupos guiados.',
        'Supera retos de velocidad y precisión controlada.',
        'Prepara el terreno para la misión final.',
      ],
    },
    {
      semana: 6,
      titulo: 'Misión final + comparación del avance',
      descripcion:
        'Demuestra el progreso frente a los desafíos iniciales y evalúa el cambio en confianza y razonamiento.',
      items: [
        'Resuelve la evaluación final comparativa.',
        'Explica su proyecto y razonamiento ante el docente.',
        'Obtiene su reporte de progreso y certificación.',
      ],
    },
  ];

  // 6 FAQ Items (Exact Figma Node 145:3)
  readonly faqs: PreguntaFaq[] = [
    {
      pregunta: '¿Es una tutoría para hacer tareas del colegio?',
      respuesta:
        'No. Es un programa de refuerzo y resolución de problemas con una ruta propia.',
    },
    {
      pregunta: '¿Necesita ser bueno en Matemática para empezar?',
      respuesta:
        'No. El programa está diseñado para estudiantes que necesitan recuperar base, entender el porqué de los procedimientos y ganar seguridad.',
    },
    {
      pregunta: '¿Todos trabajan exactamente los mismos temas?',
      respuesta:
        'El grupo sigue la misma ruta de 6 semanas, pero cada estudiante recibe retos y práctica ajustados a su nivel detectado en la evaluación inicial.',
    },
    {
      pregunta: '¿Qué pasa si se equivoca en un reto?',
      respuesta:
        'El error es parte del método. El docente orienta la corrección y el estudiante vuelve a intentarlo con una variación del problema.',
    },
    {
      pregunta: '¿Cómo funcionan los XP y los DAEMONS?',
      respuesta:
        'Los XP reconocen el esfuerzo y la práctica válida. Los DAEMONS acompañan la experiencia con recompensas e identidad, sin alterar la evaluación del aprendizaje.',
    },
    {
      pregunta: '¿Cómo comprobamos que realmente está progresando?',
      respuesta:
        'Se compara cómo resuelve al inicio y al final: estrategia, procedimiento, explicación y capacidad de corregir.',
    },
  ];

  toggleSemana(num: number): void {
    this.semanaAbierta.update((actual) => (actual === num ? 0 : num));
  }

  toggleFaq(index: number): void {
    this.faqAbierta.update((actual) => (actual === index ? null : index));
  }

  get enlaceWhatsapp(): string {
    return `https://wa.me/${this.oferta.whatsappNumero}?text=${this.oferta.whatsappMensaje}`;
  }
}
