import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowRight,
  faBookOpen,
  faBrain,
  faComments,
  faGamepad,
  faRobot,
  faRoute,
  faShieldHalved,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import { Sesion } from '../../../../core/servicios/sesion';

type TonoHerramienta = 'coral' | 'azul' | 'verde' | 'morado' | 'ambar';

interface Herramienta {
  numero: string;
  titulo: string;
  detalle: string;
  estado: string;
  categoria: string;
  ruta: string;
  tono: TonoHerramienta;
  acciones: string[];
  llamada: string;
  icono: IconDefinition;
  destacada?: boolean;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-herramientas',
  imports: [RouterLink, FontAwesomeModule],
  templateUrl: './herramientas.html',
  styleUrl: './herramientas.scss',
})
export class Herramientas {
  private readonly sesion = inject(Sesion);

  readonly nivelActual = computed(() => this.sesion.usuario()?.nivel_gamificacion ?? 1);
  readonly iconos = {
    flecha: faArrowRight,
    laboratorio: faWandMagicSparkles,
    robot: faRobot,
  };

  readonly herramientas: Herramienta[] = [
    {
      numero: '01',
      titulo: 'Chatbot',
      detalle: 'Conversa con tu agente personal y continúa desde su memoria de aprendizaje.',
      estado: 'En vivo',
      categoria: 'Comando central',
      ruta: '/alumno/herramientas/chatbot',
      tono: 'coral',
      acciones: ['Chat inteligente', 'Memoria personal'],
      llamada: 'Conversar ahora',
      icono: faComments,
      destacada: true,
    },
    {
      numero: '02',
      titulo: 'Configurar bot',
      detalle: 'Construye la identidad, personalidad y apariencia de tu asistente.',
      estado: 'Editable',
      categoria: 'Génesis',
      ruta: '/alumno/herramientas/bot',
      tono: 'azul',
      acciones: ['Identidad', 'Avatar y cerebro'],
      llamada: 'Crear identidad',
      icono: faRobot,
    },
    {
      numero: '03',
      titulo: 'Neuro Maze',
      detalle: 'Observa cómo un agente aprende a recorrer un laberinto y mejora con cada intento.',
      estado: 'Interactivo',
      categoria: 'Simulación',
      ruta: '/alumno/herramientas/neuro-maze',
      tono: 'verde',
      acciones: ['Agente Q-learning', 'Laberinto jugable'],
      llamada: 'Abrir laberinto',
      icono: faRoute,
    },
    {
      numero: '04',
      titulo: 'Entrenamiento',
      detalle: 'Elige un motor y ejecuta rutinas para desarrollar las capacidades de tu bot.',
      estado: 'Laboratorio',
      categoria: 'Práctica',
      ruta: '/alumno/herramientas/entrenamiento',
      tono: 'morado',
      acciones: ['Selector de motores', 'Rutinas del agente'],
      llamada: 'Entrenar agente',
      icono: faGamepad,
    },
    {
      numero: '05',
      titulo: 'Cerebro IA',
      detalle: 'Inspecciona y guarda la matriz neural que conecta el aprendizaje con DAEMON.',
      estado: 'Avanzado',
      categoria: 'Núcleo IA',
      ruta: '/alumno/herramientas/laboratorio',
      tono: 'azul',
      acciones: ['Matriz neural', 'Guardado en backend'],
      llamada: 'Editar cerebro',
      icono: faBrain,
    },
    {
      numero: '06',
      titulo: 'Defensa IA',
      detalle: 'Experimenta con visión y modelos locales en un entorno de pruebas controlado.',
      estado: 'Experimental',
      categoria: 'Pruebas',
      ruta: '/alumno/herramientas/defensa-ia',
      tono: 'ambar',
      acciones: ['Visión local', 'Modelo de defensa'],
      llamada: 'Abrir defensa',
      icono: faShieldHalved,
    },
    {
      numero: '07',
      titulo: 'Cuentos',
      detalle: 'Convierte tus ideas en historias y compártelas con la comunidad creativa.',
      estado: 'Creativo',
      categoria: 'Proyecto',
      ruta: '/alumno/proyectos/cuentos',
      tono: 'coral',
      acciones: ['Editor de historias', 'Galería comunitaria'],
      llamada: 'Crear historia',
      icono: faBookOpen,
    },
  ];
}
