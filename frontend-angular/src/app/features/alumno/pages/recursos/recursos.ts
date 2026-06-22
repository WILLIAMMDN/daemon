import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-recursos',
  imports: [RouterLink],
  templateUrl: './recursos.html',
  styleUrl: './recursos.scss',
})
export class Recursos {
  recursos = [
    { titulo: 'Herramientas', detalle: 'Chatbot, laboratorio y juegos desde un solo lugar.', ruta: '/alumno/herramientas' },
    { titulo: 'Cuentos', detalle: 'Tus historias y la galería de la comunidad.', ruta: '/alumno/cuentos' },
    { titulo: 'Evaluaciones', detalle: 'Exámenes activos y resultados enviados.', ruta: '/alumno/evaluaciones' },
    { titulo: 'Certificado', detalle: 'Carnet y constancia generada con tus datos.', ruta: '/alumno/certificado' },
  ];
}
