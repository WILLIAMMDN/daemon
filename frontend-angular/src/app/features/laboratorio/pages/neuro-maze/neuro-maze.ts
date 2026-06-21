import { Component } from '@angular/core';

@Component({
  selector: 'app-neuro-maze',
  imports: [],
  templateUrl: './neuro-maze.html',
  styleUrl: './neuro-maze.scss',
})
export class NeuroMaze {
  archivos = [
    { nombre: 'maze_engine.js', ruta: '/legacy/js/maze_engine.js' },
    { nombre: 'rl_agent.js', ruta: '/legacy/js/rl_agent.js' },
    { nombre: 'neuro_maze.css', ruta: '/legacy/css/neuro_maze.css' },
  ];
}
