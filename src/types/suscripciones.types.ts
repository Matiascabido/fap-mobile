// Tipos del módulo Suscripciones (adaptados del frontend web)

export interface SuscripcionParticipante {
  nombre?: string | null;
  apellido?: string | null;
  dni?: string | null;
  mail?: string | null;
  celular?: string | null;
  telefono?: string | null;
  id_usuario?: string | null;
  id?: string | null;
  rol?: string | { nombre_rol?: string | null } | null;
  nombre_rol?: string | null;
}

export interface SuscripcionDetalle {
  nombre: string;
  precio: string;
  id: string;
}

export interface SuscripcionData {
  id: string;
  created_date: string;
  fecha_vencimiento: string;
  usuario: SuscripcionParticipante;
  profesional?: SuscripcionParticipante | null;
  usuario_socio?: SuscripcionParticipante | null;
  usuario_profesional?: SuscripcionParticipante | null;
  socio?: SuscripcionParticipante | null;
  suscripcion_detalle: SuscripcionDetalle;
}

export type SuscripcionEstado = 'vigente' | 'por_vencer' | 'vencida';
