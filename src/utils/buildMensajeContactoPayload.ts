import type { MensajeContactoDTO } from '../types/mensajes.types';
import type { UserSessionContact } from './userContact';

function strOrNull(value: string): string | null {
  const t = value.trim();
  return t ? t : null;
}

export function buildMensajeContactoPayload(input: {
  user: UserSessionContact;
  mensaje: string;
}): MensajeContactoDTO {
  return {
    user_id: input.user.userId,
    user_mail: input.user.userMail,
    user_phoneNumber: strOrNull(input.user.userPhoneNumber),
    mensaje: input.mensaje.trim(),
  };
}
