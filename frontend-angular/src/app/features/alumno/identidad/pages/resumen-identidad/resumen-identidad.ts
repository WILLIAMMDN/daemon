import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { ArcSection } from '../../../../../shared/componentes/arc-section/arc-section';
import { Sesion } from '../../../../../core/servicios/sesion';
import { PulseService } from '../../../../../core/servicios/pulse.service';
import { Aprendizaje } from '../../../services/aprendizaje';

/**
 * Resumen de identidad: quién eres y en qué estado están las tres monedas del
 * producto, que son distintas entre sí — XP (progresión), Mastery (evidencia
 * académica) y Daems (economía).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-resumen-identidad',
  imports: [
    RouterLink,
    NzAlertModule,
    NzAvatarModule,
    NzButtonModule,
    NzProgressModule,
    NzSkeletonModule,
    ArcSection,
  ],
  templateUrl: './resumen-identidad.html',
  styleUrl: './resumen-identidad.scss',
})
export class ResumenIdentidad {
  readonly pulse = inject(PulseService);
  readonly aprendizaje = inject(Aprendizaje);
  private readonly sesion = inject(Sesion);

  readonly usuario = this.sesion.usuario;
  readonly iniciales = computed(() => {
    const nombre = this.usuario()?.nombre_completo?.trim() ?? '';
    if (!nombre) return '';
    return nombre
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase() ?? '')
      .join('');
  });

  constructor() {
    this.pulse.ensureSnapshot();
    this.pulse.ensureAchievements();
    this.aprendizaje.asegurarCargado();
  }
}
