// Tipos del módulo Planes (adaptados del frontend web)

export interface TipoPlan {
  nombre_tipo: string;
  id: string;
  created_date?: string | null;
  update_date?: string | null;
}

export interface PlanEjercicioItem {
  orden?: number | null;
  id?: string | null;
  id_fila_plan_bloque?: string | null;
  id_ejercicio?: string | null;
  id_rutina?: string | null;
  id_video?: string | null;
  series?: string | null;
  reps?: string | null;
  peso?: string | null;
  ejercicio?: Record<string, any> | null;
}

export interface Bloque {
  nombre: string;
  color?: string | null;
  observaciones?: string | null;
  id: string;
  ejercicios?: PlanEjercicioItem[] | null;
  id_plan_bloque?: string | null;
  id_fila_plan_bloque?: string | null;
  orden_en_plan?: number | null;
  dia_semana?: number | null;
}

export interface PlanBloqueRelacion {
  id?: string | null;
  id_plan_bloque?: string | null;
  id_fila_plan_bloque?: string | null;
  orden?: number | null;
  dia_semana?: number | null;
  bloque: Bloque;
  ejercicios?: PlanEjercicioItem[] | null;
}

export interface DiaSemanaBloquesGrupo {
  dia_semana?: number | null;
  dia_semana_nombre?: string | null;
  bloques: PlanBloqueRelacion[];
}

export interface Plan {
  numero: number;
  nombre_plan: string;
  semanas?: number | null;
  descripcion?: string | null;
  objetivo_semanal?: string | null;
  observaciones?: string | null;
  horario_inicio?: string | null;
  horario_fin?: string | null;
  id_tipo_plan?: string | null;
  tipo_plan?: TipoPlan | null;
  id: string;
  created_date?: string | null;
  update_date?: string | null;
}

export interface AsignacionUsuarioLite {
  nombre?: string | null;
  apellido?: string | null;
  telefono?: string | null;
  celular?: string | null;
}

export interface AsignacionPlan {
  id_usuario_socio?: string | null;
  id_usuario_profesional?: string | null;
  id_plan?: string | null;
  id: string;
  activo?: boolean;
  created_date?: string | null;
  update_date?: string | null;
  nombre_profesional?: string | null;
  nombre_socio?: string | null;
  profesional?: AsignacionUsuarioLite | null;
  socio?: AsignacionUsuarioLite | null;
}

/** Plan con todas sus relaciones (GET /planes) */
export interface PlanWithRelations {
  plan: Plan;
  asignaciones: AsignacionPlan[];
  bloques: (Bloque | PlanBloqueRelacion)[];
  bloques_por_dia?: DiaSemanaBloquesGrupo[] | null;
  tipo_plan?: TipoPlan | null;
  activo?: boolean | null;
}
