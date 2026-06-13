// Tipos del módulo Turnero (adaptados del frontend web)

export interface TurnoCreadorInfo {
  nombre: string;
  apellido: string;
  nombre_completo: string;
  email: string;
}

export interface TurnoSerieInfo {
  titulo: string;
}

export interface TurnoInscriptoListItem {
  id_usuario?: string | null;
  id?: string | null;
  usuario?: { id_usuario?: string | null; id?: string | null } | null;
  nombre?: string;
  apellido?: string;
  nombre_completo?: string;
  email?: string | null;
  mail?: string | null;
}

export interface TurnoResponse {
  id_turno: string;
  creador?: TurnoCreadorInfo | null;
  serie?: TurnoSerieInfo | null;
  fecha_inicio: string;
  fecha_fin: string;
  cupos_maximos: number;
  titulo?: string | null;
  descripcion?: string | null;
  cancelado: boolean;
  visible_hasta?: string | null;
  cantidad_inscriptos?: number;
  cupos_libres?: number;
  inscriptos?: TurnoInscriptoListItem[] | null;
  inscripto?: boolean;
  esta_inscripto?: boolean;
  usuario_inscripto?: boolean;
  yo_inscripto?: boolean;
}

export interface ListTurnosParams {
  page?: number;
  limit?: number;
  desde?: string | null;
  hasta?: string | null;
  email_socio?: string | null;
  email_profesional?: string | null;
}
