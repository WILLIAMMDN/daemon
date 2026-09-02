import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ArcArea } from '../../../../../shared/componentes/arc-area/arc-area';
import { ArcNavItem } from '../../../../../shared/componentes/arc-local-nav/arc-local-nav';
import { Aprendizaje } from '../../../services/aprendizaje';

const MENSAJE_ERROR: Record<string, string> = {
  offline: 'Sin conexión con DAEMON. Comprueba tu red y vuelve a intentarlo.',
  timeout: 'La conexión está tardando más de lo esperado. Inténtalo nuevamente.',
  permission: 'Tu cuenta no tiene acceso a la ruta de aprendizaje. Comunícate con tu docente.',
  generic: 'No pudimos cargar tu aprendizaje en este momento.',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-aprender',
  imports: [RouterOutlet, ArcArea, NzAlertModule, NzButtonModule],
  templateUrl: './aprender.html',
  styleUrl: './aprender.scss',
})
export class Aprender {
  readonly aprendizaje = inject(Aprendizaje);

  readonly items: ArcNavItem[] = [
    { etiqueta: 'Mis cursos', ruta: 'mis-aprendizajes' },
    { etiqueta: 'Explorar', ruta: 'explorar' },
  ];

  readonly mensajeError = computed(() => {
    const motivo = this.aprendizaje.error();
    return motivo ? MENSAJE_ERROR[motivo] : null;
  });

  constructor() {
    this.aprendizaje.asegurarCargado();
  }

  reintentar(): void {
    this.aprendizaje.cargar(true);
  }
}
