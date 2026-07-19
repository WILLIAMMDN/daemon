import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export type IllustrationKind =
  | 'decorative'
  | 'contextual'
  | 'instructional'
  | 'reward'
  | 'empty-state'
  | 'hero';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'daemon-illustration-slot',
  templateUrl: './illustration-slot.html',
  styleUrl: './illustration-slot.scss',
})
export class IllustrationSlot {
  readonly src = input<string | null>(null);
  readonly alt = input('');
  readonly kind = input<IllustrationKind>('contextual');
  readonly aspectRatio = input('4 / 3');
  readonly assetName = input('');
  readonly eager = input(false);

  readonly failed = signal(false);
  readonly hasImage = computed(() => Boolean(this.src()) && !this.failed());
  readonly fallbackLabel = computed(() => this.alt().trim() || 'Ilustración pendiente');

  onImageError(): void {
    this.failed.set(true);
  }
}
