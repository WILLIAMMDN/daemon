import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Sesion } from '../../../../core/servicios/sesion';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-perfil-docente',
  imports: [CommonModule, RouterLink, NzButtonModule],
  templateUrl: './perfil-docente.html',
  styleUrl: './perfil-docente.scss',
})
export class PerfilDocente {
  constructor(public sesion: Sesion) {}
}
