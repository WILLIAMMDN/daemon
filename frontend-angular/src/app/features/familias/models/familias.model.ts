export interface InvitacionFamiliar {
  id: number;
  alumno: string;
  nivel: string;
  declarado_at: string;
}

export interface HijoFamiliar {
  id: number;
  nombre: string;
  nivel: string;
  avatar?: string | null;
  aula?: string | null;
  parentesco: 'madre' | 'padre' | 'tutor';
}

export interface BienestarDigital {
  activo: boolean;
  bloqueado: boolean;
  motivo: 'horario_silencio' | 'limite_diario' | null;
  mensaje?: string | null;
  fecha_local: string;
  zona_horaria: string;
  minutos_usados: number;
  max_minutos_diarios: number | null;
  minutos_restantes: number | null;
  hora_silencio_inicio?: string | null;
  hora_silencio_fin?: string | null;
}

export interface ReporteAlumnoFamiliar {
  alumno: {
    id: number;
    nombre: string;
    nivel: string;
    avatar?: string | null;
    experiencia: number;
    nivel_gamificacion: number;
    posicion: number;
    posicion_scope_label: string;
    progreso_nivel: {
      progreso_porcentaje: number;
      experiencia_restante: number;
    };
  };
  semana: {
    misiones_aprobadas: number;
    xp_aprendizaje: number;
    evaluaciones_enviadas: number;
    promedio_evaluaciones: number;
    actividad: Array<{ fecha: string; etiqueta: string; activo: boolean }>;
    ultimas_misiones: Array<{ titulo: string; xp: number; fecha: string }>;
  };
  bienestar_digital: BienestarDigital;
  membresia: {
    plan: string;
    estado: string;
    importe_centimos?: number | null;
    moneda: string;
    ultimo_pago_at?: string | null;
    proximo_pago_at?: string | null;
    portal_pago_url?: string | null;
    soporte_email?: string | null;
    maneja_tarjetas_daemon: false;
  };
}

export interface PanelFamiliasDto {
  tutor: { nombre?: string | null; email: string };
  hijos: HijoFamiliar[];
  seleccionado: ReporteAlumnoFamiliar | null;
  invitaciones_pendientes: number;
}

export interface LimitePantallaPayload {
  activo: boolean;
  max_minutos_diarios: number;
  hora_silencio_inicio: string | null;
  hora_silencio_fin: string | null;
  zona_horaria: string;
}
