import { Injectable } from '@angular/core';
import { Api } from '../../../core/servicios/api';

export interface ChatbotRespuesta {
  respuesta?: string;
  content?: string;
  mensaje?: string;
}

export interface CerebroIA {
  matriz_neural?: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class Chatbot {
  constructor(private api: Api) {}
  bot() { return this.api.get('/chatbot/bot'); }
  mensajes() { return this.api.get('/chatbot/mensajes'); }
  enviar(content: string) { return this.api.post<ChatbotRespuesta>('/chatbot/mensajes', { content }); }
  cerebro() { return this.api.get<CerebroIA>('/chatbot/cerebro'); }
  guardarCerebro(matriz_neural: unknown) { return this.api.post('/chatbot/cerebro', { matriz_neural }); }
}
