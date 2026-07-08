import { Component, signal, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Activos } from '../../../../core/servicios/activos';
import { Api } from '../../../../core/servicios/api';
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

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-chatbot-alumno',
  imports: [RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './chatbot-alumno.html',
  styleUrl: './chatbot-alumno.scss',
})
export class ChatbotAlumno {
  bot = signal<BotAlumno | null>(null);
  error = signal('');
  mensajesFormateados = signal<any[]>([]);

  // Binder para el handler de Deep Chat
  requestHandler = this.procesarMensaje.bind(this);
  requestConfig = { handler: this.requestHandler };

  // Estilos de la burbuja (basados en la UI anterior)
  chatStyle = {
    borderRadius: '1rem',
    border: '1px solid #e2e8f0',
    width: '100%',
    height: '650px',
    backgroundColor: '#ffffff'
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
    this.api.get<BotAlumno | null>('/chatbot/bot').subscribe((bot) => this.bot.set(bot));
    this.api.get<MensajeChat[]>('/chatbot/mensajes').subscribe((mensajes) => {
      this.mensajesFormateados.set(
        mensajes.map(m => ({
          role: m.role === 'user' ? 'user' : 'ai',
          text: m.content
        }))
      );
    });
  }

  procesarMensaje(body: any, signals: any): void {
    // Deep chat envía el texto en el último mensaje
    const lastMessage = body.messages[body.messages.length - 1];
    const content = lastMessage.text;

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
    this.api.delete('/chatbot/mensajes').subscribe(() => {
      this.mensajesFormateados.set([]);
    });
  }

  botAvatar(): string {
    return this.activos.url(this.bot()?.avatar || 'img/bot_default.svg');
  }
}
