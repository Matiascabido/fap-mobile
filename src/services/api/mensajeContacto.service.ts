import { apiFetch } from './http';
import type { MensajeContactoDTO } from '../../types/mensajes.types';

/** Mock activo: no llama al backend real */
const MENSAJE_CONTACTO_MOCK = true;

export const mensajeContactoService = {
  async enviar(dto: MensajeContactoDTO): Promise<void> {
    if (MENSAJE_CONTACTO_MOCK) {
      if (__DEV__) {
        console.log('[API] POST /mensajes-contacto (mock)', dto);
      }
      await new Promise((r) => setTimeout(r, 600));
      return;
    }
    await apiFetch('/mensajes-contacto/', {
      method: 'POST',
      data: dto,
    });
  },
};
