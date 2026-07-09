import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Activos } from '../../../../core/servicios/activos';
import { Api } from '../../../../core/servicios/api';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { MediaUploader } from '../../../../shared/componentes/media-uploader/media-uploader';
import { BotonAccion } from '../../../../shared/componentes/boton-accion/boton-accion';
import { CommonModule } from '@angular/common';

interface BotConfig {
  nombre_bot?: string | null;
  system_prompt?: string | null;
  conocimiento?: string | null;
  avatar?: string | null;
  proveedor?: string | null;
  modelo_ia?: string | null;
}

interface ModeloIa {
  id: string;
  nombre: string;
}

interface ModelosDisponibles {
  ollama: ModeloIa[];
  openrouter: ModeloIa[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-crear-bot',
  imports: [
    FormsModule,
    RouterLink,
    NzAlertModule,
    NzAvatarModule,
    NzButtonModule,
    NzProgressModule,
    NzTagModule,
    Cargando,
    MediaUploader,
    BotonAccion,
    CommonModule,
  ],
  templateUrl: './crear-bot.html',
  styleUrl: './crear-bot.scss',
})
export class CrearBot {
  datos = { nombre_bot: '', system_prompt: '', conocimiento: '', proveedor: 'openrouter', modelo_ia: 'meta-llama/llama-3.3-70b-instruct:free' };
  modelos = signal<ModelosDisponibles>({ ollama: [], openrouter: [] });
  avatarActual = signal('');
  avatarPreview = signal('');
  mensaje = signal('');
  error = signal('');
  cargando = signal(true);
  guardando = signal(false);
  uploadResetKey = signal(0);
  private archivoAvatar: File | null = null;

  constructor(private api: Api, private activos: Activos) {
    this.api.get<ModelosDisponibles>('/chatbot/modelos').subscribe((modelos) => this.modelos.set(modelos));

    this.api.get<BotConfig | null>('/chatbot/bot').subscribe({
      next: (bot) => {
        if (bot) {
          this.datos = {
            nombre_bot: bot.nombre_bot ?? '',
            system_prompt: bot.system_prompt ?? '',
            conocimiento: bot.conocimiento ?? '',
            proveedor: bot.proveedor ?? 'openrouter',
            modelo_ia: bot.modelo_ia ?? 'meta-llama/llama-3.3-70b-instruct:free',
          };
          this.avatarActual.set(bot.avatar ?? '');
        }
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar la configuracion del bot.');
        this.cargando.set(false);
      },
    });
  }

  seleccionarAvatar(archivo: File | null): void {
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
    formData.append('proveedor', this.datos.proveedor);
    formData.append('modelo_ia', this.datos.modelo_ia);
    if (this.archivoAvatar) {
      formData.append('avatar', this.archivoAvatar);
    }

    this.api.post<BotConfig>('/chatbot/bot', formData).subscribe({
      next: (bot) => {
        if (bot.avatar) {
          this.avatarActual.set(bot.avatar);
        }
        this.avatarPreview.set('');
        this.archivoAvatar = null;
        this.uploadResetKey.update((valor) => valor + 1);
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
    return this.avatarPreview() || this.asset(this.avatarActual() || 'img/bot_default.svg');
  }

  asset(ruta?: string | null): string {
    return this.activos.url(ruta);
  }

  progresoBot(): number {
    const puntos = [
      this.datos.nombre_bot.trim(),
      this.datos.system_prompt.trim(),
      this.datos.conocimiento.trim(),
      this.avatarVisible(),
    ].filter(Boolean).length;

    return Math.round((puntos / 4) * 100);
  }

  estadoProgreso(): 'active' | 'success' {
    return this.progresoBot() >= 75 ? 'success' : 'active';
  }
}
