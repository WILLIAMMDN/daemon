import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-defensa-ia',
  imports: [RouterLink],
  templateUrl: './defensa-ia.html',
  styleUrl: './defensa-ia.scss',
})
export class DefensaIa {
  readonly archivos = [
    { nombre: 'logica_ia.js', tipo: 'Logica principal', ruta: '/legacy/js/logica_ia.js' },
    { nombre: 'estilo_defense.css', tipo: 'Estilos heredados', ruta: '/legacy/css/estilo_defense.css' },
    { nombre: 'ml5.min.js', tipo: 'Modelo local', ruta: '/legacy/js/ml5.min.js' },
  ];

  readonly enlaces = [
    { etiqueta: 'Cerebro del bot', ruta: '/alumno/herramientas/laboratorio' },
    { etiqueta: 'Entrenamiento', ruta: '/alumno/herramientas/entrenamiento' },
    { etiqueta: 'Neuro Maze', ruta: '/alumno/herramientas/neuro-maze' },
  ];
}
