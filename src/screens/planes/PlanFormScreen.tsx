import React, { useState, useEffect } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { planesService } from '../../services/api/planes.service';
import { PlanesStackParamList } from '../../navigation/types';
import { TipoPlan } from '../../types/planes.types';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';

type PlanFormRoute = RouteProp<PlanesStackParamList, 'PlanForm'>;

export default function PlanFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<PlanFormRoute>();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { planId, initialNombre, initialDescripcion, initialSemanas, initialObjetivo, initialTipoPlanId } =
    route.params;

  const isEdit = Boolean(planId);

  const [tipos, setTipos] = useState<TipoPlan[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [nombre, setNombre] = useState(initialNombre ?? '');
  const [descripcion, setDescripcion] = useState(initialDescripcion ?? '');
  const [semanas, setSemanas] = useState(initialSemanas != null ? String(initialSemanas) : '');
  const [objetivo, setObjetivo] = useState(initialObjetivo ?? '');
  const [tipoSel, setTipoSel] = useState(initialTipoPlanId ?? '');

  const bgColor = isDark ? palette.darkBg : palette.lightBg;
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

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

    setLoading(true);
    try {
      if (isEdit && planId) {
        await planesService.update(planId, {
          nombre_plan: nombre.trim(),
          descripcion: descripcion.trim() || null,
          semanas: semanas ? Number(semanas) : null,
          objetivo_semanal: objetivo.trim() || null,
          id_tipo_plan: tipoSel,
        });
        Alert.alert('Éxito', 'Plan actualizado.');
      } else {
        await planesService.create({
          numero: 1,
          nombre_plan: nombre.trim(),
          id_tipo_plan: tipoSel,
          descripcion: descripcion.trim() || null,
          semanas: semanas ? Number(semanas) : null,
          objetivo_semanal: objetivo.trim() || null,
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
    return <Loader fullscreen message="Cargando..." />;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: bgColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textPrimary }]}>
          {isEdit ? 'Editar plan' : 'Nuevo plan'}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Input label="Nombre del plan *" value={nombre} onChangeText={setNombre} icon="dumbbell" />
        <Input
          label="Descripción"
          value={descripcion}
          onChangeText={setDescripcion}
          icon="text"
          multiline
        />
        <Input
          label="Semanas"
          value={semanas}
          onChangeText={setSemanas}
          icon="calendar-range"
          keyboardType="numeric"
        />
        <Input label="Objetivo semanal" value={objetivo} onChangeText={setObjetivo} icon="target" />

        <Text style={[styles.fieldLabel, { color: textSecondary }]}>Tipo de plan *</Text>
        {tipos.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[
              styles.tipoItem,
              { borderColor: tipoSel === t.id ? palette.primary : borderColor },
              tipoSel === t.id && { backgroundColor: `${palette.primary}12` },
            ]}
            onPress={() => setTipoSel(t.id)}
          >
            <MaterialCommunityIcons
              name={tipoSel === t.id ? 'radiobox-marked' : 'radiobox-blank'}
              size={18}
              color={tipoSel === t.id ? palette.primary : textSecondary}
            />
            <Text style={[styles.tipoText, { color: textPrimary }]}>{t.nombre_tipo}</Text>
          </TouchableOpacity>
        ))}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button title={isEdit ? 'Guardar cambios' : 'Crear plan'} onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: { padding: 4 },
  title: { fontSize: 17, fontWeight: '600' },
  form: { padding: 16, paddingBottom: 40 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  tipoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  tipoText: { fontSize: 15 },
  errorText: { color: palette.error, fontSize: 13, marginBottom: 12, textAlign: 'center' },
});
