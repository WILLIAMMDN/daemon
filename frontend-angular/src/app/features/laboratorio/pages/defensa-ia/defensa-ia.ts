import { Component , ChangeDetectionStrategy} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-defensa-ia',
  imports: [CommonModule, RouterLink, NzTagModule],
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
