import { format } from 'date-fns';

/** ISO local sin `Z` — el backend interpreta en zona horaria del gimnasio (POST turnos). */
export function toGymLocalDateTime(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
}

/**
 * Rango semanal para GET /turnos.
 * Solo fecha (YYYY-MM-DD) evita el bug del backend al comparar datetimes naive vs aware.
 */
export function weekRangeQueryParams(weekStart: Date, weekEnd: Date): {
  desde: string;
  hasta: string;
} {
  return {
    desde: format(weekStart, 'yyyy-MM-dd'),
    hasta: format(weekEnd, 'yyyy-MM-dd'),
  };
}

/** Combina día seleccionado con hora `HH:mm`. */
export function combineDayAndTime(day: Date, timeHHmm: string): Date {
  const [hh, mm] = timeHHmm.split(':').map((v) => parseInt(v, 10));
  const result = new Date(day);
  result.setHours(Number.isFinite(hh) ? hh : 0, Number.isFinite(mm) ? mm : 0, 0, 0);
  return result;
}
