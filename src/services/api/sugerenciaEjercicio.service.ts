import { apiFetch } from './http';

export interface SugerenciaEjercicioDTO {
  nombre: string;
  descripcion: string;
  grupo_muscular: string;
  grupo_otro?: string;
  url_youtube?: string;
}

/** Mock activo: no llama al backend real */
const SUGERENCIA_EJERCICIO_MOCK = true;

export const sugerenciaEjercicioService = {
  async enviar(dto: SugerenciaEjercicioDTO): Promise<void> {
    if (SUGERENCIA_EJERCICIO_MOCK) {
      await new Promise((r) => setTimeout(r, 600));
      return;
    }
    await apiFetch('/sugerencias-ejercicio/', {
      method: 'POST',
      data: dto,
    });
  },
};
