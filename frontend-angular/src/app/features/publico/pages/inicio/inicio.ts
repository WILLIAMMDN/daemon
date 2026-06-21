import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCloud, faPaperPlane, faPlane, faStar } from '@fortawesome/free-solid-svg-icons';
import { RouterLink } from '@angular/router';
import { Footer } from '../../../../core/layouts/footer/footer';
import { Header } from '../../../../core/layouts/header/header';
import { FloatingShape } from '../../../../shared/componentes/floating-shape/floating-shape';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, Header, Footer, FontAwesomeModule, FloatingShape],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {
  iconoAvion = faPlane;
  iconoAvionPapel = faPaperPlane;
  iconoNube = faCloud;
  iconoEstrella = faStar;
}
