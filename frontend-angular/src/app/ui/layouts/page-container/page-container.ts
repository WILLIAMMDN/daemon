import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DaemonLayoutType = 'standard' | 'contextual' | 'compact' | 'immersive';

@Component({
  selector: 'daemon-page-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="daemon-page-container mx-auto w-full transition-all duration-300"
      [ngClass]="{
        'max-w-[1440px] px-4 sm:px-6 lg:px-8': layout === 'standard',
        'max-w-[1600px] px-4 sm:px-6 lg:px-8 flex flex-col xl:flex-row gap-6': layout === 'contextual',
        'max-w-[800px] px-4 sm:px-6': layout === 'compact',
        'max-w-none px-0': layout === 'immersive'
      }"
    >
      <ng-content></ng-content>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }
  `
})
export class PageContainer {
  @Input() layout: DaemonLayoutType = 'standard';
}
