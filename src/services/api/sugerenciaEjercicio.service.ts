import { apiFetch } from './http';
import type { SugerenciaEjercicioDTO } from '../../types/mensajes.types';

/** Mock activo: no llama al backend real */
const SUGERENCIA_EJERCICIO_MOCK = true;

export const sugerenciaEjercicioService = {
  async enviar(dto: SugerenciaEjercicioDTO): Promise<void> {
    if (SUGERENCIA_EJERCICIO_MOCK) {
      if (__DEV__) {
        console.log('[API] POST /sugerencias-ejercicio (mock)', dto);
      }
      await new Promise((r) => setTimeout(r, 600));
      return;
    }
    await apiFetch('/sugerencias-ejercicio/', {
      method: 'POST',
      data: dto,
    });
  },
};
