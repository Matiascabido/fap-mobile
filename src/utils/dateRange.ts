import { format } from 'date-fns';

/** Zona del gimnasio (APP_TIMEZONE en backend). */
const GYM_UTC_OFFSET = '-03:00';

/** ISO con offset — evita el bug del backend al comparar datetimes naive vs aware. */
export function toGymLocalDateTime(date: Date): string {
  return `${format(date, "yyyy-MM-dd'T'HH:mm:ss")}${GYM_UTC_OFFSET}`;
}

/**
 * Rango semanal para GET /turnos.
 * Incluye offset explícito para que el backend pueda comparar con `hoy` sin TypeError.
 */
export function weekRangeQueryParams(weekStart: Date, weekEnd: Date): {
  desde: string;
  hasta: string;
} {
  return {
    desde: `${format(weekStart, 'yyyy-MM-dd')}T00:00:00${GYM_UTC_OFFSET}`,
    hasta: `${format(weekEnd, 'yyyy-MM-dd')}T23:59:59${GYM_UTC_OFFSET}`,
  };
}

/** Combina día seleccionado con hora `HH:mm`. */
export function combineDayAndTime(day: Date, timeHHmm: string): Date {
  const [hh, mm] = timeHHmm.split(':').map((v) => parseInt(v, 10));
  const result = new Date(day);
  result.setHours(Number.isFinite(hh) ? hh : 0, Number.isFinite(mm) ? mm : 0, 0, 0);
  return result;
}
