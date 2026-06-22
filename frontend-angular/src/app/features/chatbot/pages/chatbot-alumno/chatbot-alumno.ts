import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { Api } from '../../../../core/servicios/api';

interface BotAlumno {
  nombre_bot?: string | null;
  system_prompt?: string | null;
  conocimiento?: string | null;
  avatar?: string | null;
}

interface MensajeChat {
  role: 'user' | 'assistant' | string;
  content: string;
}

@Component({
  selector: 'app-chatbot-alumno',
  imports: [FormsModule, RouterLink],
  templateUrl: './chatbot-alumno.html',
  styleUrl: './chatbot-alumno.scss',
})
export class ChatbotAlumno {
  mensajes = signal<MensajeChat[]>([]);
  bot = signal<BotAlumno | null>(null);
  texto = '';
  enviando = signal(false);
  error = signal('');
  private readonly assetBaseUrl = environment.apiUrl.replace(/\/api\/v1\/?$/, '');

  constructor(private api: Api) {
    this.cargar();
  }

  cargar(): void {
    this.api.get<BotAlumno | null>('/chatbot/bot').subscribe((bot) => this.bot.set(bot));
    this.api.get<MensajeChat[]>('/chatbot/mensajes').subscribe((mensajes) => this.mensajes.set(mensajes));
  }

  enviar(): void {
    const content = this.texto.trim();
    if (!content || this.enviando() || !this.bot()) return;

    this.mensajes.update((lista) => [...lista, { role: 'user', content }]);
    this.texto = '';
    this.enviando.set(true);
    this.error.set('');

    this.api.post<MensajeChat>('/chatbot/mensajes', { content }).subscribe({
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

  botAvatar(): string {
    return this.asset(this.bot()?.avatar || 'img/bot_default.png');
  }

  asset(ruta?: string | null): string {
    const limpia = ruta?.trim();
    if (!limpia) return '';
    if (/^(https?:|data:)/i.test(limpia)) return limpia;
    if (limpia === 'img/bot_default.png') return '/img/bot_default.svg';

    const path = limpia.startsWith('/') ? limpia : `/${limpia}`;
    if (/^\/?(uploads|img|legacy)\//i.test(limpia)) return path;
    if (/^\/?storage\//i.test(limpia)) return `${this.assetBaseUrl}${path}`;

    return `${this.assetBaseUrl}/storage${path}`;
  }
}
