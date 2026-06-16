import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import GroupedSection from '../../components/common/GroupedSection';
import { planesService, CreateTipoPlanDTO } from '../../services/api/planes.service';
import NuevoTipoPlanModal from '../../components/planes/NuevoTipoPlanModal';
import { PlanesStackParamList } from '../../navigation/types';
import { TipoPlan } from '../../types/planes.types';
import { useAppTheme } from '../../context/ThemeContext';
import { typography } from '../../theme/iosTheme';
import { palette } from '../../constants/colors';
import { DIAS_SEMANA_PLAN } from '../../utils/planDiasSemana';

type PlanFormRoute = RouteProp<PlanesStackParamList, 'PlanForm'>;

function diasEntrenoIniciales(): boolean[] {
  return [true, false, false, false, false, false, false];
}

function contarDiasSeleccionados(dias: boolean[]): number {
  return dias.reduce((n, v) => n + (v ? 1 : 0), 0);
}

export default function PlanFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<PlanFormRoute>();
  const { colors } = useAppTheme();
  const {
    planId,
    initialNombre,
    initialDescripcion,
    initialSemanas,
    initialObjetivo,
    initialObservaciones,
    initialNumero,
    initialTipoPlanId,
  } = route.params;

  const isEdit = Boolean(planId);

  const [tipos, setTipos] = useState<TipoPlan[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [nombre, setNombre] = useState(initialNombre ?? '');
  const [descripcion, setDescripcion] = useState(initialDescripcion ?? '');
  const [semanas, setSemanas] = useState(initialSemanas != null ? String(initialSemanas) : '4');
  const [objetivo, setObjetivo] = useState(initialObjetivo ?? '');
  const [observaciones, setObservaciones] = useState(initialObservaciones ?? '');
  const [tipoSel, setTipoSel] = useState(initialTipoPlanId ?? '');
  const [showNuevoTipo, setShowNuevoTipo] = useState(false);
  const [diasEntreno, setDiasEntreno] = useState<boolean[]>(() => {
    const n = initialNumero ?? 1;
    const dias = diasEntrenoIniciales();
    for (let i = 0; i < Math.min(n, 7); i += 1) dias[i] = true;
    return dias;
  });

  const frecuenciaSemanal = useMemo(() => contarDiasSeleccionados(diasEntreno), [diasEntreno]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEdit ? 'Editar plan' : 'Nuevo plan',
    });
  }, [navigation, isEdit]);

  useEffect(() => {
    planesService
      .getTipos()
      .then((t) => {
        setTipos(t);
        if (!tipoSel && t[0]?.id) setTipoSel(t[0].id);
      })
      .catch(() => setError('No se pudieron cargar los tipos de plan.'))
      .finally(() => setLoadingMeta(false));
  }, []);

  const toggleDia = (index: number) => {
    setDiasEntreno((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      if (contarDiasSeleccionados(next) === 0) next[index] = true;
      return next;
    });
  };

  const handleSaveNuevoTipo = async (body: CreateTipoPlanDTO) => {
    try {
      const created = await planesService.createTipoPlan(body);
      setTipos((prev) =>
        prev.some((t) => t.id === created.id) ? prev : [...prev, created]
      );
      setTipoSel(created.id);
      setShowNuevoTipo(false);
      Alert.alert('Éxito', 'Tipo de plan creado.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo crear el tipo de plan.');
      throw err;
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!nombre.trim()) {
      setError('El nombre del plan es obligatorio.');
      return;
    }
    if (!tipoSel) {
      setError('Seleccioná un tipo de plan.');
      return;
    }
    if (frecuenciaSemanal < 1) {
      setError('Marcá al menos un día de entrenamiento por semana.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nombre_plan: nombre.trim(),
        descripcion: descripcion.trim() || null,
        semanas: semanas ? Number(semanas) : null,
        objetivo_semanal: objetivo.trim() || null,
        observaciones: observaciones.trim() || null,
        id_tipo_plan: tipoSel,
        numero: frecuenciaSemanal,
      };

      if (isEdit && planId) {
        await planesService.update(planId, payload);
        Alert.alert('Éxito', 'Plan actualizado.');
      } else {
        await planesService.create({
          ...payload,
          numero: frecuenciaSemanal,
        });
        Alert.alert('Éxito', 'Plan creado. Podés agregar bloques y ejercicios desde el detalle.');
      }
      navigation.goBack();
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar el plan.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingMeta) {
    return <Loader fullscreen message="Preparando formulario..." />;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.groupedBackground }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={[styles.intro, { color: colors.secondaryLabel }]}>
          {isEdit
            ? 'Actualizá los datos generales del plan de entrenamiento.'
            : 'Completá los datos para crear un nuevo plan. Después podés agregar bloques y ejercicios.'}
        </Text>

        <GroupedSection title="Datos del plan">
          <View style={styles.sectionBody}>
            <Input label="Nombre del plan *" value={nombre} onChangeText={setNombre} icon="dumbbell" />
            <Input
              label="Descripción"
              value={descripcion}
              onChangeText={setDescripcion}
              icon="text"
              multiline
            />
            <Input
              label="Duración (semanas)"
              value={semanas}
              onChangeText={setSemanas}
              icon="calendar-range"
              keyboardType="numeric"
            />
          </View>
        </GroupedSection>

        <GroupedSection
          title="Frecuencia semanal"
          footer={`${frecuenciaSemanal}× por semana — igual que en la web, el conteo de días marcados define la frecuencia del plan.`}
        >
          <View style={styles.diasRow}>
            {DIAS_SEMANA_PLAN.map((d, i) => {
              const active = diasEntreno[i];
              return (
                <TouchableOpacity
                  key={d.index}
                  style={[
                    styles.diaChip,
                    {
                      backgroundColor: active ? palette.primary : colors.tertiaryGroupedBackground,
                      borderColor: active ? palette.primary : colors.separator,
                    },
                  ]}
                  onPress={() => toggleDia(i)}
                  accessibilityLabel={d.title}
                >
                  <Text
                    style={[
                      styles.diaChipLabel,
                      { color: active ? '#FFFFFF' : colors.secondaryLabel },
                    ]}
                  >
                    {d.label}
                  </Text>
                  <Text
                    style={[
                      styles.diaChipSub,
                      { color: active ? 'rgba(255,255,255,0.85)' : colors.tertiaryLabel },
                    ]}
                  >
                    {d.title.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GroupedSection>

        <GroupedSection title="Objetivo y notas">
          <View style={styles.sectionBody}>
            <Input label="Objetivo semanal" value={objetivo} onChangeText={setObjetivo} icon="target" />
            <Input
              label="Observaciones"
              value={observaciones}
              onChangeText={setObservaciones}
              icon="note-text-outline"
              multiline
            />
          </View>
        </GroupedSection>

        <GroupedSection title="Tipo de plan *">
          <View style={styles.tipoList}>
            {tipos.length === 0 ? (
              <Text style={[styles.tipoEmpty, { color: colors.secondaryLabel }]}>
                No hay tipos cargados. Creá uno nuevo para continuar.
              </Text>
            ) : (
              tipos.map((t, index) => {
                const selected = tipoSel === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.tipoItem,
                      index < tipos.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.separator,
                      },
                      selected && { backgroundColor: `${colors.tint}10` },
                    ]}
                    onPress={() => setTipoSel(t.id)}
                  >
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={selected ? colors.tint : colors.tertiaryLabel}
                    />
                    <Text style={[styles.tipoText, typography.body, { color: colors.label }]}>
                      {t.nombre_tipo}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
            <TouchableOpacity
              style={[styles.nuevoTipoBtn, { borderTopColor: colors.separator }]}
              onPress={() => setShowNuevoTipo(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.tint} />
              <Text style={[styles.nuevoTipoText, { color: colors.tint }]}>Nuevo tipo de plan</Text>
            </TouchableOpacity>
          </View>
        </GroupedSection>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title={isEdit ? 'Guardar cambios' : 'Crear plan'}
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
        />
      </ScrollView>

      <NuevoTipoPlanModal
        visible={showNuevoTipo}
        onClose={() => setShowNuevoTipo(false)}
        onSave={handleSaveNuevoTipo}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { padding: 16, paddingBottom: 40 },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    marginHorizontal: 4,
    fontWeight: '500',
  },
  sectionBody: {
    padding: 12,
    gap: 4,
  },
  diasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    justifyContent: 'space-between',
  },
  diaChip: {
    width: '13%',
    minWidth: 40,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  diaChipLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  diaChipSub: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  tipoList: {},
  tipoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tipoText: { flex: 1 },
  tipoEmpty: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    lineHeight: 20,
  },
  nuevoTipoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  nuevoTipoText: { fontSize: 16, fontWeight: '600' },
  errorText: {
    color: palette.error,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  submitBtn: { marginTop: 8 },
});
