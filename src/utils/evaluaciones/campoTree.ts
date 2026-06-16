import type { EvaluacionCampoResponse } from '../../types/evaluaciones.types';

function sortCampos(list: EvaluacionCampoResponse[]): EvaluacionCampoResponse[] {
  return [...list].sort((a, b) => a.orden - b.orden);
}

function isUuidString(v: unknown): v is string {
  return typeof v === 'string' && v.length >= 32;
}

function isCombinedNombre(nombre: string): boolean {
  return /\s+y\s+/i.test(nombre.trim());
}

/** Aplana nodos anidados en una lista única por id. */
function collectAllNodes(
  raw: EvaluacionCampoResponse[],
  byId: Map<string, EvaluacionCampoResponse> = new Map()
): Map<string, EvaluacionCampoResponse> {
  for (const c of raw) {
    if (!byId.has(c.id)) {
      byId.set(c.id, c);
    }
    const hijos = c.hijos ?? [];
    if (hijos.length === 0) continue;

    const first = hijos[0] as unknown;
    if (isUuidString(first)) continue;

    collectAllNodes(hijos as EvaluacionCampoResponse[], byId);
  }
  return byId;
}

function childIdsFromNodes(nodes: Iterable<EvaluacionCampoResponse>): Set<string> {
  const childIds = new Set<string>();
  for (const c of nodes) {
    const hijos = c.hijos ?? [];
    if (hijos.length === 0) continue;
    const first = hijos[0] as unknown;
    if (isUuidString(first)) {
      for (const id of hijos as unknown as string[]) childIds.add(id);
    } else {
      for (const h of hijos as EvaluacionCampoResponse[]) childIds.add(h.id);
    }
  }
  return childIds;
}

/** Resuelve `hijos` cuando vienen como ids (string) en lugar de objetos anidados. */
function resolveHijosRefs(
  campo: EvaluacionCampoResponse,
  byId: Map<string, EvaluacionCampoResponse>,
  visiting: Set<string>
): EvaluacionCampoResponse {
  const rawHijos = campo.hijos ?? [];
  if (rawHijos.length === 0) return { ...campo, hijos: [] };

  const first = rawHijos[0] as unknown;
  if (isUuidString(first)) {
    const hijos = (rawHijos as unknown as string[])
      .map((id) => byId.get(id))
      .filter((c): c is EvaluacionCampoResponse => !!c && !visiting.has(c.id))
      .map((h) => {
        visiting.add(h.id);
        const resolved = resolveHijosRefs(h, byId, visiting);
        visiting.delete(h.id);
        return resolved;
      });
    return { ...campo, hijos: sortCampos(hijos) };
  }

  return {
    ...campo,
    hijos: sortCampos(
      (rawHijos as EvaluacionCampoResponse[]).map((h) => resolveHijosRefs(h, byId, visiting))
    ),
  };
}

/** Arma árbol desde lista plana usando `id_padre` (evita duplicar hijos en raíz). */
function buildTreeFromPadre(flat: EvaluacionCampoResponse[]): EvaluacionCampoResponse[] {
  const byId = new Map(flat.map((c) => [c.id, { ...c, hijos: [] as EvaluacionCampoResponse[] }]));
  const roots: EvaluacionCampoResponse[] = [];

  for (const c of sortCampos(flat)) {
    const node = byId.get(c.id)!;
    if (c.id_padre && byId.has(c.id_padre)) {
      byId.get(c.id_padre)!.hijos!.push(node);
    } else {
      roots.push(node);
    }
  }

  return sortRecursive(roots);
}

function sortRecursive(nodes: EvaluacionCampoResponse[]): EvaluacionCampoResponse[] {
  return sortCampos(nodes).map((n) => ({
    ...n,
    hijos: n.hijos?.length ? sortRecursive(n.hijos) : [],
  }));
}

/**
 * Desenvuelve contenedores cuyo nombre agrupa dos campos reales
 * (ej. "Hacia adentro y hacia fuera" con hijos separados).
 */
function unwrapCompositeContainers(nodes: EvaluacionCampoResponse[]): EvaluacionCampoResponse[] {
  const out: EvaluacionCampoResponse[] = [];

  for (const node of nodes) {
    const hijos = unwrapCompositeContainers(node.hijos ?? []);

    if (
      node.tipo_valor === 'CONTENEDOR' &&
      isCombinedNombre(node.nombre) &&
      hijos.length >= 2 &&
      hijos.every((h) => h.tipo_valor !== 'CONTENEDOR')
    ) {
      out.push(...hijos);
      continue;
    }

    out.push({ ...node, hijos });
  }

  return sortCampos(out);
}

function postProcessTree(nodes: EvaluacionCampoResponse[]): EvaluacionCampoResponse[] {
  return unwrapCompositeContainers(sortRecursive(nodes));
}

/**
 * Normaliza la respuesta de campos del backend a un árbol consistente
 * (sin duplicados ni hijos perdidos).
 */
export function normalizeCamposTree(raw: EvaluacionCampoResponse[]): EvaluacionCampoResponse[] {
  if (!raw.length) return [];

  const nestedById = collectAllNodes(raw);
  const allFlat = [...nestedById.values()].map((c) => ({
    ...c,
    hijos: [] as EvaluacionCampoResponse[],
  }));

  const hasPadre = allFlat.some((c) => c.id_padre);
  if (hasPadre) {
    return postProcessTree(buildTreeFromPadre(allFlat));
  }

  const byId = new Map(allFlat.map((c) => [c.id, c]));
  const childIds = childIdsFromNodes(nestedById.values());
  const roots = sortCampos(allFlat.filter((c) => !childIds.has(c.id)));
  const resolved = roots.map((c) => {
    const source = nestedById.get(c.id) ?? c;
    return resolveHijosRefs({ ...source, hijos: source.hijos ?? [] }, byId, new Set());
  });

  return postProcessTree(resolved);
}

export function normalizePruebaDetalleCampos(detalle: {
  campos?: EvaluacionCampoResponse[];
}): EvaluacionCampoResponse[] {
  return normalizeCamposTree(detalle.campos ?? []);
}
