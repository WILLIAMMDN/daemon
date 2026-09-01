import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { alumnoGuard } from './core/guards/alumno-guard';
import { docenteGuard } from './core/guards/docente-guard';
import { tutorGuard } from './core/guards/tutor-guard';
import { CATEGORIAS_PREMIO, NIVELES_ALUMNO, NIVELES_CONTENIDO } from './core/dominio/nivel-alumno';
import { soloDesarrolloGuard } from './core/guards/solo-desarrollo.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/publico/pages/inicio/inicio').then((m) => m.Inicio) },
  { path: 'login', loadComponent: () => import('./features/autenticacion/pages/login/login').then((m) => m.Login) },
  { path: 'login-docente', loadComponent: () => import('./features/autenticacion/pages/login-docente/login-docente').then((m) => m.LoginDocente) },
  { path: 'familias/acceso', loadComponent: () => import('./features/familias/pages/acceso-familias/acceso-familias').then((m) => m.AccesoFamilias) },
  { path: 'registro', loadComponent: () => import('./features/autenticacion/pages/registro/registro').then((m) => m.Registro) },
  { path: 'bienvenida', loadComponent: () => import('./features/autenticacion/pages/bienvenida/bienvenida').then((m) => m.Bienvenida), canActivate: [authGuard] },
  { path: 'recuperar-clave', loadComponent: () => import('./features/autenticacion/pages/recuperar-clave/recuperar-clave').then((m) => m.RecuperarClave) },
  { path: 'restablecer-clave', loadComponent: () => import('./features/autenticacion/pages/restablecer-clave/restablecer-clave').then((m) => m.RestablecerClave) },
  { path: 'verificar-correo', loadComponent: () => import('./features/autenticacion/pages/verificar-correo/verificar-correo').then((m) => m.VerificarCorreo) },
  {
    path: 'familias', loadComponent: () => import('./core/layouts/layout-tutor/layout-tutor').then((m) => m.LayoutTutor), canActivate: [tutorGuard], children: [
      { path: '', loadComponent: () => import('./features/familias/pages/panel-familias/panel-familias').then((m) => m.PanelFamilias) },
    ],
  },
  {
    path: 'alumno',
    loadComponent: () => import('./core/layouts/layout-alumno/layout-alumno').then((m) => m.LayoutAlumno),
    canActivate: [authGuard, alumnoGuard],
    loadChildren: () => import('./features/alumno/alumno.routes').then((m) => m.alumnoRoutes),
  },
  {
    path: 'docente', loadComponent: () => import('./core/layouts/layout-docente/layout-docente').then((m) => m.LayoutDocente), canActivate: [authGuard, docenteGuard], children: [
      { path: '', loadComponent: () => import('./features/docente/pages/panel-docente/panel-docente').then((m) => m.PanelDocente), data: { titulo: 'Panel docente', descripcion: 'Indicadores generales del aula y ranking.', endpoint: '/docente/panel' } },
      { path: 'perfil', loadComponent: () => import('./features/docente/pages/perfil-docente/perfil-docente').then((m) => m.PerfilDocente) },
      { path: 'notificaciones', loadComponent: () => import('./features/compartido/pages/notificaciones/notificaciones').then((m) => m.NotificacionesPage) },
      { path: 'alumnos', loadComponent: () => import('./features/docente/pages/lista-alumnos/lista-alumnos').then((m) => m.ListaAlumnos), data: { titulo: 'Alumnos y tokens', descripcion: 'Listado completo y ajustes de economía escolar.', endpoint: '/docente/alumnos', accion: { etiqueta: 'Asignar o retirar tokens', endpoint: '/docente/tokens', campos: [{ nombre: 'id_alumno', etiqueta: 'ID del alumno', tipo: 'number' }, { nombre: 'cantidad', etiqueta: 'Cantidad', tipo: 'number' }, { nombre: 'motivo', etiqueta: 'Motivo' }] } } },
      { path: 'aulas', loadComponent: () => import('./features/docente/pages/gestionar-aulas/gestionar-aulas').then((m) => m.GestionarAulas), data: { titulo: 'Gestionar aulas', descripcion: 'Administra los grupos y niveles de tus estudiantes.', endpoint: '/docente/aulas' } },
      { path: 'curriculo', loadComponent: () => import('./features/docente/pages/gestionar-curriculo/gestionar-curriculo').then((m) => m.GestionarCurriculo), data: { titulo: 'Currículo', descripcion: 'Cursos, períodos, unidades y lecciones publicables.', endpoint: '/academico' } },
      { path: 'carnets/:usuarioId', loadComponent: () => import('./features/certificados/pages/imprimir-carnet/imprimir-carnet').then((m) => m.ImprimirCarnet) },
      { path: 'misiones', loadComponent: () => import('./features/docente/pages/gestionar-misiones/gestionar-misiones').then((m) => m.GestionarMisiones), data: { titulo: 'Gestionar misiones', descripcion: 'Crea desafíos y revisa su disponibilidad.', endpoint: '/misiones', accion: { etiqueta: 'Crear misión', endpoint: '/misiones', campos: [{ nombre: 'titulo', etiqueta: 'Título' }, { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'textarea' }, { nombre: 'recompensa', etiqueta: 'Recompensa', tipo: 'number' }, { nombre: 'tipo_evidencia', etiqueta: 'Evidencia', tipo: 'select', opciones: ['texto','archivo','imagen','video'], valor: 'texto' }, { nombre: 'nivel_requerido', etiqueta: 'Nivel', tipo: 'select', opciones: NIVELES_CONTENIDO, valor: 'TODOS' }] } } },
      { path: 'entregas', loadComponent: () => import('./features/docente/pages/herramientas-clase/herramientas-clase').then((m) => m.HerramientasClase), data: { titulo: 'Entregas', descripcion: 'Evidencias enviadas por los estudiantes.', endpoint: '/misiones/entregas', accion: { etiqueta: 'Revisar entrega', endpoint: '/misiones/entregas/{id}/revisar', campos: [{ nombre: 'id', etiqueta: 'ID de entrega', tipo: 'number' }, { nombre: 'estado', etiqueta: 'Estado', tipo: 'select', opciones: ['aprobado','rechazado'], valor: 'aprobado' }, { nombre: 'calificacion', etiqueta: 'Tokens', tipo: 'number' }, { nombre: 'comentario_docente', etiqueta: 'Comentario' }] } } },
      { path: 'insignias', loadComponent: () => import('./features/docente/pages/gestionar-insignias/gestionar-insignias').then((m) => m.GestionarInsignias), data: { titulo: 'Insignias', descripcion: 'Catálogo de reconocimientos del aula.', endpoint: '/docente/insignias', accion: { etiqueta: 'Crear insignia', endpoint: '/docente/insignias', campos: [{ nombre: 'nombre', etiqueta: 'Nombre' }, { nombre: 'descripcion', etiqueta: 'Descripción' }, { nombre: 'imagen', etiqueta: 'Ruta de imagen' }] } } },
      { path: 'tienda', loadComponent: () => import('./features/docente/pages/gestionar-tienda/gestionar-tienda').then((m) => m.GestionarTienda), data: { titulo: 'Gestionar tienda', descripcion: 'Premios, existencias, cosméticos y canjes.', endpoint: '/tienda/administrar', accion: { etiqueta: 'Crear premio', endpoint: '/tienda/premios', campos: [{ nombre: 'nombre', etiqueta: 'Nombre' }, { nombre: 'descripcion', etiqueta: 'Descripción' }, { nombre: 'precio', etiqueta: 'Precio', tipo: 'number' }, { nombre: 'stock', etiqueta: 'Stock', tipo: 'number' }, { nombre: 'categoria', etiqueta: 'Categoría', tipo: 'select', opciones: CATEGORIAS_PREMIO, valor: 'GENERAL' }, { nombre: 'tipo_entrega', etiqueta: 'Entrega', tipo: 'select', opciones: ['fisico','digital','cosmetico'], valor: 'fisico' }] } } },
      { path: 'evaluaciones', loadComponent: () => import('./features/evaluaciones/pages/gestionar-evaluacion/gestionar-evaluacion').then((m) => m.GestionarEvaluacion), data: { titulo: 'Evaluaciones', descripcion: 'Exámenes, estados y banco de preguntas.', endpoint: '/evaluaciones', accion: { etiqueta: 'Crear evaluación', endpoint: '/evaluaciones', campos: [{ nombre: 'titulo', etiqueta: 'Título' }, { nombre: 'nivel', etiqueta: 'Nivel', tipo: 'select', opciones: NIVELES_ALUMNO, valor: 'TEENS' }, { nombre: 'estado', etiqueta: 'Estado', tipo: 'select', opciones: ['borrador','activo','finalizado'], valor: 'borrador' }] } } },
      { path: 'evaluaciones/resultados', loadComponent: () => import('./features/evaluaciones/pages/ver-resultados/ver-resultados').then((m) => m.VerResultados) },
      { path: 'competencia', loadComponent: () => import('./features/competencia/pages/competencia-control/competencia-control').then((m) => m.CompetenciaControl), data: { titulo: 'Control de competencia', descripcion: 'Selecciona candidato, inicia votación, cierra y premia.', endpoint: '/competencia/estado', accion: { etiqueta: 'Controlar ronda', endpoint: '/competencia/control', campos: [{ nombre: 'accion', etiqueta: 'Acción', tipo: 'select', opciones: ['candidato','iniciar','cerrar','premiar','reiniciar'], valor: 'candidato' }, { nombre: 'id_alumno', etiqueta: 'ID del alumno', tipo: 'number' }, { nombre: 'duracion', etiqueta: 'Segundos', tipo: 'number', valor: 60 }, { nombre: 'puntos', etiqueta: 'Premio', tipo: 'number' }] } } },
      { path: 'competencia/tv', loadComponent: () => import('./features/competencia/pages/tv/tv').then((m) => m.Tv) },
      { path: 'rondas', loadComponent: () => import('./features/docente/pages/historial-rondas/historial-rondas').then((m) => m.HistorialRondas), data: { titulo: 'Historial de rondas', descripcion: 'Ganadores y resultados de competencias.', endpoint: '/competencia/historial' } },
      { path: 'tokens', loadComponent: () => import('./features/docente/pages/historial-tokens/historial-tokens').then((m) => m.HistorialTokens), data: { titulo: 'Historial de tokens', descripcion: 'Auditoría de todos los movimientos.', endpoint: '/docente/historial-tokens' } },
    ],
  },
  { path: 'dev/design-system', canActivate: [soloDesarrolloGuard], loadComponent: () => import('./features/dev/pages/catalogo-diseno/catalogo-diseno').then((m) => m.CatalogoDiseno) },
  { path: '**', redirectTo: '' },
];
