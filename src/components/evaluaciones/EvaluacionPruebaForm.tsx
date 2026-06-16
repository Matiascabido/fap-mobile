import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type {
  EvaluacionPruebaDetalle,
  EvaluacionRegistroResponse,
  PruebaFormValues,
  ValorFormState,
} from '../../types/evaluaciones.types';
import type { PruebaConSeccion } from '../../utils/evaluaciones/pruebaOrdering';
import { evaluacionesService } from '../../services/api/evaluaciones.service';
import {
  buildValoresPayload,
  mergeDraftValues,
  validatePruebaCampos,
} from '../../utils/evaluaciones/evaluacionValores';
import { draftStorageKey, readDraft, writeDraft } from '../../utils/evaluaciones/registrosTimeline';
import { normalizeCamposTree } from '../../utils/evaluaciones/campoTree';
import EvaluacionCapturaGuiada from './EvaluacionCapturaGuiada';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import Card from '../common/Card';
import { formatDate } from '../../utils/formatters';

interface Props {
  prueba: PruebaConSeccion;
  socioId: string;
  fechaEvaluacion: string;
  grupoId: string;
  camposCache: Map<string, EvaluacionPruebaDetalle>;
  onCacheCampos: (id: string, data: EvaluacionPruebaDetalle) => void;
  ultimoRegistro: EvaluacionRegistroResponse | null;
  observaciones: string;
  onObservacionesChange: (v: string) => void;
  onSave: (payload: {
    valores: ReturnType<typeof buildValoresPayload>;
    observaciones: string;
  }) => Promise<void>;
  onOmitir: () => void;
  saving?: boolean;
}

function normalizeDetalle(data: EvaluacionPruebaDetalle): EvaluacionPruebaDetalle {
  return { ...data, campos: normalizeCamposTree(data.campos ?? []) };
}

export default function EvaluacionPruebaForm({
  prueba,
  socioId,
  fechaEvaluacion,
  grupoId,
  camposCache,
  onCacheCampos,
  ultimoRegistro,
  observaciones,
  onObservacionesChange,
  onSave,
  onOmitir,
  saving,
}: Props) {
  const { isDark } = useTheme();
  const [detalle, setDetalle] = useState<EvaluacionPruebaDetalle | null>(
    () => camposCache.get(prueba.id) ?? null
  );
  const [loading, setLoading] = useState(!camposCache.has(prueba.id));
  const [values, setValues] = useState<PruebaFormValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;

  const draftKey = draftStorageKey(socioId, fechaEvaluacion, grupoId, prueba.id);
  const pruebaKey = `${prueba.id}-${fechaEvaluacion}-${draftKey}`;

  useEffect(() => {
    let cancelled = false;
    const cached = camposCache.get(prueba.id);
    if (cached) {
      setDetalle(normalizeDetalle(cached));
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    void evaluacionesService
      .getCamposPrueba(prueba.id)
      .then((data) => {
        if (cancelled) return;
        const normalized = normalizeDetalle(data);
        onCacheCampos(prueba.id, normalized);
        setDetalle(normalized);
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : 'Error al cargar campos');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [prueba.id, camposCache, onCacheCampos]);

  useEffect(() => {
    if (!detalle) return;
    const draft = readDraft(draftKey) as PruebaFormValues | null;
    if (draft && typeof draft === 'object') {
      setValues(mergeDraftValues(detalle.campos ?? [], draft));
    } else {
      setValues(mergeDraftValues(detalle.campos ?? [], null));
    }
    setErrors({});
  }, [detalle, draftKey, prueba.id]);

  const handleChange = useCallback(
    (campoId: string, value: ValorFormState) => {
      setValues((prev) => {
        const next = { ...prev, [campoId]: value };
        writeDraft(draftKey, next);
        return next;
      });
      setErrors((prev) => {
        if (!prev[campoId]) return prev;
        const next = { ...prev };
        delete next[campoId];
        return next;
      });
    },
    [draftKey]
  );

  const handleSave = useCallback(async () => {
    if (!detalle) return;
    const validation = validatePruebaCampos(detalle.campos ?? [], values);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setErrors({});
    await onSave({
      valores: buildValoresPayload(detalle.campos ?? [], values),
      observaciones,
    });
  }, [detalle, values, observaciones, onSave]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  if (loadError || !detalle) {
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorMsg}>{loadError ?? 'No se pudieron cargar los campos'}</Text>
      </View>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.seccion, { color: palette.primary }]}>{prueba.seccionNombre}</Text>
        <Text style={[styles.nombre, { color: textPrimary }]}>{prueba.nombre}</Text>
        {ultimoRegistro ? (
          <Text style={[styles.ultimo, { color: textSecondary }]}>
            Última medición · {formatDate(ultimoRegistro.fecha_evaluacion)}
          </Text>
        ) : null}
      </View>
      <EvaluacionCapturaGuiada
        pruebaKey={pruebaKey}
        campos={detalle.campos ?? []}
        values={values}
        onChange={handleChange}
        errors={errors}
        observaciones={observaciones}
        onObservacionesChange={onObservacionesChange}
        onSave={() => void handleSave()}
        onOmitirPrueba={onOmitir}
        saving={saving}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', padding: 0 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0' },
  seccion: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  nombre: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  ultimo: { fontSize: 12, marginTop: 6 },
  loader: { paddingVertical: 48, alignItems: 'center' },
  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.error,
    backgroundColor: `${palette.error}10`,
    padding: 16,
  },
  errorMsg: { color: palette.error, fontSize: 14 },
});
