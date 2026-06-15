import { apiFetch } from './http';

export interface MensajeContactoDTO {
  nombre?: string;
  email?: string;
  telefono?: string;
  mensaje: string;
}

/** Mock activo: no llama al backend real */
const MENSAJE_CONTACTO_MOCK = true;

export const mensajeContactoService = {
  async enviar(dto: MensajeContactoDTO): Promise<void> {
    if (MENSAJE_CONTACTO_MOCK) {
      await new Promise((r) => setTimeout(r, 600));
      return;
    }
    await apiFetch('/mensajes-contacto/', {
      method: 'POST',
      data: dto,
    });
  },
};
