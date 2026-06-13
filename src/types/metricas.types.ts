// Tipos del módulo Métricas (subconjunto del contrato del backend)

export type SchemaPanel =
  | 'god_v1'
  | 'admin_ficha_usuario_v1'
  | 'profesional_v1'
  | 'socio_v1';

export type DashboardVista = 'admin_global' | 'admin_socio' | 'profesional' | 'socio';

export interface MesValor {
  mes: string;
  [k: string]: unknown;
}

export interface MetricasUsuarios {
  total?: number;
  activos_cuenta?: number;
  nuevos_ultimos_7_dias?: number;
  nuevos_ultimos_30_dias?: number;
  por_rol?: { rol?: string; label?: string; cantidad: number }[];
  por_genero?: { genero?: string; label?: string; cantidad: number }[];
}

export interface MetricasSuscripciones {
  vigentes_hoy?: number;
  vencidas_registro_historico?: number;
  importe_mensual_catalogo_suma_vigentes?: number;
  importe_mensual_catalogo_vigentes?: number;
  altas_registro_ultimos_30_dias?: number;
  [k: string]: unknown;
}

export interface MetricasPlanes {
  tipos_plan?: number;
  planes?: number;
  asignaciones_activas?: number;
}

export interface MetricasTurnos {
  hoy?: number;
  proximos_7_dias_desde_ahora?: number;
  proximos_30_dias?: number;
  inscripciones_total?: number;
}

export interface MiSuscripcionVigente {
  id_suscripcion?: string;
  profesional?: string;
  detalle_nombre?: string;
  precio_catalogo_mes?: number;
  precio?: number;
  fecha_vencimiento?: string;
  dias_hasta_vencimiento?: number;
}

export interface FinancieroPersonal {
  total_pagado_historico?: number;
  cantidad_pagos_historicos?: number;
  historial_mensual_ultimos_6_meses?: MesValor[];
  estado_cuenta_mes_actual?: {
    catalogo_vigente?: number;
    pagado_en_mes?: number;
    saldo_pendiente_estimado?: number;
    al_dia?: boolean;
  };
}

export interface AsistenciaYActividad {
  dias_calendario_distintos_con_clase_ya_realizada?: number;
  turnos_distintos_con_asistencia_registrada?: number;
  inscripciones_historicas_totales?: number;
  inscripciones_en_clases_futuras?: number;
}

export interface ConstanciaAvanzada {
  frecuencia_semanal_promedio_30d?: number;
  racha_semanas_consecutivas?: number;
  distribucion_dias_semana?: Record<string, number>;
}

export interface EconomiaSuscripcionesSocio {
  importe_mensual_catalogo_total_abonar_vigentes?: number;
  cantidad_suscripciones_vigentes?: number;
  proximo_vencimiento?: MiSuscripcionVigente | null;
}

export interface ActividadComoProfesional {
  suscripciones_como_profesional_vigentes?: number;
  asignaciones_planes_como_profesional_activas?: number;
  socios_distintos_con_abono_vigente_hacia_el?: number;
  turnos_creados_total_historico?: number;
  turnos_creados_proximos_7_dias?: number;
}

export interface AlumnosYSocios {
  total_distintos_vinculados_por_plan_o_suscripcion?: number;
  con_suscripcion_vigente_conmigo?: number;
  socios_distintos_en_suscripciones_vigentes?: number;
}

export interface EconomiaYProyeccion {
  importe_mensual_catalogo_suscripciones_activas_hoy?: number;
}

export interface RankingProfesional {
  nombre?: string;
  apellido?: string;
  suscripciones_vigentes_filas?: number;
  importe_mensual_catalogo_vigentes?: number;
  ranking_posicion?: number;
}

export interface FinancierasAvanzadas {
  evolucion_mrr_ultimos_6_meses?: MesValor[];
  ticket_promedio_mes_actual?: number;
}

export interface MetricasDashboardMetricas {
  schema_panel?: SchemaPanel;

  // god_v1
  usuarios?: MetricasUsuarios;
  suscripciones?: MetricasSuscripciones;
  planes?: MetricasPlanes;
  turnos?: MetricasTurnos;
  ranking_profesionales_completo?: RankingProfesional[];
  financieras_avanzadas?: FinancierasAvanzadas;

  // profesional_v1
  actividad_como_profesional_o_docente?: ActividadComoProfesional;
  alumnos_y_socios?: AlumnosYSocios;
  economia_y_proyeccion_catalogo?: EconomiaYProyeccion;

  // socio_v1
  economia_suscripciones?: EconomiaSuscripcionesSocio;
  asistencia_y_actividad_en_clases?: AsistenciaYActividad;
  constancia_avanzada?: ConstanciaAvanzada;
  financiero_personal?: FinancieroPersonal;
  mis_suscripciones_vigentes?: MiSuscripcionVigente[];
  proximo_vencimiento?: MiSuscripcionVigente | null;

  recomendaciones?: string[];

  [k: string]: unknown;
}

export interface DashboardConsulta {
  rol_panel: string;
  vista: DashboardVista;
  descripcion: string;
}

export interface MetricasDashboardResponse {
  generado_en: string;
  timezone: string;
  vista: DashboardVista;
  id_usuario_contexto: string | null;
  consulta: DashboardConsulta;
  metricas: MetricasDashboardMetricas;
  advertencias?: string[];
  alcance?: string;
}
