import { Component, signal, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Cuento } from '../../services/cuento';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { CommonModule } from '@angular/common';
import { BotonAccion } from '../../../../shared/componentes/boton-accion/boton-accion';
import { QuillModule } from 'ngx-quill';

const PLANTILLAS: Record<string, string> = {
  '1': `
    <h2 style="text-align: center;">Viaje a las Estrellas</h2>
    <p style="text-align: center;"><img src="/img/cuentos/template-1.png" width="400" /></p>
    <p>Era el año 3050 y nuestra nave acababa de aterrizar en el planeta rojo...</p>
    <p><em>(Continúa tu aventura aquí)</em></p>
  `,
  '2': `
    <h2 style="text-align: center;">El Misterio del Bosque Encantado</h2>
    <p style="text-align: center;"><img src="/img/cuentos/template-2.png" width="400" /></p>
    <p>Los árboles parecían susurrar mi nombre mientras me adentraba en la maleza...</p>
    <p><em>(Continúa tu historia aquí)</em></p>
  `,
  '3': `
    <h2 style="text-align: center;">El Reloj de Arena</h2>
    <p style="text-align: center;"><img src="/img/cuentos/template-3.png" width="400" /></p>
    <p>Solo quedaba un grano de arena. Si caía, el universo volvería a empezar...</p>
    <p><em>(Continúa tu historia aquí)</em></p>
  `
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-crear-cuento',
  imports: [CommonModule, FormsModule, RouterLink, Cargando, NzAlertModule, BotonAccion, QuillModule],
  templateUrl: './crear-cuento.html',
  styleUrl: './crear-cuento.scss',
})
export class CrearCuento implements OnInit {
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');
  cuento: Record<string, string> = {
    titulo: '',
    contenido: '',
  };

  private cuentos = inject(Cuento);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.cuentos.mio().subscribe({
      next: (cuento: any) => {
        if (cuento && (cuento.titulo || cuento.contenido)) {
          this.cuento = {
            titulo: cuento.titulo ?? '',
            contenido: cuento.contenido ?? '',
          };
        } else {
          // Si no tiene cuento, revisar si hay plantilla
          const plantillaId = this.route.snapshot.queryParamMap.get('plantilla');
          if (plantillaId && PLANTILLAS[plantillaId]) {
            this.cuento['contenido'] = PLANTILLAS[plantillaId];
            this.cuento['titulo'] = 'Mi nueva historia';
          }
        }
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  guardar(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.cuentos.guardar(this.cuento).subscribe({
      next: () => {
        this.mensaje.set('Cuento guardado correctamente.');
        this.guardando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo guardar el cuento.');
        this.guardando.set(false);
      },
    });
  }

  // Opciones del editor Quill
  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],               // custom button values
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
      [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
      [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean'],                                         // remove formatting button
      ['link', 'image', 'video']                         // link and image, video
    ]
  };
}
