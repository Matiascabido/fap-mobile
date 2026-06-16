import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import type {
  EvaluacionCampo,
  LateralidadEvaluacion,
  PruebaFormValues,
  ValorFormState,
} from '../../types/evaluaciones.types';
import {
  buildCaptureSteps,
  firstIncompleteStepIndex,
  isStepComplete,
  type EvalCaptureStep,
} from '../../utils/evaluaciones/evalCaptureSteps';
import { computeLsiFromFormValues, formatLsiRatio } from '../../utils/evaluaciones/lsiCalc';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import Button from '../common/Button';
import DatePickerField from '../common/DatePickerField';

interface Props {
  campos: EvaluacionCampo[];
  values: PruebaFormValues;
  onChange: (campoId: string, value: ValorFormState) => void;
  errors: Record<string, string>;
  observaciones: string;
  onObservacionesChange: (v: string) => void;
  onSave: () => void;
  onOmitirPrueba: () => void;
  saving?: boolean;
  pruebaKey: string;
}

function readChoiceValue(
  step: Extract<EvalCaptureStep, { kind: 'choice' }>,
  values: PruebaFormValues
): string {
  const v = values[step.campoId];
  if (step.choiceKind === 'opcion' && v?.kind === 'opcion') return v.value;
  if (step.choiceKind === 'lateralidad' && v?.kind === 'lateralidad') return v.value;
  if (step.choiceKind === 'boolean' && v?.kind === 'boolean') {
    return v.value === true ? 'true' : v.value === false ? 'false' : '';
  }
  return '';
}

function writeChoiceValue(
  step: Extract<EvalCaptureStep, { kind: 'choice' }>,
  raw: string
): ValorFormState {
  if (step.choiceKind === 'opcion') return { kind: 'opcion', value: raw };
  if (step.choiceKind === 'lateralidad') {
    return { kind: 'lateralidad', value: raw as LateralidadEvaluacion };
  }
  return { kind: 'boolean', value: raw === 'true' };
}

function findCampoInTree(campos: EvaluacionCampo[], id: string): EvaluacionCampo | null {
  for (const c of campos) {
    if (c.id === id) return c;
    if (c.hijos?.length) {
      const f = findCampoInTree(c.hijos, id);
      if (f) return f;
    }
  }
  return null;
}

export default function EvaluacionCapturaGuiada({
  campos,
  values,
  onChange,
  errors,
  observaciones,
  onObservacionesChange,
  onSave,
  onOmitirPrueba,
  saving,
  pruebaKey,
}: Props) {
  const { isDark } = useTheme();
  const steps = buildCaptureSteps(campos);
  const [stepIndex, setStepIndex] = useState(0);
  const [skippedSteps, setSkippedSteps] = useState<Set<string>>(new Set());

  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const cardBg = isDark ? palette.darkCard : '#FFFFFF';
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

  const step = steps[stepIndex] ?? steps[0];
  const total = steps.length;
  const isLast = stepIndex >= total - 1;

  useEffect(() => {
    setStepIndex(0);
    setSkippedSteps(new Set());
  }, [pruebaKey]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setStepIndex(firstIncompleteStepIndex(steps, values, observaciones, campos, errors));
    }
  }, [errors, steps, values, observaciones, campos]);

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, total - 1));
  }, [total]);

  const goPrev = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const omitirPaso = useCallback(() => {
    if (step.kind === 'observaciones') {
      onSave();
      return;
    }
    setSkippedSteps((prev) => new Set(prev).add(step.id));
    if (!isLast) goNext();
  }, [step, isLast, goNext, onSave]);

  if (!step) return null;

  const stepError =
    step.kind === 'bilateral'
      ? errors[step.derId] || errors[step.izqId]
      : step.kind !== 'observaciones'
      ? errors[step.campoId]
      : undefined;

  const renderChoice = (s: Extract<EvalCaptureStep, { kind: 'choice' }>) => (
    <View style={styles.choiceGrid}>
      {s.options.map((opt) => {
        const selected = readChoiceValue(s, values) === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.choiceBtn,
              {
                borderColor: selected ? palette.primary : borderColor,
                backgroundColor: selected ? `${palette.primary}15` : cardBg,
              },
            ]}
            onPress={() => {
              onChange(s.campoId, writeChoiceValue(s, opt.value));
              if (!isLast) setTimeout(goNext, 150);
            }}
            disabled={saving}
          >
            <Text style={[styles.choiceText, { color: selected ? palette.primary : textPrimary }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderInput = () => {
    switch (step.kind) {
      case 'choice':
        return renderChoice(step);
      case 'numeric': {
        const v = values[step.campoId];
        return (
          <TextInput
            style={[styles.input, { color: textPrimary, borderColor, backgroundColor: cardBg }]}
            value={v?.kind === 'numerico' ? v.value : ''}
            onChangeText={(raw) => onChange(step.campoId, { kind: 'numerico', value: raw })}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={textSecondary}
            editable={!saving}
          />
        );
      }
      case 'bilateral': {
        const der = values[step.derId];
        const izq = values[step.izqId];
        const lsiCampo = findCampoInTree(campos, step.lsiId);
        const lsi =
          lsiCampo != null ? computeLsiFromFormValues(campos, lsiCampo, values) : null;
        return (
          <View style={styles.bilateralWrap}>
            <View style={styles.bilateralRow}>
              <View style={styles.bilateralCol}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Derecha</Text>
                <TextInput
                  style={[styles.input, { color: textPrimary, borderColor, backgroundColor: cardBg }]}
                  value={der?.kind === 'numerico' ? der.value : ''}
                  onChangeText={(raw) => onChange(step.derId, { kind: 'numerico', value: raw })}
                  keyboardType="decimal-pad"
                  editable={!saving}
                />
              </View>
              <View style={styles.bilateralCol}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Izquierda</Text>
                <TextInput
                  style={[styles.input, { color: textPrimary, borderColor, backgroundColor: cardBg }]}
                  value={izq?.kind === 'numerico' ? izq.value : ''}
                  onChangeText={(raw) => onChange(step.izqId, { kind: 'numerico', value: raw })}
                  keyboardType="decimal-pad"
                  editable={!saving}
                />
              </View>
            </View>
            <View style={[styles.lsiBox, { borderColor: `${palette.success}40` }]}>
              <Text style={[styles.fieldLabel, { color: palette.success }]}>LSI calculado</Text>
              <Text style={[styles.lsiValue, { color: palette.success }]}>{formatLsiRatio(lsi)}</Text>
            </View>
          </View>
        );
      }
      case 'fecha': {
        const v = values[step.campoId];
        return (
          <DatePickerField
            label=""
            value={v?.kind === 'fecha' ? v.value : ''}
            onChange={(ymd) => onChange(step.campoId, { kind: 'fecha', value: ymd })}
            variant="form"
          />
        );
      }
      case 'texto': {
        const v = values[step.campoId];
        const textVal = v?.kind === 'texto' ? v.value : '';
        return (
          <TextInput
            style={[
              styles.input,
              step.multiline && styles.textarea,
              { color: textPrimary, borderColor, backgroundColor: cardBg },
            ]}
            value={textVal}
            onChangeText={(t) => onChange(step.campoId, { kind: 'texto', value: t })}
            multiline={step.multiline}
            numberOfLines={step.multiline ? 3 : 1}
            editable={!saving}
          />
        );
      }
      case 'observaciones':
        return (
          <TextInput
            style={[
              styles.input,
              styles.textarea,
              { color: textPrimary, borderColor, backgroundColor: cardBg },
            ]}
            placeholder="Notas opcionales antes de guardar…"
            placeholderTextColor={textSecondary}
            value={observaciones}
            onChangeText={onObservacionesChange}
            multiline
            numberOfLines={3}
            editable={!saving}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.progressBar, { borderBottomColor: borderColor }]}>
        <Text style={[styles.progressText, { color: textSecondary }]}>
          Paso {stepIndex + 1} de {total}
        </Text>
        <View style={styles.dotsRow}>
          {steps.map((s, i) => {
            const done = isStepComplete(s, values, observaciones, campos);
            const skipped = skippedSteps.has(s.id);
            const active = i === stepIndex;
            return (
              <View
                key={s.id}
                style={[
                  styles.dot,
                  {
                    backgroundColor: active
                      ? palette.primary
                      : skipped
                      ? palette.warning
                      : done
                      ? palette.success
                      : isDark
                      ? palette.darkBorder
                      : '#E2E8F0',
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.section, { color: palette.primary }]}>{step.section}</Text>
        <Text style={[styles.title, { color: textPrimary }]}>
          {step.titulo}
          {'required' in step && step.required ? (
            <Text style={{ color: palette.primary }}> *</Text>
          ) : null}
        </Text>
        <View style={styles.inputWrap}>{renderInput()}</View>
        {stepError ? (
          <Text style={styles.errorText}>{stepError}</Text>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: borderColor }]}>
        {!isLast ? (
          <Button title="Siguiente" onPress={goNext} disabled={!!saving} loading={false} />
        ) : (
          <Button title={saving ? 'Guardando…' : 'Guardar prueba'} onPress={onSave} loading={!!saving} />
        )}
        <View style={styles.footerRow}>
          <Button title="Anterior" onPress={goPrev} variant="outline" disabled={stepIndex === 0 || !!saving} />
          {(!isLast || step.kind !== 'observaciones') && (
            <Button title="Omitir paso" onPress={omitirPaso} variant="gray" disabled={!!saving} />
          )}
        </View>
        <TouchableOpacity onPress={onOmitirPrueba} disabled={!!saving} style={styles.omitLink}>
          <Text style={[styles.omitText, { color: textSecondary }]}>Omitir prueba completa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minHeight: 360 },
  progressBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  progressText: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  dotsRow: { flexDirection: 'row', gap: 4 },
  dot: { flex: 1, height: 4, borderRadius: 2 },
  stepContent: { padding: 20, paddingBottom: 32 },
  section: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 26,
  },
  inputWrap: { marginTop: 24 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  textarea: { minHeight: 88, textAlign: 'left', fontSize: 15, fontWeight: '400' },
  choiceGrid: { gap: 10 },
  choiceBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  choiceText: { fontSize: 16, fontWeight: '700' },
  bilateralWrap: { gap: 16 },
  bilateralRow: { flexDirection: 'row', gap: 12 },
  bilateralCol: { flex: 1 },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
  lsiBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: `${palette.success}10`,
  },
  lsiValue: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  errorText: { color: palette.error, textAlign: 'center', marginTop: 12, fontSize: 14 },
  footer: { padding: 12, gap: 8, borderTopWidth: StyleSheet.hairlineWidth },
  footerRow: { flexDirection: 'row', gap: 8 },
  omitLink: { alignItems: 'center', paddingVertical: 8 },
  omitText: { fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
});
