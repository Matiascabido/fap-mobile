// Tipos del módulo Socios (adaptados del frontend web)

export interface Rol {
  nombre_rol: string;
  observacion: string | null;
  id_rol: string;
  created_date?: string;
  update_date?: string | null;
}

export interface Domicilio {
  calle: string;
  numero: string;
  piso: string;
  depto: string;
  id: string;
  created_date?: string;
  update_date?: string | null;
}

export interface HistoriaClinica {
  antecedentes: boolean;
  antecedentes_desc?: string;
  cirugias: boolean;
  cirugias_desc?: string;
  tratamiento: boolean;
  tratamiento_desc?: string;
  patologiaBase: boolean;
  patologiaBase_desc?: string;
}

/** Usuario tal como viene del backend en GET /usuarios */
export interface User {
  nombre: string;
  apellido: string;
  dni: string;
  mail: string;
  celular: string;
  genero: string | null;
  fecha_nacimiento: string | null;
  obra_social: string | null;
  tipo_estatus: string;
  tipo_status?: string;
  id_usuario: string;
  estado: boolean;
  created_date?: string;
  update_date?: string | null;
  rol: Rol;
  domicilio?: Domicilio;
  especialidad_nombre?: string | null;
  disciplina?: string | null;
  especialidad_etiqueta?: string | null;
  nombre_apellido_especialidad?: string | null;
}

/** Socio normalizado para la UI */
export interface Socio {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  dni: string;
  tipo: string;
  estado: 'Activo' | 'Inactivo';
  tipoEstatus?: string;
  especialidad?: string;
}

/** Detalle completo de un socio (GET /usuarios/{id}) */
export interface SocioDetail {
  nombre: string;
  apellido: string;
  dni: string;
  mail: string;
  celular: string;
  genero: string;
  fecha_nacimiento: string;
  obra_social: string | null;
  tipo_estatus: string;
  id_usuario: string;
  estado: boolean;
  rol: Rol;
  domicilio: Domicilio;
  historia_clinica: HistoriaClinica;
  especialidad_nombre?: string | null;
  disciplina?: string | null;
  especialidad_etiqueta?: string | null;
  nombre_apellido_especialidad?: string | null;
}

export interface CreateSocioDTO {
  nombre: string;
  apellido: string;
  dni: string;
  id_rol: string;
  mail: string;
  password: string;
  fecha_nacimiento?: string;
  calle?: string;
  numero?: string;
  piso?: string;
  depto?: string;
  celular?: string;
  genero?: string;
  obra_social?: string;
  historia_clinica: HistoriaClinica;
}
