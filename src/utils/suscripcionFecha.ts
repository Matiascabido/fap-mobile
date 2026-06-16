import { SuscripcionData } from '../types/suscripciones.types';

/** Extrae la fecha de vencimiento aceptando alias del API */
export function fechaVencimientoSuscripcion(s: SuscripcionData | Record<string, unknown>): string | null {
  const o = s as Record<string, unknown>;
  const candidates = [
    o.fecha_vencimiento,
    o.fechaVencimiento,
    o.vencimiento,
    (o.suscripcion_detalle as Record<string, unknown> | undefined)?.fecha_vencimiento,
  ];
  for (const c of candidates) {
    if (c == null) continue;
    const str = String(c).trim();
    if (str) return str;
  }
  return null;
}
