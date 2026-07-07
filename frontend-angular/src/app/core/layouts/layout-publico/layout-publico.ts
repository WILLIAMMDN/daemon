import { Component , ChangeDetectionStrategy} from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-layout-publico',
  imports: [],
  templateUrl: './layout-publico.html',
  styleUrl: './layout-publico.scss',
})
export class LayoutPublico {}
