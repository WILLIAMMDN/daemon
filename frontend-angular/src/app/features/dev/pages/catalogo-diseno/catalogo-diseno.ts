import { ChangeDetectionStrategy, Component } from '@angular/core';

interface MuestraToken {
  readonly nombre: string;
  readonly variable: string;
}

const TOKENS_COLOR: readonly MuestraToken[] = [
  { nombre: 'Primario', variable: 'var(--daemon-primary)' },
  { nombre: 'Primario oscuro', variable: 'var(--daemon-primary-dark)' },
  { nombre: 'Primario suave', variable: 'var(--daemon-primary-soft)' },
  { nombre: 'Acento', variable: 'var(--daemon-accent)' },
  { nombre: 'Fondo (canvas)', variable: 'var(--daemon-canvas)' },
  { nombre: 'Superficie', variable: 'var(--daemon-surface)' },
  { nombre: 'Superficie elevada', variable: 'var(--daemon-surface-elevated)' },
  { nombre: 'Texto', variable: 'var(--daemon-ink)' },
  { nombre: 'Texto secundario', variable: 'var(--daemon-ink-soft)' },
  { nombre: 'Borde', variable: 'var(--daemon-border)' },
  { nombre: 'Éxito', variable: 'var(--daemon-success)' },
  { nombre: 'Advertencia', variable: 'var(--daemon-warning)' },
  { nombre: 'Peligro', variable: 'var(--daemon-danger)' },
  { nombre: 'KIDS', variable: 'var(--daemon-kids)' },
  { nombre: 'TEENS', variable: 'var(--daemon-teens)' },
];

@Component({
  selector: 'app-catalogo-diseno',
  standalone: true,
  templateUrl: './catalogo-diseno.html',
  styleUrl: './catalogo-diseno.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogoDiseno {
  readonly tokens = TOKENS_COLOR;
}
