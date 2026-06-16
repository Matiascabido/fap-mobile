import type {
  EvaluacionCampo,
  EvaluacionRegistroResponse,
  EvaluacionRegistroResumen,
  EvaluacionValorResponse,
} from '../../types/evaluaciones.types';
import { formatCampoValorForDetalle } from './evaluacionValores';
import {
  computeLsiFromCamposPair,
  computeLsiFromRegistro,
  findPairForLsi,
  formatLsiRatio,
  isDerechaCampo,
  isIzquierdaCampo,
} from './lsiCalc';
import type { HistorialGrupoEvaluacion } from './registrosTimeline';
import { palette } from '../../constants/colors';

export interface EvolucionColumna {
  numeroSesion: number;
  fecha: string;
  created_date?: string | null;
  registro: EvaluacionRegistroResumen;
  isLatest: boolean;
}

export interface EvolucionFila {
  id: string;
  section: string;
  label: string;
  kind: 'simple' | 'bilateral';
  derId?: string;
  izqId?: string;
  lsiId?: string;
  campoId?: string;
}

export interface EvolucionCelda {
  texto: string;
  colorKey: string;
}

const LATERALIDAD_COLOR_KEYS = new Set(['izquierda', 'derecha', 'bilateral', 'no']);

export interface CeldaColorStyle {
  backgroundColor: string;
  borderColor: string;
  color: string;
}

export function getEvolucionColumnasForPrueba(
  grupo: HistorialGrupoEvaluacion,
  pruebaId: string
): EvolucionColumna[] {
  const cronologico = [...grupo.sesiones].sort((a, b) => a.numeroSesion - b.numeroSesion);
  const total = cronologico[0]?.totalSesionesGrupo ?? cronologico.length;

  return cronologico
    .map((sesion) => {
      const prueba = sesion.pruebas.find((p) => p.pruebaId === pruebaId);
      if (!prueba) return null;
      const col: EvolucionColumna = {
        numeroSesion: sesion.numeroSesion,
        fecha: prueba.registro.fecha_evaluacion,
        created_date: prueba.registro.created_date ?? null,
        registro: prueba.registro,
        isLatest: sesion.numeroSesion === total,
      };
      return col;
    })
    .filter((c): c is EvolucionColumna => c != null);
}

export function listPruebasEvolucionEnGrupo(grupo: HistorialGrupoEvaluacion): {
  pruebaId: string;
  nombre: string;
  seccionNombre: string;
  sesiones: number;
}[] {
  const map = new Map<string, { nombre: string; seccionNombre: string; sesiones: number }>();

  for (const sesion of grupo.sesiones) {
    for (const p of sesion.pruebas) {
      const prev = map.get(p.pruebaId);
      map.set(p.pruebaId, {
        nombre: p.nombre,
        seccionNombre: p.seccionNombre,
        sesiones: (prev?.sesiones ?? 0) + 1,
      });
    }
  }

  return [...map.entries()]
    .map(([pruebaId, meta]) => ({ pruebaId, ...meta }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

function valorMap(registro: EvaluacionRegistroResponse): Map<string, EvaluacionValorResponse> {
  return new Map((registro.valores ?? []).map((v) => [v.id_campo, v]));
}

export function evalValorColorKey(texto: string, campo?: EvaluacionCampo): string {
  if (campo?.tipo_valor === 'LATERALIDAD') {
    const v = texto.trim().toLowerCase();
    if (v === 'izquierda' || v === 'i' || v === 'izq') return 'izquierda';
    if (v === 'derecha' || v === 'd' || v === 'der') return 'derecha';
    if (v === 'bilateral' || v === 'bi' || v === 'b') return 'bilateral';
    if (v === 'no' || v === 'n') return 'no';
  }
  const t = texto.trim().toLowerCase();
  if (t === 'sí' || t === 'si') return 'boolean-si';
  if (t === 'no') return 'boolean-no';
  return texto.trim() || '—';
}

function colorKeyFromText(texto: string, campo?: EvaluacionCampo): string {
  return evalValorColorKey(texto, campo);
}

function readSimpleCelda(
  campo: EvaluacionCampo,
  campos: EvaluacionCampo[],
  registro: EvaluacionRegistroResponse,
  map: Map<string, EvaluacionValorResponse>
): EvolucionCelda {
  const v = map.get(campo.id);
  const texto = formatCampoValorForDetalle(campo, v, campos, registro);
  return { texto, colorKey: colorKeyFromText(texto, campo) };
}

function readBilateralCelda(
  fila: EvolucionFila,
  campos: EvaluacionCampo[],
  registro: EvaluacionRegistroResponse,
  map: Map<string, EvaluacionValorResponse>
): EvolucionCelda {
  const partes = readBilateralCeldaPartes(fila, campos, registro, map);
  if (!partes) return { texto: '—', colorKey: '—' };

  const lsiTxt = partes.lsi?.texto;
  const texto = lsiTxt
    ? `D ${partes.der.texto} · I ${partes.izq.texto} · LSI ${lsiTxt}`
    : `D ${partes.der.texto} · I ${partes.izq.texto}`;
  return {
    texto,
    colorKey: lsiTxt
      ? `lsi:${lsiTxt}|d:${partes.der.texto}|i:${partes.izq.texto}`
      : `d:${partes.der.texto}|i:${partes.izq.texto}`,
  };
}

export function readEvolucionCelda(
  fila: EvolucionFila,
  campos: EvaluacionCampo[],
  registro: EvaluacionRegistroResponse
): EvolucionCelda {
  const map = valorMap(registro);
  if (fila.kind === 'bilateral') return readBilateralCelda(fila, campos, registro, map);
  const campo = fila.campoId ? findCampoById(campos, fila.campoId) : null;
  if (!campo) return { texto: '—', colorKey: '—' };
  return readSimpleCelda(campo, campos, registro, map);
}

export function readBilateralCeldaPartes(
  fila: EvolucionFila,
  campos: EvaluacionCampo[],
  registro: EvaluacionRegistroResponse,
  map?: Map<string, EvaluacionValorResponse>
) {
  const valores = map ?? valorMap(registro);
  const der = fila.derId ? findCampoById(campos, fila.derId) : undefined;
  const izq = fila.izqId ? findCampoById(campos, fila.izqId) : undefined;
  const lsiCampo = fila.lsiId ? findCampoById(campos, fila.lsiId) : undefined;

  if (!der || !izq) return null;

  const derTxt = formatCampoValorForDetalle(der, valores.get(der.id), campos, registro);
  const izqTxt = formatCampoValorForDetalle(izq, valores.get(izq.id), campos, registro);

  let lsi: EvolucionCelda | undefined;
  if (lsiCampo) {
    let lsiTxt = '—';
    const fromField = computeLsiFromRegistro(campos, lsiCampo, registro);
    if (fromField != null) lsiTxt = formatLsiRatio(fromField);
    else {
      const fromPair = computeLsiFromCamposPair(registro, der, izq);
      if (fromPair != null) lsiTxt = formatLsiRatio(fromPair);
    }
    if (lsiTxt !== '—') {
      lsi = { texto: lsiTxt, colorKey: 'lsi' };
    }
  }

  return {
    der: { texto: derTxt, colorKey: colorKeyFromText(derTxt, der) },
    izq: { texto: izqTxt, colorKey: colorKeyFromText(izqTxt, izq) },
    lsi,
  };
}

function findCampoById(campos: EvaluacionCampo[], id: string): EvaluacionCampo | null {
  for (const c of campos) {
    if (c.id === id) return c;
    if (c.hijos?.length) {
      const f = findCampoById(c.hijos, id);
      if (f) return f;
    }
  }
  return null;
}

function collectFilasFromHijos(
  hijos: EvaluacionCampo[],
  campos: EvaluacionCampo[],
  section: string,
  rendered: Set<string>
): EvolucionFila[] {
  const sorted = [...hijos].sort((a, b) => a.orden - b.orden);
  const out: EvolucionFila[] = [];

  for (const hijo of sorted) {
    if (rendered.has(hijo.id)) continue;

    if (hijo.tipo_valor === 'LSI') {
      const pair = findPairForLsi(campos, hijo, rendered);
      if (
        pair &&
        sorted.some((c) => c.id === pair.der.id) &&
        sorted.some((c) => c.id === pair.izq.id)
      ) {
        rendered.add(hijo.id);
        rendered.add(pair.der.id);
        rendered.add(pair.izq.id);
        const titulo =
          pair.der.nombre.replace(/\s*derecha\s*/i, '').trim() ||
          pair.izq.nombre.replace(/\s*izquierda\s*/i, '').trim() ||
          'Medición';
        out.push({
          id: `b-${hijo.id}`,
          section,
          label: titulo,
          kind: 'bilateral',
          derId: pair.der.id,
          izqId: pair.izq.id,
          lsiId: hijo.id,
        });
        continue;
      }
    }

    if (hijo.tipo_valor === 'CONTENEDOR') {
      const sub = [...(hijo.hijos ?? [])].sort((a, b) => a.orden - b.orden);
      const der = sub.find((c) => isDerechaCampo(c));
      const izq = sub.find((c) => isIzquierdaCampo(c));
      const lsi = sub.find((c) => c.tipo_valor === 'LSI');
      if (der && izq) {
        rendered.add(der.id);
        rendered.add(izq.id);
        if (lsi) rendered.add(lsi.id);
        out.push({
          id: hijo.id,
          section: section ? `${section} · ${hijo.nombre}` : hijo.nombre,
          label: hijo.nombre,
          kind: 'bilateral',
          derId: der.id,
          izqId: izq.id,
          lsiId: lsi?.id,
        });
        continue;
      }
      if (sub.length > 0) {
        out.push(...collectFilasFromHijos(sub, campos, hijo.nombre, rendered));
        continue;
      }
    }

    if (isDerechaCampo(hijo)) {
      const izq = sorted.find((c) => isIzquierdaCampo(c) && !rendered.has(c.id));
      if (izq) {
        const lsi = sorted.find((c) => {
          if (c.tipo_valor !== 'LSI' || rendered.has(c.id)) return false;
          const pair = findPairForLsi(campos, c, rendered);
          return pair?.der.id === hijo.id && pair?.izq.id === izq.id;
        });
        rendered.add(hijo.id);
        rendered.add(izq.id);
        if (lsi) rendered.add(lsi.id);
        out.push({
          id: `p-${hijo.id}`,
          section,
          label: 'Medición bilateral',
          kind: 'bilateral',
          derId: hijo.id,
          izqId: izq.id,
          lsiId: lsi?.id,
        });
        continue;
      }
    }

    if (isIzquierdaCampo(hijo) || hijo.tipo_valor === 'LSI') continue;

    out.push({
      id: hijo.id,
      section,
      label: hijo.nombre,
      kind: 'simple',
      campoId: hijo.id,
    });
  }

  return out;
}

export function buildEvolucionFilas(campos: EvaluacionCampo[]): EvolucionFila[] {
  const sorted = [...campos].sort((a, b) => a.orden - b.orden);
  const rendered = new Set<string>();
  const out: EvolucionFila[] = [];

  for (const campo of sorted) {
    if (campo.tipo_valor === 'CONTENEDOR') {
      out.push(...collectFilasFromHijos(campo.hijos ?? [], campos, campo.nombre, rendered));
    } else {
      out.push(...collectFilasFromHijos([campo], campos, 'General', rendered));
    }
  }

  return out;
}

export function evolucionCeldaColors(colorKey: string, isDark: boolean): CeldaColorStyle {
  if (LATERALIDAD_COLOR_KEYS.has(colorKey)) {
    switch (colorKey) {
      case 'izquierda':
        return {
          backgroundColor: isDark ? 'rgba(14, 165, 233, 0.2)' : 'rgba(14, 165, 233, 0.12)',
          borderColor: isDark ? '#0284C7' : '#7DD3FC',
          color: isDark ? '#BAE6FD' : '#0C4A6E',
        };
      case 'derecha':
        return {
          backgroundColor: isDark ? 'rgba(244, 63, 94, 0.2)' : 'rgba(244, 63, 94, 0.12)',
          borderColor: isDark ? '#E11D48' : '#FDA4AF',
          color: isDark ? '#FECDD3' : '#881337',
        };
      case 'bilateral':
        return {
          backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.12)',
          borderColor: isDark ? '#7C3AED' : '#C4B5FD',
          color: isDark ? '#DDD6FE' : '#4C1D95',
        };
      case 'no':
        return {
          backgroundColor: isDark ? palette.slate800 : 'rgba(100, 116, 139, 0.1)',
          borderColor: isDark ? palette.slate600 : palette.slate300,
          color: isDark ? palette.darkTextPrimary : palette.slate700,
        };
    }
  }
  if (colorKey === 'boolean-si') {
    return {
      backgroundColor: isDark ? 'rgba(220, 38, 38, 0.2)' : 'rgba(220, 38, 38, 0.12)',
      borderColor: isDark ? palette.primary : '#FCA5A5',
      color: isDark ? '#FECACA' : palette.primaryDark,
    };
  }
  if (colorKey === 'boolean-no') {
    return {
      backgroundColor: isDark ? palette.slate800 : 'rgba(100, 116, 139, 0.1)',
      borderColor: isDark ? palette.slate600 : palette.slate300,
      color: isDark ? palette.darkTextSecondary : palette.slate600,
    };
  }
  if (colorKey === 'lsi' || colorKey.startsWith('lsi:')) {
    return {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
      borderColor: isDark ? '#059669' : '#6EE7B7',
      color: isDark ? '#A7F3D0' : '#064E3B',
    };
  }
  return {
    backgroundColor: isDark ? palette.slate800 : '#FFFFFF',
    borderColor: isDark ? palette.slate600 : palette.slate200,
    color: isDark ? palette.darkTextPrimary : palette.slate800,
  };
}
