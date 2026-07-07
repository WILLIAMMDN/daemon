import { Component , ChangeDetectionStrategy} from '@angular/core';
import { RouterLink } from '@angular/router';

interface Herramienta {
  titulo: string;
  detalle: string;
  estado: string;
  ruta: string;
  tono: 'coral' | 'azul' | 'verde' | 'morado';
  acciones: string[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-herramientas',
  imports: [RouterLink],
  templateUrl: './herramientas.html',
  styleUrl: './herramientas.scss',
})
export class Herramientas {
  readonly herramientas: Herramienta[] = [
    {
      titulo: 'Chatbot',
      detalle: 'Conversación con tu bot personal y memoria de mensajes.',
      estado: 'Conectado',
      ruta: '/alumno/herramientas/chatbot',
      tono: 'coral',
      acciones: ['Chat', 'Memoria'],
    },
    {
      titulo: 'Configurar bot',
      detalle: 'Nombre, personalidad, avatar y datos expertos del asistente.',
      estado: 'Editable',
      ruta: '/alumno/herramientas/bot',
      tono: 'azul',
      acciones: ['Avatar', 'Cerebro'],
    },
    {
      titulo: 'Neuro Maze',
      detalle: 'Laberinto y agente de aprendizaje heredado del laboratorio.',
      estado: 'Motor legacy',
      ruta: '/alumno/herramientas/neuro-maze',
      tono: 'verde',
      acciones: ['Juego', 'IA'],
    },
    {
      titulo: 'Entrenamiento',
      detalle: 'Selector de motores, cerebro guardado y ejercicios del bot.',
      estado: 'Laboratorio',
      ruta: '/alumno/herramientas/entrenamiento',
      tono: 'morado',
      acciones: ['Nivel', 'Motores'],
    },
    {
      titulo: 'Cerebro IA',
      detalle: 'Matriz neural conectada al backend del chatbot.',
      estado: 'Avanzado',
      ruta: '/alumno/herramientas/laboratorio',
      tono: 'azul',
      acciones: ['JSON', 'Guardar'],
    },
    {
      titulo: 'Defensa IA',
      detalle: 'Módulo heredado para visión, modelo local y experimentos.',
      estado: 'Motor legacy',
      ruta: '/alumno/herramientas/defensa-ia',
      tono: 'verde',
      acciones: ['Visión', 'Modelo'],
    },
    {
      titulo: 'Cuentos',
      detalle: 'Galería y creación de historias de la comunidad.',
      estado: 'Creativo',
      ruta: '/alumno/cuentos',
      tono: 'coral',
      acciones: ['Crear', 'Galería'],
    },
  ];
}
