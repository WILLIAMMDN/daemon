import { Component , ChangeDetectionStrategy} from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ticket',
  imports: [],
  templateUrl: './ticket.html',
  styleUrl: './ticket.scss',
})
export class Ticket {}
