import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { alumnoGuard } from './core/guards/alumno-guard';
import { docenteGuard } from './core/guards/docente-guard';
import { LayoutAlumno } from './core/layouts/layout-alumno/layout-alumno';
import { LayoutDocente } from './core/layouts/layout-docente/layout-docente';
import { Inicio } from './features/publico/pages/inicio/inicio';
import { Login } from './features/autenticacion/pages/login/login';
import { LoginDocente } from './features/autenticacion/pages/login-docente/login-docente';
import { Registro } from './features/autenticacion/pages/registro/registro';
import { RecuperarClave } from './features/autenticacion/pages/recuperar-clave/recuperar-clave';
import { RestablecerClave } from './features/autenticacion/pages/restablecer-clave/restablecer-clave';
import { PanelAlumno } from './features/alumno/pages/panel-alumno/panel-alumno';
import { PerfilAlumno } from './features/alumno/pages/perfil-alumno/perfil-alumno';
import { EditarPerfil } from './features/alumno/pages/editar-perfil/editar-perfil';
import { MisDesafios } from './features/alumno/pages/mis-desafios/mis-desafios';
import { Recursos } from './features/alumno/pages/recursos/recursos';
import { Certificado } from './features/certificados/pages/certificado/certificado';
import { ImprimirCarnet } from './features/certificados/pages/imprimir-carnet/imprimir-carnet';
import { ChatbotAlumno } from './features/chatbot/pages/chatbot-alumno/chatbot-alumno';
import { CrearBot } from './features/chatbot/pages/crear-bot/crear-bot';
import { Comunidad } from './features/comunidad/pages/comunidad/comunidad';
import { Votar } from './features/competencia/pages/votar/votar';
import { CompetenciaControl } from './features/competencia/pages/competencia-control/competencia-control';
import { Tv } from './features/competencia/pages/tv/tv';
import { CrearCuento } from './features/cuentos/pages/crear-cuento/crear-cuento';
import { GaleriaProyectos } from './features/cuentos/pages/galeria-proyectos/galeria-proyectos';
import { VerCuento } from './features/cuentos/pages/ver-cuento/ver-cuento';
import { PanelDocente } from './features/docente/pages/panel-docente/panel-docente';
import { ListaAlumnos } from './features/docente/pages/lista-alumnos/lista-alumnos';
import { GestionarMisiones } from './features/docente/pages/gestionar-misiones/gestionar-misiones';
import { HerramientasClase } from './features/docente/pages/herramientas-clase/herramientas-clase';
import { GestionarInsignias } from './features/docente/pages/gestionar-insignias/gestionar-insignias';
import { GestionarTienda } from './features/docente/pages/gestionar-tienda/gestionar-tienda';
import { HistorialRondas } from './features/docente/pages/historial-rondas/historial-rondas';
import { HistorialTokens } from './features/docente/pages/historial-tokens/historial-tokens';
import { PerfilDocente } from './features/docente/pages/perfil-docente/perfil-docente';
import { GestionarEvaluacion } from './features/evaluaciones/pages/gestionar-evaluacion/gestionar-evaluacion';
import { ExamenLive } from './features/evaluaciones/pages/examen-live/examen-live';
import { ResultadosExamen } from './features/evaluaciones/pages/resultados-examen/resultados-examen';
import { VerResultados } from './features/evaluaciones/pages/ver-resultados/ver-resultados';
import { Herramientas } from './features/herramientas/pages/herramientas/herramientas';
import { DefensaIa } from './features/laboratorio/pages/defensa-ia/defensa-ia';
import { EntrenamientoMascota } from './features/laboratorio/pages/entrenamiento-mascota/entrenamiento-mascota';
import { LabIa } from './features/laboratorio/pages/lab-ia/lab-ia';
import { NeuroMaze } from './features/laboratorio/pages/neuro-maze/neuro-maze';
import { DetalleMision } from './features/misiones/pages/detalle-mision/detalle-mision';
import { EntregarMision } from './features/misiones/pages/entregar-mision/entregar-mision';
import { ListaMisiones } from './features/misiones/pages/lista-misiones/lista-misiones';
import { Ranking } from './features/ranking/pages/ranking/ranking';
import { TiendaAlumno } from './features/tienda/pages/tienda-alumno/tienda-alumno';
import { MisCanjes } from './features/tienda/pages/mis-canjes/mis-canjes';

export const routes: Routes = [
  { path: '', component: Inicio },
  { path: 'login', component: Login },
  { path: 'login-docente', component: LoginDocente },
  { path: 'registro', component: Registro },
  { path: 'recuperar-clave', component: RecuperarClave },
  { path: 'restablecer-clave', component: RestablecerClave },
  {
    path: 'alumno', component: LayoutAlumno, canActivate: [authGuard, alumnoGuard], children: [
      { path: '', component: PanelAlumno, data: { titulo: 'Mi panel', descripcion: 'Resumen de progreso, tokens, insignias y actividad.', endpoint: '/alumno/panel' } },
      { path: 'perfil', component: PerfilAlumno, data: { titulo: 'Mi perfil', descripcion: 'Datos personales, insignias y mochila digital.', endpoint: '/alumno/perfil', accion: { etiqueta: 'Actualizar perfil', endpoint: '/alumno/perfil', campos: [{ nombre: 'nombre_completo', etiqueta: 'Nombre completo' }, { nombre: 'email', etiqueta: 'Correo' }, { nombre: 'biografia', etiqueta: 'Biografía', tipo: 'textarea' }] } } },
      { path: 'perfil/editar', component: EditarPerfil },
      { path: 'desafios', component: MisDesafios, data: { titulo: 'Mis desafíos', descripcion: 'Misiones disponibles para tu nivel y estado de tus entregas.', endpoint: '/misiones', accion: { etiqueta: 'Entregar evidencia', endpoint: '/misiones/{id}/entregar', campos: [{ nombre: 'id', etiqueta: 'ID de misión', tipo: 'number' }, { nombre: 'texto', etiqueta: 'Evidencia', tipo: 'textarea' }] } } },
      { path: 'misiones', component: ListaMisiones },
      { path: 'misiones/:id', component: DetalleMision },
      { path: 'misiones/:id/entregar', component: EntregarMision },
      { path: 'chatbot', redirectTo: 'herramientas/chatbot', pathMatch: 'full' },
      { path: 'crear-bot', redirectTo: 'herramientas/bot', pathMatch: 'full' },
      { path: 'herramientas', component: Herramientas },
      { path: 'herramientas/chatbot', component: ChatbotAlumno },
      { path: 'herramientas/bot', component: CrearBot },
      { path: 'recursos', component: Recursos },
      { path: 'tienda', component: TiendaAlumno, data: { titulo: 'Tienda', descripcion: 'Canjea tus tokens por premios disponibles.', endpoint: '/tienda', accion: { etiqueta: 'Canjear premio', endpoint: '/tienda/canjear/{id}', campos: [{ nombre: 'id', etiqueta: 'ID del premio', tipo: 'number' }] } } },
      { path: 'canjes', component: MisCanjes, data: { titulo: 'Mis canjes', descripcion: 'Historial y códigos de premios digitales.', endpoint: '/tienda/canjes' } },
      { path: 'evaluaciones', component: ExamenLive, data: { titulo: 'Evaluaciones', descripcion: 'Exámenes activos para tu nivel.', endpoint: '/evaluaciones/activas', accion: { etiqueta: 'Enviar respuestas', endpoint: '/evaluaciones/{id}/responder', campos: [{ nombre: 'id', etiqueta: 'ID del examen', tipo: 'number' }, { nombre: 'respuestas', etiqueta: 'Respuestas JSON: {"1":"A"}', tipo: 'json', valor: '{}' }] } } },
      { path: 'resultados', component: ResultadosExamen, data: { titulo: 'Mis resultados', descripcion: 'Puntajes obtenidos y exámenes enviados.', endpoint: '/evaluaciones/resultados' } },
      { path: 'competencia', component: Votar, data: { titulo: 'Competencia en vivo', descripcion: 'Estado de la ronda y voto actual.', endpoint: '/competencia/estado', accion: { etiqueta: 'Enviar voto', endpoint: '/competencia/votar', campos: [{ nombre: 'puntuacion', etiqueta: 'Puntuación (1-10)', tipo: 'number' }, { nombre: 'comentario', etiqueta: 'Comentario' }] } } },
      { path: 'competencia/tv', component: Tv },
      { path: 'cuentos', component: GaleriaProyectos, data: { titulo: 'Galería de cuentos', descripcion: 'Historias creadas por la comunidad.', endpoint: '/cuentos', accion: { etiqueta: 'Guardar mi cuento', endpoint: '/cuentos', campos: [{ nombre: 'titulo', etiqueta: 'Título' }, { nombre: 'data_1', etiqueta: 'Contenido de la primera escena', tipo: 'textarea' }] } } },
      { path: 'cuentos/crear', component: CrearCuento },
      { path: 'cuentos/:id', component: VerCuento },
      { path: 'ranking', component: Ranking, data: { titulo: 'Ranking', descripcion: 'Clasificación por nivel y tokens.', endpoint: '/ranking' } },
      { path: 'comunidad', component: Comunidad, data: { titulo: 'Comunidad', descripcion: 'Estudiantes y docentes de la plataforma.', endpoint: '/comunidad' } },
      { path: 'comunidad/perfil/:usuarioId', component: PerfilAlumno, data: { titulo: 'Perfil de compañero', descripcion: 'Perfil público de un participante de la comunidad.', endpoint: '/alumno/perfil/{usuarioId}' } },
      { path: 'laboratorio', redirectTo: 'herramientas/laboratorio', pathMatch: 'full' },
      { path: 'laboratorio/neuro-maze', redirectTo: 'herramientas/neuro-maze', pathMatch: 'full' },
      { path: 'laboratorio/defensa-ia', redirectTo: 'herramientas/defensa-ia', pathMatch: 'full' },
      { path: 'laboratorio/entrenamiento-mascota', redirectTo: 'herramientas/entrenamiento', pathMatch: 'full' },
      { path: 'herramientas/laboratorio', component: LabIa, data: { titulo: 'Laboratorio IA', descripcion: 'Entrenamiento del cerebro de tu mascota mediante una matriz Q.', endpoint: '/chatbot/cerebro', aviso: 'Los motores originales de neuro-maze, defensa IA y aprendizaje por refuerzo se conservaron en public/legacy/js.', accion: { etiqueta: 'Guardar matriz neural', endpoint: '/chatbot/cerebro', campos: [{ nombre: 'matriz_neural', etiqueta: 'Matriz en JSON', tipo: 'json', valor: '{"qTable":{},"epsilon":1}' }] } } },
      { path: 'herramientas/neuro-maze', component: NeuroMaze },
      { path: 'herramientas/defensa-ia', component: DefensaIa },
      { path: 'herramientas/entrenamiento', component: EntrenamientoMascota },
      { path: 'certificado', component: Certificado, data: { titulo: 'Certificado y carnet', descripcion: 'Datos listos para impresión y acreditación.', endpoint: '/certificados' } },
      { path: 'certificado/imprimir', component: ImprimirCarnet },
    ],
  },
  {
    path: 'docente', component: LayoutDocente, canActivate: [authGuard, docenteGuard], children: [
      { path: '', component: PanelDocente, data: { titulo: 'Panel docente', descripcion: 'Indicadores generales del aula y ranking.', endpoint: '/docente/panel' } },
      { path: 'perfil', component: PerfilDocente },
      { path: 'alumnos', component: ListaAlumnos, data: { titulo: 'Alumnos y tokens', descripcion: 'Listado completo y ajustes de economía escolar.', endpoint: '/docente/alumnos', accion: { etiqueta: 'Asignar o retirar tokens', endpoint: '/docente/tokens', campos: [{ nombre: 'id_alumno', etiqueta: 'ID del alumno', tipo: 'number' }, { nombre: 'cantidad', etiqueta: 'Cantidad', tipo: 'number' }, { nombre: 'motivo', etiqueta: 'Motivo' }] } } },
      { path: 'carnets/:usuarioId', component: ImprimirCarnet },
      { path: 'misiones', component: GestionarMisiones, data: { titulo: 'Gestionar misiones', descripcion: 'Crea desafíos y revisa su disponibilidad.', endpoint: '/misiones', accion: { etiqueta: 'Crear misión', endpoint: '/misiones', campos: [{ nombre: 'titulo', etiqueta: 'Título' }, { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'textarea' }, { nombre: 'recompensa', etiqueta: 'Recompensa', tipo: 'number' }, { nombre: 'tipo_evidencia', etiqueta: 'Evidencia', tipo: 'select', opciones: ['texto','archivo','imagen','video'], valor: 'texto' }, { nombre: 'nivel_requerido', etiqueta: 'Nivel', tipo: 'select', opciones: ['TODOS','KIDS','TEENS','PRO'], valor: 'TODOS' }] } } },
      { path: 'entregas', component: HerramientasClase, data: { titulo: 'Entregas', descripcion: 'Evidencias enviadas por los estudiantes.', endpoint: '/misiones/entregas', accion: { etiqueta: 'Revisar entrega', endpoint: '/misiones/entregas/{id}/revisar', campos: [{ nombre: 'id', etiqueta: 'ID de entrega', tipo: 'number' }, { nombre: 'estado', etiqueta: 'Estado', tipo: 'select', opciones: ['aprobado','rechazado'], valor: 'aprobado' }, { nombre: 'calificacion', etiqueta: 'Tokens', tipo: 'number' }, { nombre: 'comentario_docente', etiqueta: 'Comentario' }] } } },
      { path: 'insignias', component: GestionarInsignias, data: { titulo: 'Insignias', descripcion: 'Catálogo de reconocimientos del aula.', endpoint: '/docente/insignias', accion: { etiqueta: 'Crear insignia', endpoint: '/docente/insignias', campos: [{ nombre: 'nombre', etiqueta: 'Nombre' }, { nombre: 'descripcion', etiqueta: 'Descripción' }, { nombre: 'imagen', etiqueta: 'Ruta de imagen' }] } } },
      { path: 'tienda', component: GestionarTienda, data: { titulo: 'Gestionar tienda', descripcion: 'Premios, existencias y canjes.', endpoint: '/tienda/administrar', accion: { etiqueta: 'Crear premio', endpoint: '/tienda/premios', campos: [{ nombre: 'nombre', etiqueta: 'Nombre' }, { nombre: 'descripcion', etiqueta: 'Descripción' }, { nombre: 'precio', etiqueta: 'Precio', tipo: 'number' }, { nombre: 'stock', etiqueta: 'Stock', tipo: 'number' }, { nombre: 'categoria', etiqueta: 'Categoría', tipo: 'select', opciones: ['GENERAL','KIDS','TEENS','PRO'], valor: 'GENERAL' }, { nombre: 'tipo_entrega', etiqueta: 'Entrega', tipo: 'select', opciones: ['fisico','digital'], valor: 'fisico' }] } } },
      { path: 'evaluaciones', component: GestionarEvaluacion, data: { titulo: 'Evaluaciones', descripcion: 'Exámenes, estados y banco de preguntas.', endpoint: '/evaluaciones', accion: { etiqueta: 'Crear evaluación', endpoint: '/evaluaciones', campos: [{ nombre: 'titulo', etiqueta: 'Título' }, { nombre: 'nivel', etiqueta: 'Nivel', tipo: 'select', opciones: ['KIDS','TEENS','PRO'], valor: 'TEENS' }, { nombre: 'estado', etiqueta: 'Estado', tipo: 'select', opciones: ['borrador','activo','finalizado'], valor: 'borrador' }] } } },
      { path: 'evaluaciones/resultados', component: VerResultados },
      { path: 'competencia', component: CompetenciaControl, data: { titulo: 'Control de competencia', descripcion: 'Selecciona candidato, inicia votación, cierra y premia.', endpoint: '/competencia/estado', accion: { etiqueta: 'Controlar ronda', endpoint: '/competencia/control', campos: [{ nombre: 'accion', etiqueta: 'Acción', tipo: 'select', opciones: ['candidato','iniciar','cerrar','premiar','reiniciar'], valor: 'candidato' }, { nombre: 'id_alumno', etiqueta: 'ID del alumno', tipo: 'number' }, { nombre: 'duracion', etiqueta: 'Segundos', tipo: 'number', valor: 60 }, { nombre: 'puntos', etiqueta: 'Premio', tipo: 'number' }] } } },
      { path: 'competencia/tv', component: Tv },
      { path: 'rondas', component: HistorialRondas, data: { titulo: 'Historial de rondas', descripcion: 'Ganadores y resultados de competencias.', endpoint: '/competencia/historial' } },
      { path: 'tokens', component: HistorialTokens, data: { titulo: 'Historial de tokens', descripcion: 'Auditoría de todos los movimientos.', endpoint: '/docente/historial-tokens' } },
    ],
  },
  { path: '**', redirectTo: '' },
];
