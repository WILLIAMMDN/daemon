import { Component, signal, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Activos } from '../../../../core/servicios/activos';
import { Api } from '../../../../core/servicios/api';
import { ImageFallbackDirective } from '../../../../shared/directivas/image-fallback.directive';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { finalize, map, of, switchMap } from 'rxjs';
import 'deep-chat';

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

interface DeepChatRequestBody {
  messages?: Array<{ text?: string }>;
}

interface DeepChatSignals {
  onResponse: (respuesta: { text?: string; error?: string }) => void;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-chatbot-alumno',
  imports: [RouterLink, ImageFallbackDirective, Cargando, EstadoVacio],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './chatbot-alumno.html',
  styleUrl: './chatbot-alumno.scss',
})
export class ChatbotAlumno {
  bot = signal<BotAlumno | null | undefined>(undefined);
  cargando = signal(true);
  limpiando = signal(false);
  error = signal('');
  mensajesFormateados = signal<any[]>([]);

  // Binder para el handler de Deep Chat
  requestHandler = this.procesarMensaje.bind(this);
  requestConfig = { handler: this.requestHandler };

  speechConfig = {
    webSpeech: { language: 'es-ES' }
  };


  messageStyles = {
    default: {
      shared: {
        innerContainer: { borderRadius: '1rem', padding: '1rem', fontSize: '1rem', lineHeight: '1.5' }
      },
      user: {
        bubble: { backgroundColor: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe' }
      },
      ai: {
        bubble: { backgroundColor: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0' }
      }
    }
  };

  constructor(private api: Api, private activos: Activos) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.api.get<BotAlumno | null>('/chatbot/bot').pipe(
      switchMap((bot) => bot
        ? this.api.get<MensajeChat[]>('/chatbot/mensajes').pipe(map((mensajes) => ({ bot, mensajes })))
        : of({ bot: null, mensajes: [] as MensajeChat[] })),
      finalize(() => this.cargando.set(false)),
    ).subscribe({
      next: ({ bot, mensajes }) => {
        this.bot.set(bot);
        this.mensajesFormateados.set(mensajes.map((mensaje) => ({
          role: mensaje.role === 'user' ? 'user' : 'ai',
          text: mensaje.content,
        })));
      },
      error: (error) => {
        this.error.set(error.error?.message ?? 'No pudimos cargar el bot y su conversación.');
      },
    });
  }

  procesarMensaje(body: DeepChatRequestBody, signals: DeepChatSignals): void {
    const content = body.messages?.at(-1)?.text?.trim();

    if (!content) {
      signals.onResponse({ error: 'Escribe un mensaje antes de enviarlo.' });
      return;
    }

    this.api.post<MensajeChat>('/chatbot/mensajes', { content }).subscribe({
      next: (mensaje) => {
        signals.onResponse({ text: mensaje.content });
      },
      error: (e) => {
        signals.onResponse({ error: e.error?.message ?? 'El bot no pudo responder.' });
      }
    });
  }

  limpiar(): void {
    if (this.limpiando() || !this.mensajesFormateados().length) {
      return;
    }

    this.limpiando.set(true);
    this.error.set('');
    this.api.delete('/chatbot/mensajes').pipe(finalize(() => this.limpiando.set(false))).subscribe({
      next: () => this.mensajesFormateados.set([]),
      error: (error) => this.error.set(error.error?.message ?? 'No se pudo limpiar la conversación.'),
    });
  }

  botAvatar(): string {
    return this.activos.url(this.bot()?.avatar || 'img/bot_default.svg');
  }
}
