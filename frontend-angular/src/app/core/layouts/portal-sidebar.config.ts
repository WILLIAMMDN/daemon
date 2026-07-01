import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faAward,
  faBookOpenReader,
  faBullhorn,
  faCertificate,
  faChalkboardUser,
  faChartSimple,
  faCircleUser,
  faClipboardCheck,
  faClipboardQuestion,
  faCoins,
  faComments,
  faFlaskVial,
  faGamepad,
  faGaugeHigh,
  faGift,
  faIdCard,
  faLayerGroup,
  faMedal,
  faPeopleGroup,
  faRankingStar,
  faRobot,
  faRocket,
  faShieldHalved,
  faStore,
  faTrophy,
  faTv,
  faUsersGear,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';

export type PortalSidebarTone = 'indigo' | 'orange' | 'green' | 'cyan' | 'pink';

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
  tono?: PortalSidebarTone;
  items: PortalSidebarItem[];
}

export const alumnoSidebarSections: PortalSidebarSection[] = [
  {
    titulo: 'Inicio',
    tono: 'indigo',
    items: [
      { id: 'alumno-panel', etiqueta: 'Panel', ruta: '/alumno', detalle: 'Tu progreso', icono: faGaugeHigh, exacto: true, badge: 'Hoy' },
      { id: 'alumno-perfil', etiqueta: 'Mi perfil', ruta: '/alumno/perfil', detalle: 'Cuenta y logros', icono: faCircleUser },
      { id: 'alumno-recursos', etiqueta: 'Recursos', ruta: '/alumno/recursos', detalle: 'Materiales', icono: faBookOpenReader },
    ],
  },
  {
    titulo: 'Academia',
    tono: 'orange',
    items: [
      {
        id: 'alumno-misiones',
        etiqueta: 'Misiones',
        detalle: 'Retos y evidencias',
        icono: faRocket,
        abierto: true,
        hijos: [
          { id: 'alumno-desafios', etiqueta: 'Mis desafíos', ruta: '/alumno/desafios', detalle: 'Para tu nivel', icono: faRocket },
          { id: 'alumno-lista-misiones', etiqueta: 'Todas las misiones', ruta: '/alumno/misiones', detalle: 'Retos activos', icono: faLayerGroup },
        ],
      },
      {
        id: 'alumno-evaluaciones',
        etiqueta: 'Evaluaciones',
        detalle: 'Exámenes y resultados',
        icono: faClipboardQuestion,
        hijos: [
          { id: 'alumno-examenes', etiqueta: 'Exámenes activos', ruta: '/alumno/evaluaciones', detalle: 'Responder', icono: faClipboardQuestion },
          { id: 'alumno-resultados', etiqueta: 'Mis resultados', ruta: '/alumno/resultados', detalle: 'Historial', icono: faChartSimple },
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
    tono: 'cyan',
    items: [
      {
        id: 'alumno-herramientas',
        etiqueta: 'Herramientas IA',
        detalle: 'Chatbot y laboratorio',
        icono: faWandMagicSparkles,
        badge: 'IA',
        hijos: [
          { id: 'alumno-herramientas-home', etiqueta: 'Vista general', ruta: '/alumno/herramientas', detalle: 'Todo en un lugar', icono: faWandMagicSparkles },
          { id: 'alumno-chatbot', etiqueta: 'Chatbot', ruta: '/alumno/herramientas/chatbot', detalle: 'Asistente del aula', icono: faComments },
          { id: 'alumno-bot', etiqueta: 'Crear bot', ruta: '/alumno/herramientas/bot', detalle: 'Configura tu bot', icono: faRobot },
          { id: 'alumno-lab', etiqueta: 'Laboratorio IA', ruta: '/alumno/herramientas/laboratorio', detalle: 'Cerebro y matriz Q', icono: faFlaskVial },
          { id: 'alumno-neuro', etiqueta: 'Neuro Maze', ruta: '/alumno/herramientas/neuro-maze', detalle: 'Juego de lógica', icono: faGamepad },
          { id: 'alumno-defensa', etiqueta: 'Defensa IA', ruta: '/alumno/herramientas/defensa-ia', detalle: 'Entrenamiento', icono: faShieldHalved },
        ],
      },
    ],
  },
  {
    titulo: 'Comunidad',
    tono: 'green',
    items: [
      { id: 'alumno-ranking', etiqueta: 'Ranking', ruta: '/alumno/ranking', detalle: 'Clasificación', icono: faRankingStar },
      { id: 'alumno-comunidad', etiqueta: 'Comunidad', ruta: '/alumno/comunidad', detalle: 'Perfiles del aula', icono: faPeopleGroup },
      { id: 'alumno-competencia', etiqueta: 'Competencia', ruta: '/alumno/competencia', detalle: 'Votación en vivo', icono: faMedal },
      { id: 'alumno-tv', etiqueta: 'Pantalla TV', ruta: '/alumno/competencia/tv', detalle: 'Vista pública', icono: faTv },
    ],
  },
  {
    titulo: 'Economía',
    tono: 'orange',
    items: [
      { id: 'alumno-tienda', etiqueta: 'Tienda', ruta: '/alumno/tienda', detalle: 'Premios disponibles', icono: faStore },
      { id: 'alumno-canjes', etiqueta: 'Mis canjes', ruta: '/alumno/canjes', detalle: 'Premios y códigos', icono: faGift },
    ],
  },
];

export const docenteSidebarSections: PortalSidebarSection[] = [
  {
    titulo: 'Inicio',
    tono: 'indigo',
    items: [
      { id: 'docente-panel', etiqueta: 'Panel', ruta: '/docente', detalle: 'Resumen del aula', icono: faGaugeHigh, exacto: true },
      { id: 'docente-perfil', etiqueta: 'Perfil', ruta: '/docente/perfil', detalle: 'Cuenta docente', icono: faCircleUser },
      { id: 'docente-alumnos', etiqueta: 'Alumnos y tokens', ruta: '/docente/alumnos', detalle: 'Cuentas y tokens', icono: faUsersGear, badge: 'Aula' },
    ],
  },
  {
    titulo: 'Academia',
    tono: 'orange',
    items: [
      {
        id: 'docente-misiones',
        etiqueta: 'Misiones',
        detalle: 'Desafíos y entregas',
        icono: faRocket,
        abierto: true,
        hijos: [
          { id: 'docente-misiones-lista', etiqueta: 'Gestionar misiones', ruta: '/docente/misiones', detalle: 'Crear desafíos', icono: faRocket },
          { id: 'docente-entregas', etiqueta: 'Entregas', ruta: '/docente/entregas', detalle: 'Revisar evidencias', icono: faClipboardCheck },
        ],
      },
      {
        id: 'docente-evaluaciones',
        etiqueta: 'Evaluaciones',
        detalle: 'Exámenes y resultados',
        icono: faClipboardQuestion,
        hijos: [
          { id: 'docente-evaluaciones-lista', etiqueta: 'Gestionar evaluaciones', ruta: '/docente/evaluaciones', detalle: 'Banco de preguntas', icono: faClipboardQuestion },
          { id: 'docente-resultados', etiqueta: 'Resultados', ruta: '/docente/evaluaciones/resultados', detalle: 'Seguimiento', icono: faChartSimple },
        ],
      },
    ],
  },
  {
    titulo: 'Gamificación',
    tono: 'green',
    items: [
      { id: 'docente-insignias', etiqueta: 'Insignias', ruta: '/docente/insignias', detalle: 'Reconocimientos', icono: faAward },
      { id: 'docente-tienda', etiqueta: 'Tienda', ruta: '/docente/tienda', detalle: 'Premios y canjes', icono: faStore },
      { id: 'docente-tokens', etiqueta: 'Historial tokens', ruta: '/docente/tokens', detalle: 'Auditoría de tokens', icono: faCoins },
    ],
  },
  {
    titulo: 'En vivo',
    tono: 'pink',
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
      { id: 'docente-alertas', etiqueta: 'Actividad', ruta: '/docente/tokens', detalle: 'Movimientos recientes', icono: faBullhorn, badge: 'Live' },
    ],
  },
];
