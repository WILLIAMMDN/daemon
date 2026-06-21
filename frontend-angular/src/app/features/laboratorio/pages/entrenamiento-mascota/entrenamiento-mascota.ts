import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-entrenamiento-mascota',
  imports: [RouterLink],
  templateUrl: './entrenamiento-mascota.html',
  styleUrl: './entrenamiento-mascota.scss',
})
export class EntrenamientoMascota {
  motores = [
    { titulo: 'Cerebro guardado', ruta: '/alumno/laboratorio' },
    { titulo: 'Neuro Maze', ruta: '/alumno/laboratorio/neuro-maze' },
    { titulo: 'Defensa IA', ruta: '/alumno/laboratorio/defensa-ia' },
  ];
}
