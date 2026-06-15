import { endOfDay, format, startOfDay } from 'date-fns';

/** ISO local sin `Z` — el backend interpreta en zona horaria del gimnasio. */
export function toGymLocalDateTime(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
}

export function weekRangeQueryParams(weekStart: Date, weekEnd: Date): {
  desde: string;
  hasta: string;
} {
  return {
    desde: toGymLocalDateTime(startOfDay(weekStart)),
    hasta: toGymLocalDateTime(endOfDay(weekEnd)),
  };
}

/** Combina día seleccionado con hora `HH:mm`. */
export function combineDayAndTime(day: Date, timeHHmm: string): Date {
  const [hh, mm] = timeHHmm.split(':').map((v) => parseInt(v, 10));
  const result = new Date(day);
  result.setHours(Number.isFinite(hh) ? hh : 0, Number.isFinite(mm) ? mm : 0, 0, 0);
  return result;
}
