import { Component , ChangeDetectionStrategy} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sesion } from '../../../../core/servicios/sesion';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-perfil-docente',
  imports: [RouterLink],
  templateUrl: './perfil-docente.html',
  styleUrl: './perfil-docente.scss',
})
export class PerfilDocente {
  constructor(public sesion: Sesion) {}
}
