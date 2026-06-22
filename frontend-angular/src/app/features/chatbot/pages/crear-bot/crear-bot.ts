import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { Api } from '../../../../core/servicios/api';

interface BotConfig {
  nombre_bot?: string | null;
  system_prompt?: string | null;
  conocimiento?: string | null;
  avatar?: string | null;
}

@Component({
  selector: 'app-crear-bot',
  imports: [FormsModule, RouterLink],
  templateUrl: './crear-bot.html',
  styleUrl: './crear-bot.scss',
})
export class CrearBot {
  datos = { nombre_bot: '', system_prompt: '', conocimiento: '' };
  avatarActual = signal('');
  avatarPreview = signal('');
  mensaje = signal('');
  error = signal('');
  cargando = signal(true);
  guardando = signal(false);
  private archivoAvatar: File | null = null;
  private readonly assetBaseUrl = environment.apiUrl.replace(/\/api\/v1\/?$/, '');

  constructor(private api: Api) {
    this.api.get<BotConfig | null>('/chatbot/bot').subscribe({
      next: (bot) => {
        if (bot) {
          this.datos = {
            nombre_bot: bot.nombre_bot ?? '',
            system_prompt: bot.system_prompt ?? '',
            conocimiento: bot.conocimiento ?? '',
          };
          this.avatarActual.set(bot.avatar ?? '');
        }
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar la configuración del bot.');
        this.cargando.set(false);
      },
    });
  }

  seleccionarAvatar(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    this.archivoAvatar = archivo;

    if (!archivo) {
      this.avatarPreview.set('');
      return;
    }

    const lector = new FileReader();
    lector.onload = () => this.avatarPreview.set(String(lector.result ?? ''));
    lector.readAsDataURL(archivo);
  }

  guardar(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');

    const formData = new FormData();
    formData.append('nombre_bot', this.datos.nombre_bot);
    formData.append('system_prompt', this.datos.system_prompt);
    formData.append('conocimiento', this.datos.conocimiento);
    if (this.archivoAvatar) {
      formData.append('avatar', this.archivoAvatar);
    }

    this.api.post<BotConfig>('/chatbot/bot', formData).subscribe({
      next: (bot) => {
        if (bot.avatar) {
          this.avatarActual.set(bot.avatar);
          this.avatarPreview.set('');
          this.archivoAvatar = null;
        }
        this.mensaje.set('Bot guardado.');
        this.guardando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo guardar.');
        this.guardando.set(false);
      },
    });
  }

  avatarVisible(): string {
    return this.avatarPreview() || this.asset(this.avatarActual() || 'img/bot_default.png');
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
