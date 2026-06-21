import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Header} from '../../../../core/layouts/header/header'; 
import { Footer} from '../../../../core/layouts/footer/footer';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
// Aquí importamos los avioncitos y nubes que ya vienen en la librería
import { faPlane, faCloud, faStar, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, Header, Footer, FontAwesomeModule],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {

  iconoAvion = faPlane;
  iconoAvionPapel = faPaperPlane;
  iconoNube = faCloud;
  iconoEstrella = faStar;
}
