import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Sesion } from '../../../../core/servicios/sesion';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { MonedaDaemon } from '../../../../shared/componentes/moneda-daemon/moneda-daemon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-perfil-docente',
  imports: [CommonModule, RouterLink, NzButtonModule, MonedaDaemon],
  templateUrl: './perfil-docente.html',
  styleUrl: './perfil-docente.scss',
})
export class PerfilDocente {
  constructor(public sesion: Sesion) {}
}
