import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header-banner.html',
  styleUrls: ['./header-banner.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderBannerComponent {
  @Input({ required: true }) bgImage!: string;
  @Input() minHeight = '190px';
  /** Optional illustration rendered on the right side of the hero. */
  @Input() artImage: string | null = null;
  @Input() artAlt = '';
}
