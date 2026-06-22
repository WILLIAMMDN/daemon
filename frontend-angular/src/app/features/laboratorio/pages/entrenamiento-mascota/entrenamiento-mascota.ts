import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-entrenamiento-mascota',
  imports: [RouterLink],
  templateUrl: './entrenamiento-mascota.html',
  styleUrl: './entrenamiento-mascota.scss',
})
export class EntrenamientoMascota {
  readonly motores = [
    {
      titulo: 'Cerebro guardado',
      detalle: 'Matriz neural conectada al backend del chatbot.',
      estado: 'Conectado',
      ruta: '/alumno/herramientas/laboratorio',
    },
    {
      titulo: 'Neuro Maze',
      detalle: 'Motor heredado del laberinto y agente de aprendizaje.',
      estado: 'Motor heredado',
      ruta: '/alumno/herramientas/neuro-maze',
    },
    {
      titulo: 'Defensa IA',
      detalle: 'Assets heredados para visión/modelo local.',
      estado: 'Motor heredado',
      ruta: '/alumno/herramientas/defensa-ia',
    },
  ];
}
