/** Body POST `/mensajes-contacto/` */
export interface MensajeContactoDTO {
  user_id: string;
  user_mail: string;
  user_phoneNumber: string | null;
  mensaje: string;
}

/** Body POST `/sugerencias-ejercicio/` */
export interface SugerenciaEjercicioDTO {
  user_id: string;
  user_mail: string;
  user_phoneNumber: string | null;
  comments: string;
  link_youtube: string | null;
  exercice_group: string | null;
}
