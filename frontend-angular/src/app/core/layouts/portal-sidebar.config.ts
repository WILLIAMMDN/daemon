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
  faCode,
  faCoins,
  faDragon,
  faGaugeHigh,
  faGift,
  faHouse,
  faMedal,
  faPeopleGroup,
  faRankingStar,
  faRocket,
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
    titulo: 'DAEMON ARC',
    tono: 'indigo',
    items: [
      { id: 'alumno-panel', etiqueta: 'Inicio', ruta: '/alumno', icono: faHouse, exacto: true },
      {
        id: 'alumno-recursos',
        etiqueta: 'Aprender',
        icono: faBookOpenReader,
        hijos: [
          { id: 'alumno-recursos-lista', etiqueta: 'Cursos', ruta: '/alumno/recursos', icono: faBookOpenReader, exacto: true },
          { id: 'alumno-evaluaciones', etiqueta: 'Evaluaciones', ruta: '/alumno/evaluaciones', icono: faClipboardQuestion },
          { id: 'alumno-certificado', etiqueta: 'Certificado', ruta: '/alumno/certificado', icono: faCertificate },
        ],
      },
      {
        id: 'alumno-proyectos',
        etiqueta: 'Crear',
        icono: faWandMagicSparkles,
        hijos: [
          { id: 'alumno-proyectos-lista', etiqueta: 'Proyectos', ruta: '/alumno/proyectos', icono: faCode, exacto: true },
          { id: 'alumno-herramientas', etiqueta: 'Herramientas IA', ruta: '/alumno/herramientas', icono: faWandMagicSparkles },
        ],
      },
      {
        id: 'alumno-comunidad',
        etiqueta: 'Comunidad',
        icono: faPeopleGroup,
        hijos: [
          { id: 'alumno-comunidad-lista', etiqueta: 'Comunidad', ruta: '/alumno/comunidad', icono: faPeopleGroup, exacto: true },
          { id: 'alumno-ranking', etiqueta: 'Ranking', ruta: '/alumno/ranking', icono: faRankingStar },
        ],
      },
      {
        id: 'alumno-agenda',
        etiqueta: 'Agenda',
        icono: faClipboardCheck,
        hijos: [
          { id: 'alumno-misiones', etiqueta: 'Misiones', ruta: '/alumno/misiones', icono: faRocket, exacto: true },
        ],
      },
      {
        id: 'alumno-identidad',
        etiqueta: 'Identidad',
        icono: faCircleUser,
        hijos: [
          { id: 'alumno-perfil', etiqueta: 'Mi perfil', ruta: '/alumno/perfil', icono: faCircleUser, exacto: true },
          { id: 'alumno-mascota', etiqueta: 'Mi criatura', ruta: '/alumno/mascota', icono: faDragon },
          { id: 'alumno-recompensas', etiqueta: 'Recompensas', ruta: '/alumno/tienda', icono: faGift },
        ],
      },
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
      { id: 'docente-alumnos', etiqueta: 'Alumnos y tokens', ruta: '/docente/alumnos', detalle: 'Cuentas y tokens', icono: faUsersGear },
      { id: 'docente-aulas', etiqueta: 'Gestionar aulas', ruta: '/docente/aulas', detalle: 'Grupos y niveles', icono: faPeopleGroup },
    ],
  },
  {
    titulo: 'Academia',
    tono: 'orange',
    items: [
      { id: 'docente-curriculo', etiqueta: 'Currículo', ruta: '/docente/curriculo', detalle: 'Cursos y lecciones', icono: faBookOpenReader },
      {
        id: 'docente-misiones',
        etiqueta: 'Misiones',
        detalle: 'Desafios y entregas',
        icono: faRocket,
        abierto: true,
        hijos: [
          { id: 'docente-misiones-lista', etiqueta: 'Gestionar misiones', ruta: '/docente/misiones', detalle: 'Crear desafios', icono: faRocket, exacto: true },
          { id: 'docente-entregas', etiqueta: 'Entregas', ruta: '/docente/entregas', detalle: 'Revisar evidencias', icono: faClipboardCheck },
        ],
      },
      {
        id: 'docente-evaluaciones',
        etiqueta: 'Evaluaciones',
        detalle: 'Examenes y resultados',
        icono: faClipboardQuestion,
        hijos: [
          { id: 'docente-evaluaciones-lista', etiqueta: 'Gestionar evaluaciones', ruta: '/docente/evaluaciones', detalle: 'Banco de preguntas', icono: faClipboardQuestion, exacto: true },
          { id: 'docente-resultados', etiqueta: 'Resultados', ruta: '/docente/evaluaciones/resultados', detalle: 'Seguimiento', icono: faChartSimple },
        ],
      },
    ],
  },
  {
    titulo: 'Gamificacion',
    tono: 'green',
    items: [
      { id: 'docente-insignias', etiqueta: 'Insignias', ruta: '/docente/insignias', detalle: 'Reconocimientos', icono: faAward },
      { id: 'docente-tienda', etiqueta: 'Tienda', ruta: '/docente/tienda', detalle: 'Premios y canjes', icono: faStore },
      { id: 'docente-tokens', etiqueta: 'Historial tokens', ruta: '/docente/tokens', detalle: 'Auditoria de tokens', icono: faCoins },
    ],
  },
  {
    titulo: 'En vivo',
    tono: 'pink',
    items: [
      {
        id: 'docente-competencia',
        etiqueta: 'Competencia',
        detalle: 'Rondas y pantalla publica',
        icono: faMedal,
        hijos: [
          { id: 'docente-control', etiqueta: 'Control de ronda', ruta: '/docente/competencia', detalle: 'Iniciar y cerrar votos', icono: faChalkboardUser, exacto: true },
          { id: 'docente-tv', etiqueta: 'Pantalla TV', ruta: '/docente/competencia/tv', detalle: 'Vista publica', icono: faTv },
          { id: 'docente-rondas', etiqueta: 'Historial rondas', ruta: '/docente/rondas', detalle: 'Resultados anteriores', icono: faTrophy },
        ],
      },
      { id: 'docente-alertas', etiqueta: 'Notificaciones', ruta: '/docente/notificaciones', detalle: 'Alertas recientes', icono: faBullhorn },
    ],
  },
];
