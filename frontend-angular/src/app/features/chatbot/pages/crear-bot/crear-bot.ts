import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../../../../core/servicios/api';

@Component({
  selector: 'app-crear-bot',
  imports: [FormsModule, RouterLink],
  templateUrl: './crear-bot.html',
  styleUrl: './crear-bot.scss',
})
export class CrearBot {
  datos = { nombre_bot: '', system_prompt: '', conocimiento: '' }; mensaje = signal(''); error = signal('');
  constructor(private api: Api) { this.api.get<any>('/chatbot/bot').subscribe((bot) => { if (bot) this.datos = { nombre_bot: bot.nombre_bot ?? '', system_prompt: bot.system_prompt ?? '', conocimiento: bot.conocimiento ?? '' }; }); }
  guardar(): void { this.api.post('/chatbot/bot', this.datos).subscribe({ next: () => this.mensaje.set('Bot guardado.'), error: (e) => this.error.set(e.error?.message ?? 'No se pudo guardar.') }); }
}
