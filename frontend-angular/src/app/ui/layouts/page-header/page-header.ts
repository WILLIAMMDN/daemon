import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'daemon-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="py-6 mb-6 md:flex md:items-center md:justify-between border-b border-[var(--ds-color-border)]">
      <div class="min-w-0 flex-1">
        <h2 class="text-2xl font-bold leading-7 text-[var(--ds-color-text-primary)] sm:truncate sm:text-3xl sm:tracking-tight">
          {{ title }}
        </h2>
        <p *ngIf="description" class="mt-1 text-sm text-[var(--ds-color-text-secondary)]">
          {{ description }}
        </p>
      </div>
      <div *ngIf="hasActions" class="mt-4 flex md:ml-4 md:mt-0">
        <ng-content select="[actions]"></ng-content>
      </div>
    </header>
  `,
  styles: `
    :host {
      display: block;
    }
  `
})
export class PageHeader {
  @Input({ required: true }) title!: string;
  @Input() description?: string;
  @Input() hasActions = false;
}
