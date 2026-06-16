// Tipos del módulo Evaluaciones (adaptados del frontend web)

export type TipoValorEvaluacion =
  | 'LATERALIDAD'
  | 'BOOLEAN'
  | 'NUMERICO'
  | 'FECHA'
  | 'TEXTO'
  | 'CONTENEDOR'
  | 'LSI';

export type LateralidadEvaluacion = 'izquierda' | 'derecha' | 'bilateral' | 'no';

export interface EvaluacionOpcion {
  id: string;
  valor: string;
  etiqueta: string;
  orden: number;
}

export interface EvaluacionCampo {
  id: string;
  id_padre?: string | null;
  nombre: string;
  codigo: string;
  orden: number;
  tipo_valor: TipoValorEvaluacion;
  es_obligatorio: boolean;
  opciones?: EvaluacionOpcion[];
  hijos?: EvaluacionCampo[];
}

export interface EvaluacionPruebaResumen {
  id: string;
  nombre: string;
  codigo: string;
  orden: number;
}

export interface EvaluacionSeccion {
  id: string;
  nombre: string;
  codigo: string;
  orden: number;
  pruebas: EvaluacionPruebaResumen[];
}

export interface EvaluacionGrupo {
  id: string;
  nombre: string;
  orden: number;
  secciones: EvaluacionSeccion[];
}

export interface EvaluacionPruebaDetalle {
  id: string;
  nombre: string;
  codigo: string;
  campos: EvaluacionCampo[];
}

export interface EvaluacionValorInput {
  id_campo: string;
  valor_lateralidad?: LateralidadEvaluacion | null;
  valor_boolean?: boolean | null;
  valor_numerico?: number | string | null;
  valor_fecha?: string | null;
  valor_texto?: string | null;
  id_opcion?: string | null;
}

export interface EvaluacionRegistroCreate {
  id_prueba: string;
  id_usuario_socio: string;
  fecha_evaluacion: string;
  observaciones?: string | null;
  valores?: EvaluacionValorInput[];
}

export interface EvaluacionValorResponse {
  id: string;
  id_campo: string;
  codigo_campo?: string | null;
  nombre_campo?: string | null;
  tipo_valor?: TipoValorEvaluacion | null;
  valor_lateralidad?: LateralidadEvaluacion | null;
  valor_boolean?: boolean | null;
  valor_numerico?: string | null;
  valor_fecha?: string | null;
  valor_texto?: string | null;
  id_opcion?: string | null;
}

export interface EvaluacionRegistroResumen {
  id: string;
  id_prueba: string;
  codigo_prueba?: string | null;
  nombre_prueba?: string | null;
  id_usuario_socio: string;
  id_usuario_profesional: string;
  fecha_evaluacion: string;
  observaciones?: string | null;
  created_date?: string | null;
}

export interface EvaluacionRegistroResponse extends EvaluacionRegistroResumen {
  valores: EvaluacionValorResponse[];
}

export interface ListRegistrosParams {
  id_usuario_socio: string;
  id_prueba?: string | null;
  page?: number;
  limit?: number;
}

export type PruebaEstadoSesion = 'pendiente' | 'activa' | 'guardada' | 'omitida';

export type ValorFormState =
  | { kind: 'lateralidad'; value: LateralidadEvaluacion | '' }
  | { kind: 'boolean'; value: boolean | null }
  | { kind: 'numerico'; value: string }
  | { kind: 'fecha'; value: string }
  | { kind: 'texto'; value: string }
  | { kind: 'opcion'; value: string };

export type PruebaFormValues = Record<string, ValorFormState>;

// Aliases para compatibilidad con utils portados del frontend
export type EvaluacionCampoResponse = EvaluacionCampo;
export type EvaluacionGrupoResponse = EvaluacionGrupo;
export type EvaluacionPruebaDetalleResponse = EvaluacionPruebaDetalle;
export type EvaluacionRegistroResumenResponse = EvaluacionRegistroResumen;
export type EvaluacionPruebaResumenResponse = EvaluacionPruebaResumen;
export type EvaluacionSeccionResponse = EvaluacionSeccion;
