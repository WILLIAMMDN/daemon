import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-neuro-maze',
  imports: [RouterLink],
  templateUrl: './neuro-maze.html',
  styleUrl: './neuro-maze.scss',
})
export class NeuroMaze {
  readonly archivos = [
    { nombre: 'maze_engine.js', tipo: 'Motor principal', ruta: '/legacy/js/maze_engine.js' },
    { nombre: 'rl_agent.js', tipo: 'Agente de aprendizaje', ruta: '/legacy/js/rl_agent.js' },
    { nombre: 'neuro_maze.css', tipo: 'Estilos heredados', ruta: '/legacy/css/neuro_maze.css' },
  ];

  readonly enlaces = [
    { etiqueta: 'Cerebro del bot', ruta: '/alumno/herramientas/laboratorio' },
    { etiqueta: 'Entrenamiento', ruta: '/alumno/herramientas/entrenamiento' },
    { etiqueta: 'Defensa IA', ruta: '/alumno/herramientas/defensa-ia' },
  ];
}
