import { Component, signal, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { Cuento } from '../../services/cuento';
import { Sesion } from '../../../../core/servicios/sesion';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { Chatbot } from '../../../chatbot/services/chatbot';

import { CuentoHeroComponent } from './components/cuento-hero/cuento-hero.component';
import { CuentoLecturaComponent } from './components/cuento-lectura/cuento-lectura.component';
import { CuentoSidebarComponent } from './components/cuento-sidebar/cuento-sidebar.component';
import { CuentoComentariosComponent } from './components/cuento-comentarios/cuento-comentarios.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ver-cuento',
  standalone: true,
  imports: [
    CommonModule, RouterLink, Cargando, EstadoVacio,
    CuentoHeroComponent, CuentoLecturaComponent, CuentoSidebarComponent, CuentoComentariosComponent
  ],
  templateUrl: './ver-cuento.html',
  styleUrl: './ver-cuento.scss',
})
export class VerCuento implements OnInit {
  datos = signal<any | null>(null);
  comentarios = signal<any[]>([]);
  cargando = signal(true);
  error = signal('');
  id: string;

  // Estado del Propietario y Sesión
  esPropietario = signal(false);
  miAvatar = signal('/img/avatars/default.png');
  guardado = signal(false);

  // Comentarios
  enviandoComentario = signal(false);

  // UI State
  escalaFuente = signal<number>(1);
  modoLectura = signal(false);

  miId = signal<string | number | null>(null);
  
  // Asistente Lector
  tipAsistente = signal('¡Generando tip mágico...');

  // Reacciones
  reaccionesCount = signal<{ [tipo: string]: number }>({
    'encanto': 0, 'increible': 0, 'gusto': 0, 'sorprendio': 0, 'interesante': 0
  });
  miReaccion = signal<string | null>(null);

  private chatbot = inject(Chatbot);

  constructor(
    private route: ActivatedRoute,
    private cuento: Cuento,
    private sesion: Sesion
  ) {
    this.id = this.route.snapshot.paramMap.get('id') || '';
  }

  ngOnInit() {
    if (!this.id) {
      this.error.set('ID de cuento no válido.');
      this.cargando.set(false);
      return;
    }

    this.cuento.detalle(this.id).subscribe({
      next: (datos) => {
        if (!datos.cuento.contenido && datos.cuento.data_1) {
          datos.cuento.contenido = datos.cuento.data_1 as string;
        }
        this.datos.set(datos);
        
        const user = this.sesion.usuario();
        if (user) {
          this.miId.set(user.id);
          if (user.avatar) this.miAvatar.set(user.avatar);
          if (String(user.id) === String(datos.cuento.id_alumno)) {
            this.esPropietario.set(true);
          }
        }

        this.cargando.set(false);
        this.cargarComentarios();
        this.cargarReacciones();
        this.generarTipAsistente(datos.cuento.titulo || undefined);
      },
      error: (e) => {
        this.error.set(e.message ?? 'No se pudo cargar el cuento.');
        this.cargando.set(false);
      },
    });
  }

  // --- Actions ---
  cambiarFuente(delta: number) {
    const nueva = this.escalaFuente() + delta;
    if (nueva >= 0.8 && nueva <= 1.5) this.escalaFuente.set(nueva);
  }

  toggleModoLectura() {
    this.modoLectura.set(!this.modoLectura());
  }

  toggleGuardar() {
    this.guardado.set(!this.guardado());
  }

  copiarEnlace() {
    navigator.clipboard.writeText(window.location.href);
    alert('¡Enlace del cuento copiado al portapapeles!');
  }

  generarTipAsistente(titulo?: string) {
    this.tipAsistente.set('✨ Leyendo tu historia y pensando en un tip...');
    const tituloReal = titulo || 'una gran aventura';
    const prompt = `Dame un tip o frase motivadora muy corta (1 oración, máximo 15 palabras) dirigida al lector de un cuento llamado "${tituloReal}", para animarlo a disfrutar la lectura.`;
    
    this.chatbot.enviar(prompt).subscribe({
      next: (res: any) => {
        const mensaje = res?.respuesta || res?.content || res?.mensaje || res;
        this.tipAsistente.set(mensaje);
      },
      error: () => this.tipAsistente.set('¡Fíjate en los detalles de la historia! ¿Qué te hacen sentir?')
    });
  }

  cargarReacciones() {
    this.cuento.listarReacciones(this.id).subscribe({
      next: (reacciones) => {
        const conteo: Record<string, number> = { 'encanto': 0, 'increible': 0, 'gusto': 0, 'sorprendio': 0, 'interesante': 0 };
        const usuarioActual = this.sesion.usuario();
        
        reacciones.forEach(r => {
          if (conteo[r.tipo] !== undefined) conteo[r.tipo]++;
          if (usuarioActual && r.id === String(usuarioActual.id)) this.miReaccion.set(r.tipo);
        });
        
        this.reaccionesCount.set(conteo);
      },
      error: (e) => console.error('Error al cargar reacciones:', e)
    });
  }

  reaccionar(tipo: string) {
    const miReaccionActual = this.miReaccion();
    const nuevoConteo: Record<string, number> = { ...this.reaccionesCount() };

    if (miReaccionActual) {
      if ((nuevoConteo[miReaccionActual] ?? 0) > 0) nuevoConteo[miReaccionActual]--;
    }

    if (miReaccionActual !== tipo) {
      nuevoConteo[tipo] = (nuevoConteo[tipo] ?? 0) + 1;
      this.miReaccion.set(tipo);
    } else {
      this.miReaccion.set(null);
      tipo = '';
    }

    this.reaccionesCount.set(nuevoConteo);

    if (tipo) {
      this.cuento.agregarReaccion(this.id, tipo).subscribe({
        error: () => this.cargarReacciones()
      });
    }
  }

  cargarComentarios() {
    this.cuento.listarComentarios(this.id).subscribe({
      next: (comentarios) => this.comentarios.set(comentarios),
      error: (e) => console.error('Error al cargar comentarios:', e)
    });
  }

  enviarComentario(contenido: string) {
    this.enviandoComentario.set(true);
    this.cuento.agregarComentario(this.id, contenido).subscribe({
      next: (comentarioGuardado) => {
        this.comentarios.update(comentarios => [...comentarios, comentarioGuardado]);
        this.enviandoComentario.set(false);
      },
      error: (e) => {
        console.error('Error al guardar comentario:', e);
        this.enviandoComentario.set(false);
      }
    });
  }

  editarComentario(event: {id: string, contenido: string}) {
    this.cuento.editarComentario(event.id, event.contenido).subscribe({
      next: () => {
        this.comentarios.update(comentarios => 
          comentarios.map(c => c.id === event.id ? { ...c, contenido: event.contenido } : c)
        );
      },
      error: (e) => console.error('Error al editar comentario:', e)
    });
  }

  eliminarComentario(id: string) {
    this.cuento.eliminarComentario(id).subscribe({
      next: () => {
        this.comentarios.update(comentarios => comentarios.filter(c => c.id !== id));
      },
      error: (e) => console.error('Error al eliminar comentario:', e)
    });
  }
}
