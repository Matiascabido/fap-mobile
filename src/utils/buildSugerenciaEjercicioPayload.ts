import type { SugerenciaEjercicioDTO } from '../types/mensajes.types';
import type { UserSessionContact } from './userContact';

function strOrNull(value: string): string | null {
  const t = value.trim();
  return t ? t : null;
}

export function buildSugerenciaEjercicioPayload(input: {
  user: UserSessionContact;
  nombre: string;
  descripcion: string;
  comentarios: string;
  enlaceYoutube: string;
  exerciceGroup: string | null;
}): SugerenciaEjercicioDTO {
  const parts: string[] = [
    `Ejercicio sugerido: ${input.nombre.trim()}`,
    `Descripción: ${input.descripcion.trim()}`,
  ];
  const extra = input.comentarios.trim();
  if (extra) {
    parts.push(`Comentarios: ${extra}`);
  }

  return {
    user_id: input.user.userId,
    user_mail: input.user.userMail,
    user_phoneNumber: strOrNull(input.user.userPhoneNumber),
    comments: parts.join('\n\n'),
    link_youtube: strOrNull(input.enlaceYoutube),
    exercice_group: input.exerciceGroup,
  };
}
