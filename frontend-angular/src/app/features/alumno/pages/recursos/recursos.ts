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
    { titulo: 'Bot tutor', detalle: 'Chat personal conectado a tu bot de DAEMON.', ruta: '/alumno/chatbot' },
    { titulo: 'Cuentos', detalle: 'Tus historias y la galería de la comunidad.', ruta: '/alumno/cuentos' },
    { titulo: 'Laboratorio IA', detalle: 'Cerebro de mascota y estado del entrenamiento.', ruta: '/alumno/laboratorio' },
    { titulo: 'Evaluaciones', detalle: 'Exámenes activos y resultados enviados.', ruta: '/alumno/evaluaciones' },
    { titulo: 'Certificado', detalle: 'Carnet y constancia generada con tus datos.', ruta: '/alumno/certificado' },
  ];
}
