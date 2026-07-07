import { Component , ChangeDetectionStrategy} from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-mensaje-chat',
  imports: [],
  templateUrl: './mensaje-chat.html',
  styleUrl: './mensaje-chat.scss',
})
export class MensajeChat {}
