import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Activos } from '../../../../core/servicios/activos';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  constructor(private api: Api, private activos: Activos) {
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
    return this.asset(this.bot()?.avatar || 'img/bot_default.svg');
  }

  asset(ruta?: string | null): string {
    return this.activos.url(ruta);
  }
}
