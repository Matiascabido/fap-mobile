import type {
  EvaluacionCampoResponse,
  PruebaFormValues,
} from '../../types/evaluaciones.types';
import { findPairForLsi, isDerechaCampo, isIzquierdaCampo } from './lsiCalc';
import {
  flattenCamposParaValidacion,
  isValorFilled,
  lateralidadOptionsFromCampo,
} from './evaluacionValores';

export type EvalCaptureStep =
  | {
      kind: 'choice';
      id: string;
      section: string;
      titulo: string;
      campoId: string;
      required: boolean;
      choiceKind: 'opcion' | 'lateralidad' | 'boolean';
      options: { value: string; label: string }[];
    }
  | {
      kind: 'numeric';
      id: string;
      section: string;
      titulo: string;
      campoId: string;
      required: boolean;
    }
  | {
      kind: 'bilateral';
      id: string;
      section: string;
      titulo: string;
      derId: string;
      izqId: string;
      lsiId: string;
      required: boolean;
    }
  | {
      kind: 'fecha' | 'texto';
      id: string;
      section: string;
      titulo: string;
      campoId: string;
      required: boolean;
      multiline?: boolean;
    }
  | {
      kind: 'observaciones';
      id: '__observaciones__';
      section: 'Cierre';
      titulo: 'Observaciones de la prueba';
    };

function isPartOfBilateralGroup(
  campo: EvaluacionCampoResponse,
  siblings: EvaluacionCampoResponse[],
  allCampos: EvaluacionCampoResponse[]
): boolean {
  if (campo.tipo_valor !== 'NUMERICO') return false;
  if (!isDerechaCampo(campo) && !isIzquierdaCampo(campo)) return false;

  for (const sibling of siblings) {
    if (sibling.tipo_valor !== 'LSI') continue;
    const pair = findPairForLsi(allCampos, sibling);
    if (!pair) continue;
    if (pair.der.id === campo.id || pair.izq.id === campo.id) return true;
  }
  return false;
}

function pushLeafSteps(
  steps: EvalCaptureStep[],
  campo: EvaluacionCampoResponse,
  section: string,
  allCampos: EvaluacionCampoResponse[],
  siblings: EvaluacionCampoResponse[]
) {
  const opciones = [...(campo.opciones ?? [])].sort((a, b) => a.orden - b.orden);

  if (campo.tipo_valor === 'LATERALIDAD') {
    steps.push({
      kind: 'choice',
      id: campo.id,
      section,
      titulo: campo.nombre,
      campoId: campo.id,
      required: campo.es_obligatorio,
      choiceKind: 'lateralidad',
      options: lateralidadOptionsFromCampo(campo).map((o) => ({
        value: o.value,
        label: o.label,
      })),
    });
    return;
  }

  if (opciones.length > 0) {
    steps.push({
      kind: 'choice',
      id: campo.id,
      section,
      titulo: campo.nombre,
      campoId: campo.id,
      required: campo.es_obligatorio,
      choiceKind: 'opcion',
      options: opciones.map((o) => ({ value: o.id, label: o.etiqueta || o.valor })),
    });
    return;
  }

  switch (campo.tipo_valor) {
    case 'BOOLEAN':
      steps.push({
        kind: 'choice',
        id: campo.id,
        section,
        titulo: campo.nombre,
        campoId: campo.id,
        required: campo.es_obligatorio,
        choiceKind: 'boolean',
        options: [
          { value: 'true', label: 'Sí' },
          { value: 'false', label: 'No' },
        ],
      });
      break;
    case 'LSI':
      break;
    case 'NUMERICO':
      if (!isPartOfBilateralGroup(campo, siblings, allCampos)) {
        steps.push({
          kind: 'numeric',
          id: campo.id,
          section,
          titulo: campo.nombre,
          campoId: campo.id,
          required: campo.es_obligatorio,
        });
      }
      break;
    case 'FECHA':
      steps.push({
        kind: 'fecha',
        id: campo.id,
        section,
        titulo: campo.nombre,
        campoId: campo.id,
        required: campo.es_obligatorio,
      });
      break;
    case 'TEXTO':
    default: {
      const multiline =
        campo.codigo.toLowerCase().includes('obs') ||
        campo.nombre.toLowerCase().includes('observ');
      steps.push({
        kind: 'texto',
        id: campo.id,
        section,
        titulo: campo.nombre,
        campoId: campo.id,
        required: campo.es_obligatorio,
        multiline,
      });
    }
  }
}

function tituloForBilateral(
  section: string,
  der: EvaluacionCampoResponse,
  izq: EvaluacionCampoResponse
): string {
  if (isDerechaCampo(der) && isIzquierdaCampo(izq)) return section;
  const fromDer = der.nombre.replace(/\s*derecha\s*/i, '').trim();
  return fromDer || section;
}

/** Registra pasos bilaterales (Der + Izq + LSI) y devuelve ids ya consumidos. */
function pushBilateralSteps(
  steps: EvalCaptureStep[],
  sorted: EvaluacionCampoResponse[],
  section: string,
  allCampos: EvaluacionCampoResponse[]
): Set<string> {
  const consumed = new Set<string>();

  for (const hijo of sorted) {
    if (hijo.tipo_valor !== 'LSI') continue;
    const pair = findPairForLsi(allCampos, hijo, consumed);
    if (!pair) continue;
    if (consumed.has(pair.der.id) || consumed.has(pair.izq.id)) continue;
    if (!sorted.some((c) => c.id === pair.der.id)) continue;
    if (!sorted.some((c) => c.id === pair.izq.id)) continue;

    consumed.add(hijo.id);
    consumed.add(pair.der.id);
    consumed.add(pair.izq.id);

    steps.push({
      kind: 'bilateral',
      id: `bilateral-${hijo.id}`,
      section,
      titulo: tituloForBilateral(section, pair.der, pair.izq),
      derId: pair.der.id,
      izqId: pair.izq.id,
      lsiId: hijo.id,
      required: pair.der.es_obligatorio || pair.izq.es_obligatorio,
    });
  }

  return consumed;
}

function walkHijos(
  steps: EvalCaptureStep[],
  hijos: EvaluacionCampoResponse[],
  section: string,
  allCampos: EvaluacionCampoResponse[]
) {
  const sorted = [...hijos].sort((a, b) => a.orden - b.orden);
  const consumed = pushBilateralSteps(steps, sorted, section, allCampos);

  for (const hijo of sorted) {
    if (consumed.has(hijo.id)) continue;

    if (hijo.tipo_valor === 'CONTENEDOR') {
      walkHijos(steps, hijo.hijos ?? [], hijo.nombre, allCampos);
      continue;
    }

    if (hijo.tipo_valor === 'LSI') continue;

    pushLeafSteps(steps, hijo, section, allCampos, sorted);
  }
}

/** Convierte el árbol de campos en pasos lineales para captura guiada. */
export function buildCaptureSteps(campos: EvaluacionCampoResponse[]): EvalCaptureStep[] {
  const steps: EvalCaptureStep[] = [];
  const sorted = [...campos].sort((a, b) => a.orden - b.orden);

  for (const campo of sorted) {
    if (campo.tipo_valor === 'CONTENEDOR') {
      walkHijos(steps, campo.hijos ?? [], campo.nombre, campos);
    } else {
      pushLeafSteps(steps, campo, 'General', campos, sorted);
    }
  }

  steps.push({
    kind: 'observaciones',
    id: '__observaciones__',
    section: 'Cierre',
    titulo: 'Observaciones de la prueba',
  });

  return steps;
}

export function isStepComplete(
  step: EvalCaptureStep,
  values: PruebaFormValues,
  observaciones: string,
  campos: EvaluacionCampoResponse[]
): boolean {
  if (step.kind === 'observaciones') return true;

  if (step.kind === 'bilateral') {
    const der = findCampoById(campos, step.derId);
    const izq = findCampoById(campos, step.izqId);
    if (!der || !izq) return true;
    if (!step.required) return true;
    return isValorFilled(der, values[step.derId]) && isValorFilled(izq, values[step.izqId]);
  }

  const campo = findCampoById(campos, step.campoId);
  if (!campo) return true;
  if (!step.required) return true;
  return isValorFilled(campo, values[step.campoId]);
}

function findCampoById(
  campos: EvaluacionCampoResponse[],
  id: string
): EvaluacionCampoResponse | null {
  for (const c of campos) {
    if (c.id === id) return c;
    if (c.hijos?.length) {
      const found = findCampoById(c.hijos, id);
      if (found) return found;
    }
  }
  return null;
}

export function firstIncompleteStepIndex(
  steps: EvalCaptureStep[],
  values: PruebaFormValues,
  observaciones: string,
  campos: EvaluacionCampoResponse[],
  errors: Record<string, string>
): number {
  if (Object.keys(errors).length > 0) {
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      if (s.kind === 'bilateral') {
        if (errors[s.derId] || errors[s.izqId]) return i;
      } else if (s.kind !== 'observaciones' && errors[s.campoId]) {
        return i;
      }
    }
  }
  for (let i = 0; i < steps.length; i++) {
    if (!isStepComplete(steps[i], values, observaciones, campos)) return i;
  }
  return steps.length - 1;
}

export type CaptureStepsAuditIssue = {
  code: 'duplicate_lateral' | 'missing_bilateral' | 'duplicate_bilateral';
  message: string;
};

/** Detecta Der/Izq duplicados como pasos sueltos y bilaterales sin par. */
export function auditCaptureSteps(
  campos: EvaluacionCampoResponse[],
  label = 'prueba'
): CaptureStepsAuditIssue[] {
  const steps = buildCaptureSteps(campos);
  const issues: CaptureStepsAuditIssue[] = [];
  const numericIds = new Set<string>();
  const bilateralFieldIds = new Set<string>();
  const bilateralCountByLsi = new Map<string, number>();

  for (const step of steps) {
    if (step.kind === 'numeric') numericIds.add(step.campoId);
    if (step.kind === 'bilateral') {
      bilateralFieldIds.add(step.derId);
      bilateralFieldIds.add(step.izqId);
      bilateralCountByLsi.set(step.lsiId, (bilateralCountByLsi.get(step.lsiId) ?? 0) + 1);
    }
  }

  for (const fieldId of bilateralFieldIds) {
    if (numericIds.has(fieldId)) {
      issues.push({
        code: 'duplicate_lateral',
        message: `[${label}] El campo ${fieldId} aparece como paso numérico y en un paso bilateral`,
      });
    }
  }

  for (const campo of flattenCamposParaValidacion(campos)) {
    if (campo.tipo_valor !== 'LSI') continue;
    const count = bilateralCountByLsi.get(campo.id) ?? 0;
    if (count === 0) {
      issues.push({
        code: 'missing_bilateral',
        message: `[${label}] LSI "${campo.nombre}" no tiene paso bilateral`,
      });
    } else if (count > 1) {
      issues.push({
        code: 'duplicate_bilateral',
        message: `[${label}] LSI "${campo.nombre}" generó ${count} pasos bilaterales`,
      });
    }
  }

  return issues;
}
