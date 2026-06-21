import { Component } from '@angular/core';

@Component({
  selector: 'app-defensa-ia',
  imports: [],
  templateUrl: './defensa-ia.html',
  styleUrl: './defensa-ia.scss',
})
export class DefensaIa {
  archivos = [
    { nombre: 'logica_ia.js', ruta: '/legacy/js/logica_ia.js' },
    { nombre: 'estilo_defense.css', ruta: '/legacy/css/estilo_defense.css' },
    { nombre: 'ml5.min.js', ruta: '/legacy/js/ml5.min.js' },
  ];
}
