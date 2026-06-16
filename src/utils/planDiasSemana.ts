import { Bloque, PlanWithRelations } from '../types/planes.types';
import { normalizeBloques, bloquesFromRelations } from './planBloques';
import { getDiaSemanaLabel } from './planBlockColors';

export type PlanBloquesPorDiaGrupo<T = Bloque> = {
  dia_semana?: number | null;
  dia_semana_nombre?: string | null;
  bloques: T[];
};

export const DIAS_SEMANA_PLAN: { index: number; label: string; title: string }[] = [
  { index: 0, label: 'L', title: 'Lunes' },
  { index: 1, label: 'M', title: 'Martes' },
  { index: 2, label: 'Mi', title: 'Miércoles' },
  { index: 3, label: 'J', title: 'Jueves' },
  { index: 4, label: 'V', title: 'Viernes' },
  { index: 5, label: 'S', title: 'Sábado' },
  { index: 6, label: 'D', title: 'Domingo' },
];

export function normalizeDiaSemana(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  return i >= 0 && i <= 6 ? i : null;
}

export function tituloGrupoDiaSemana(
  dia: number | null | undefined,
  nombreApi?: string | null
): string {
  const fromApi = typeof nombreApi === 'string' ? nombreApi.trim() : '';
  if (fromApi) return fromApi.charAt(0).toUpperCase() + fromApi.slice(1);
  const label = getDiaSemanaLabel(dia ?? null);
  if (label) return label;
  return 'Sin día asignado';
}

export function groupItemsPorDiaSemana<T>(
  items: T[],
  getDia: (item: T) => number | null | undefined
): PlanBloquesPorDiaGrupo<T>[] {
  const byDay = new Map<number | null, T[]>();
  for (const item of items) {
    const dia = getDia(item) ?? null;
    const list = byDay.get(dia);
    if (list) list.push(item);
    else byDay.set(dia, [item]);
  }

  const out: PlanBloquesPorDiaGrupo<T>[] = [];
  for (let d = 0; d < 7; d += 1) {
    const bloques = byDay.get(d);
    if (!bloques?.length) continue;
    out.push({
      dia_semana: d,
      dia_semana_nombre: getDiaSemanaLabel(d),
      bloques,
    });
  }
  const sinDia = byDay.get(null);
  if (sinDia?.length) {
    out.push({
      dia_semana: null,
      dia_semana_nombre: null,
      bloques: sinDia,
    });
  }
  return out;
}

export function planTieneAgrupacionPorDia(bloques: Bloque[]): boolean {
  const keys = new Set<number | 'none'>();
  for (const b of bloques) {
    keys.add(b.dia_semana == null ? 'none' : b.dia_semana);
  }
  return keys.size > 1;
}

export function planMostrarAgrupacionPorDia(
  bloquesPorDiaApi: PlanBloquesPorDiaGrupo<unknown>[] | null | undefined,
  bloques: Bloque[]
): boolean {
  if (Array.isArray(bloquesPorDiaApi)) {
    const conBloques = bloquesPorDiaApi.filter((g) => (g.bloques?.length ?? 0) > 0);
    if (conBloques.length > 1) return true;
  }
  return planTieneAgrupacionPorDia(bloques);
}

/** Agrupa bloques por día (API `bloques_por_dia` o agrupación local). */
export function resolveBloquesAgrupados(planData: PlanWithRelations): PlanBloquesPorDiaGrupo<Bloque>[] {
  const flat = normalizeBloques(planData);
  const api = planData.bloques_por_dia;

  if (planMostrarAgrupacionPorDia(api, flat) && api?.length) {
    const groups: PlanBloquesPorDiaGrupo<Bloque>[] = [];
    for (const g of api) {
      if (!g.bloques?.length) continue;
      groups.push({
        dia_semana: g.dia_semana ?? null,
        dia_semana_nombre: g.dia_semana_nombre ?? null,
        bloques: bloquesFromRelations(g.bloques, g.dia_semana),
      });
    }
    if (groups.length > 0) return groups;
  }

  if (!planTieneAgrupacionPorDia(flat)) {
    return [{ dia_semana: null, dia_semana_nombre: null, bloques: flat }];
  }

  return groupItemsPorDiaSemana(flat, (b) => b.dia_semana);
}

export function diaGrupoKey(dia: number | null | undefined): string {
  return dia == null ? 'sin-dia' : String(dia);
}
