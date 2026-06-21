import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../../../../core/servicios/api';

@Component({
  selector: 'app-chatbot-alumno',
  imports: [FormsModule, RouterLink],
  templateUrl: './chatbot-alumno.html',
  styleUrl: './chatbot-alumno.scss',
})
export class ChatbotAlumno {
  mensajes = signal<any[]>([]);
  bot = signal<any>(null);
  texto = '';
  enviando = signal(false);
  error = signal('');

  constructor(private api: Api) {
    this.cargar();
  }

  cargar(): void {
    this.api.get<any>('/chatbot/bot').subscribe((bot) => this.bot.set(bot));
    this.api.get<any[]>('/chatbot/mensajes').subscribe((mensajes) => this.mensajes.set(mensajes));
  }

  enviar(): void {
    const content = this.texto.trim();
    if (!content || this.enviando() || !this.bot()) return;

    this.mensajes.update((lista) => [...lista, { role: 'user', content }]);
    this.texto = '';
    this.enviando.set(true);
    this.error.set('');

    this.api.post<any>('/chatbot/mensajes', { content }).subscribe({
      next: (mensaje) => {
        this.mensajes.update((lista) => [...lista, mensaje]);
        this.enviando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'El bot no pudo responder.');
        this.enviando.set(false);
      },
    });
  }

  limpiar(): void {
    this.api.delete('/chatbot/mensajes').subscribe(() => this.mensajes.set([]));
  }
}
