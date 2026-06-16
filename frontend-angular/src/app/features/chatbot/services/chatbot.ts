import { Injectable } from '@angular/core';
import { Api } from '../../../core/servicios/api';

@Injectable({
  providedIn: 'root',
})
export class Chatbot {
  constructor(private api: Api) {}
  bot() { return this.api.get('/chatbot/bot'); }
    mensajes() { return this.api.get('/chatbot/mensajes'); }
    enviar(content: string) { return this.api.post('/chatbot/mensajes', { content }); }
}
