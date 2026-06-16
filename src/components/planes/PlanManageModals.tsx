import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { planesService } from '../../services/api/planes.service';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import {
  pickPlanBloqueIdsFromApiPayload,
  normalizeBloques,
  referencePlanBloqueId,
} from '../../utils/planBloques';
import { EjercicioModeloPicker } from './EjercicioModeloPicker';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const COLORES = ['#DC2626', '#2563EB', '#16A34A', '#CA8A04', '#9333EA', '#0891B2'];

interface AddBloqueModalProps {
  visible: boolean;
  planId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function AddBloqueModal({ visible, planId, onClose, onSaved }: AddBloqueModalProps) {
  const { isDark } = useTheme();
  const [step, setStep] = useState<'bloque' | 'ejercicio'>('bloque');
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState(COLORES[0]);
  const [diaSemana, setDiaSemana] = useState(0);
  const [loading, setLoading] = useState(false);
  const [planBloqueId, setPlanBloqueId] = useState('');
  const [bloqueNombre, setBloqueNombre] = useState('');

  const bgColor = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

  const reset = () => {
    setStep('bloque');
    setNombre('');
    setColor(COLORES[0]);
    setDiaSemana(0);
    setPlanBloqueId('');
    setBloqueNombre('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const rollbackBloque = async () => {
    if (planBloqueId) {
      try {
        await planesService.removeBloque(planId, planBloqueId);
      } catch {
        /* el bloque puede haberse eliminado ya */
      }
    }
    handleClose();
    onSaved();
  };

  useEffect(() => {
    if (!visible) reset();
  }, [visible]);

  const resolvePlanBloqueLinkAfterCreate = async (
    created: unknown,
    bloqueNombreHint: string,
    dia: number
  ): Promise<string | null> => {
    const { idPlanBloque, idBloque } = pickPlanBloqueIdsFromApiPayload(created);
    if (idPlanBloque && idBloque && idPlanBloque !== idBloque) {
      return idPlanBloque;
    }

    try {
      const plan = await planesService.getById(planId);
      if (plan) {
        const bloques = normalizeBloques(plan);
        const matches = bloques.filter(
          (b) =>
            b.nombre.trim().toLowerCase() === bloqueNombreHint.trim().toLowerCase() &&
            (b.dia_semana ?? null) === dia
        );
        const candidate = matches[matches.length - 1] ?? bloques[bloques.length - 1];
        const ref = candidate ? referencePlanBloqueId(candidate) : null;
        if (ref) return ref;
      }
    } catch {
      /* usar id del POST si falla el GET */
    }

    return idPlanBloque;
  };

  const handleCreateBloque = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'Ingresá un nombre para el bloque.');
      return;
    }
    setLoading(true);
    try {
      const created = await planesService.addBloque(planId, {
        nombre: nombre.trim(),
        color,
        dia_semana: diaSemana,
      });
      const linkId = await resolvePlanBloqueLinkAfterCreate(created, nombre.trim(), diaSemana);
      if (!linkId) {
        Alert.alert(
          'Bloque creado',
          'No se pudo obtener el id del bloque. Recargá el plan y agregá el ejercicio manualmente.'
        );
        handleClose();
        onSaved();
        return;
      }
      setPlanBloqueId(linkId);
      setBloqueNombre(nombre.trim());
      setStep('ejercicio');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo agregar el bloque.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: bgColor, maxHeight: step === 'ejercicio' ? '92%' : undefined },
          ]}
        >
          {step === 'bloque' ? (
            <>
              <Text style={[styles.sheetTitle, { color: textPrimary }]}>Nuevo bloque</Text>

              <Text style={[styles.label, { color: textSecondary }]}>Nombre *</Text>
              <TextInput
                style={[styles.input, { borderColor, color: textPrimary }]}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Ej: Piernas"
                placeholderTextColor={textSecondary}
              />

              <Text style={[styles.label, { color: textSecondary }]}>Día</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                {DIAS.map((dia, idx) => (
                  <TouchableOpacity
                    key={dia}
                    style={[
                      styles.chip,
                      { borderColor: diaSemana === idx ? palette.primary : borderColor },
                      diaSemana === idx && { backgroundColor: `${palette.primary}15` },
                    ]}
                    onPress={() => setDiaSemana(idx)}
                  >
                    <Text style={{ color: diaSemana === idx ? palette.primary : textPrimary, fontSize: 13 }}>
                      {dia.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.label, { color: textSecondary }]}>Color</Text>
              <View style={styles.colorsRow}>
                {COLORES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSel]}
                    onPress={() => setColor(c)}
                  />
                ))}
              </View>

              <View style={styles.footer}>
                <TouchableOpacity onPress={handleClose} disabled={loading}>
                  <Text style={{ color: textSecondary }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handleCreateBloque} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.submitText}>Siguiente: ejercicio</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <EjercicioModeloPicker
              planId={planId}
              planBloqueId={planBloqueId}
              bloqueNombre={bloqueNombre}
              required
              onCancel={rollbackBloque}
              onSaved={() => {
                handleClose();
                onSaved();
              }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface AddEjercicioModalProps {
  visible: boolean;
  planId: string;
  planBloqueId: string;
  bloqueNombre?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function AddEjercicioModal({
  visible,
  planId,
  planBloqueId,
  bloqueNombre,
  onClose,
  onSaved,
}: AddEjercicioModalProps) {
  const { isDark } = useTheme();
  const bgColor = isDark ? palette.darkCard : '#FFFFFF';

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.overlay, Platform.OS === 'ios' && { justifyContent: 'flex-end' }]}
      >
        <View style={[styles.sheet, { backgroundColor: bgColor, maxHeight: '92%' }]}>
          <EjercicioModeloPicker
            planId={planId}
            planBloqueId={planBloqueId}
            bloqueNombre={bloqueNombre}
            onCancel={onClose}
            onSaved={() => {
              onClose();
              onSaved();
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 28 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  chipsRow: { marginBottom: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  colorsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotSel: { borderWidth: 3, borderColor: '#0f172a' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtn: {
    backgroundColor: palette.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  submitText: { color: '#FFF', fontWeight: '700' },
});
