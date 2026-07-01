import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faAward,
  faBell,
  faBookOpen,
  faBolt,
  faCertificate,
  faChalkboardUser,
  faChartLine,
  faClipboardCheck,
  faCoins,
  faComments,
  faFileLines,
  faFlask,
  faGamepad,
  faGift,
  faHouse,
  faIdCard,
  faLayerGroup,
  faListCheck,
  faMedal,
  faRobot,
  faShieldHalved,
  faStore,
  faTrophy,
  faTv,
  faUser,
  faUsers,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';

export interface PortalSidebarItem {
  id: string;
  etiqueta: string;
  ruta?: string;
  detalle?: string;
  icono: IconDefinition;
  badge?: string;
  exacto?: boolean;
  abierto?: boolean;
  hijos?: PortalSidebarItem[];
}

export interface PortalSidebarSection {
  titulo: string;
  items: PortalSidebarItem[];
}

export const alumnoSidebarSections: PortalSidebarSection[] = [
  {
    titulo: 'Inicio',
    items: [
      { id: 'alumno-panel', etiqueta: 'Panel', ruta: '/alumno', detalle: 'Tu progreso', icono: faHouse, exacto: true, badge: 'Hoy' },
      { id: 'alumno-perfil', etiqueta: 'Mi perfil', ruta: '/alumno/perfil', detalle: 'Cuenta y logros', icono: faUser },
      { id: 'alumno-recursos', etiqueta: 'Recursos', ruta: '/alumno/recursos', detalle: 'Materiales', icono: faBookOpen },
    ],
  },
  {
    titulo: 'Academia',
    items: [
      {
        id: 'alumno-misiones',
        etiqueta: 'Misiones',
        detalle: 'Retos y evidencias',
        icono: faListCheck,
        abierto: true,
        hijos: [
          { id: 'alumno-desafios', etiqueta: 'Mis desafíos', ruta: '/alumno/desafios', detalle: 'Para tu nivel', icono: faBolt },
          { id: 'alumno-lista-misiones', etiqueta: 'Todas las misiones', ruta: '/alumno/misiones', detalle: 'Retos activos', icono: faLayerGroup },
        ],
      },
      {
        id: 'alumno-evaluaciones',
        etiqueta: 'Evaluaciones',
        detalle: 'Exámenes y resultados',
        icono: faClipboardCheck,
        hijos: [
          { id: 'alumno-examenes', etiqueta: 'Exámenes activos', ruta: '/alumno/evaluaciones', detalle: 'Responder', icono: faFileLines },
          { id: 'alumno-resultados', etiqueta: 'Mis resultados', ruta: '/alumno/resultados', detalle: 'Historial', icono: faChartLine },
        ],
      },
      {
        id: 'alumno-certificado',
        etiqueta: 'Certificado',
        detalle: 'Carnet y constancia',
        icono: faCertificate,
        hijos: [
          { id: 'alumno-certificado-ver', etiqueta: 'Ver certificado', ruta: '/alumno/certificado', detalle: 'Datos de impresión', icono: faCertificate },
          { id: 'alumno-carnet', etiqueta: 'Imprimir carnet', ruta: '/alumno/certificado/imprimir', detalle: 'Carnet estudiantil', icono: faIdCard },
        ],
      },
    ],
  },
  {
    titulo: 'Herramientas',
    items: [
      {
        id: 'alumno-herramientas',
        etiqueta: 'Herramientas IA',
        detalle: 'Chatbot y laboratorio',
        icono: faRobot,
        badge: 'IA',
        hijos: [
          { id: 'alumno-herramientas-home', etiqueta: 'Vista general', ruta: '/alumno/herramientas', detalle: 'Todo en un lugar', icono: faWandMagicSparkles },
          { id: 'alumno-chatbot', etiqueta: 'Chatbot', ruta: '/alumno/herramientas/chatbot', detalle: 'Asistente del aula', icono: faComments },
          { id: 'alumno-bot', etiqueta: 'Crear bot', ruta: '/alumno/herramientas/bot', detalle: 'Configura tu bot', icono: faRobot },
          { id: 'alumno-lab', etiqueta: 'Laboratorio IA', ruta: '/alumno/herramientas/laboratorio', detalle: 'Cerebro y matriz Q', icono: faFlask },
          { id: 'alumno-neuro', etiqueta: 'Neuro Maze', ruta: '/alumno/herramientas/neuro-maze', detalle: 'Juego de lógica', icono: faGamepad },
          { id: 'alumno-defensa', etiqueta: 'Defensa IA', ruta: '/alumno/herramientas/defensa-ia', detalle: 'Entrenamiento', icono: faShieldHalved },
        ],
      },
    ],
  },
  {
    titulo: 'Comunidad',
    items: [
      { id: 'alumno-ranking', etiqueta: 'Ranking', ruta: '/alumno/ranking', detalle: 'Clasificación', icono: faTrophy },
      { id: 'alumno-comunidad', etiqueta: 'Comunidad', ruta: '/alumno/comunidad', detalle: 'Perfiles del aula', icono: faUsers },
      { id: 'alumno-competencia', etiqueta: 'Competencia', ruta: '/alumno/competencia', detalle: 'Votación en vivo', icono: faMedal },
      { id: 'alumno-tv', etiqueta: 'Pantalla TV', ruta: '/alumno/competencia/tv', detalle: 'Vista pública', icono: faTv },
    ],
  },
  {
    titulo: 'Economía',
    items: [
      { id: 'alumno-tienda', etiqueta: 'Tienda', ruta: '/alumno/tienda', detalle: 'Premios disponibles', icono: faStore },
      { id: 'alumno-canjes', etiqueta: 'Mis canjes', ruta: '/alumno/canjes', detalle: 'Premios y códigos', icono: faGift },
    ],
  },
];

export const docenteSidebarSections: PortalSidebarSection[] = [
  {
    titulo: 'Inicio',
    items: [
      { id: 'docente-panel', etiqueta: 'Panel', ruta: '/docente', detalle: 'Resumen del aula', icono: faHouse, exacto: true },
      { id: 'docente-perfil', etiqueta: 'Perfil', ruta: '/docente/perfil', detalle: 'Cuenta docente', icono: faUser },
      { id: 'docente-alumnos', etiqueta: 'Alumnos y tokens', ruta: '/docente/alumnos', detalle: 'Cuentas y tokens', icono: faUsers, badge: 'Aula' },
    ],
  },
  {
    titulo: 'Academia',
    items: [
      {
        id: 'docente-misiones',
        etiqueta: 'Misiones',
        detalle: 'Desafíos y entregas',
        icono: faListCheck,
        abierto: true,
        hijos: [
          { id: 'docente-misiones-lista', etiqueta: 'Gestionar misiones', ruta: '/docente/misiones', detalle: 'Crear desafíos', icono: faBolt },
          { id: 'docente-entregas', etiqueta: 'Entregas', ruta: '/docente/entregas', detalle: 'Revisar evidencias', icono: faClipboardCheck },
        ],
      },
      {
        id: 'docente-evaluaciones',
        etiqueta: 'Evaluaciones',
        detalle: 'Exámenes y resultados',
        icono: faFileLines,
        hijos: [
          { id: 'docente-evaluaciones-lista', etiqueta: 'Gestionar evaluaciones', ruta: '/docente/evaluaciones', detalle: 'Banco de preguntas', icono: faFileLines },
          { id: 'docente-resultados', etiqueta: 'Resultados', ruta: '/docente/evaluaciones/resultados', detalle: 'Seguimiento', icono: faChartLine },
        ],
      },
    ],
  },
  {
    titulo: 'Gamificación',
    items: [
      { id: 'docente-insignias', etiqueta: 'Insignias', ruta: '/docente/insignias', detalle: 'Reconocimientos', icono: faAward },
      { id: 'docente-tienda', etiqueta: 'Tienda', ruta: '/docente/tienda', detalle: 'Premios y canjes', icono: faStore },
      { id: 'docente-tokens', etiqueta: 'Historial tokens', ruta: '/docente/tokens', detalle: 'Auditoría de tokens', icono: faCoins },
    ],
  },
  {
    titulo: 'En vivo',
    items: [
      {
        id: 'docente-competencia',
        etiqueta: 'Competencia',
        detalle: 'Rondas y pantalla pública',
        icono: faMedal,
        hijos: [
          { id: 'docente-control', etiqueta: 'Control de ronda', ruta: '/docente/competencia', detalle: 'Iniciar y cerrar votos', icono: faChalkboardUser },
          { id: 'docente-tv', etiqueta: 'Pantalla TV', ruta: '/docente/competencia/tv', detalle: 'Vista pública', icono: faTv },
          { id: 'docente-rondas', etiqueta: 'Historial rondas', ruta: '/docente/rondas', detalle: 'Resultados anteriores', icono: faTrophy },
        ],
      },
      { id: 'docente-alertas', etiqueta: 'Actividad', ruta: '/docente/tokens', detalle: 'Movimientos recientes', icono: faBell, badge: 'Live' },
    ],
  },
];
