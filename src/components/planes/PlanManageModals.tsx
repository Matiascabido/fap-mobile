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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { planesService } from '../../services/api/planes.service';
import { ejerciciosService, EjercicioCatalogo } from '../../services/api/ejercicios.service';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';

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
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState(COLORES[0]);
  const [diaSemana, setDiaSemana] = useState(0);
  const [loading, setLoading] = useState(false);

  const bgColor = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

  const reset = () => {
    setNombre('');
    setColor(COLORES[0]);
    setDiaSemana(0);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'Ingresá un nombre para el bloque.');
      return;
    }
    setLoading(true);
    try {
      await planesService.addBloque(planId, {
        nombre: nombre.trim(),
        color,
        dia_semana: diaSemana,
      });
      Alert.alert('Éxito', 'Bloque agregado.');
      handleClose();
      onSaved();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo agregar el bloque.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: bgColor }]}>
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
            <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.submitText}>Agregar bloque</Text>
              )}
            </TouchableOpacity>
          </View>
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
  const [ejercicios, setEjercicios] = useState<EjercicioCatalogo[]>([]);
  const [search, setSearch] = useState('');
  const [sel, setSel] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [loading, setLoading] = useState(false);

  const bgColor = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

  useEffect(() => {
    if (visible) {
      setLoadingList(true);
      ejerciciosService
        .getAll()
        .then(setEjercicios)
        .catch(() => setEjercicios([]))
        .finally(() => setLoadingList(false));
    } else {
      setSearch('');
      setSel('');
    }
  }, [visible]);

  const filtered = ejercicios.filter((e) =>
    e.nombre.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleSave = async () => {
    if (!sel) {
      Alert.alert('Error', 'Seleccioná un ejercicio.');
      return;
    }
    setLoading(true);
    try {
      await planesService.addEjercicioToBloque(planId, planBloqueId, sel);
      Alert.alert('Éxito', 'Ejercicio agregado al bloque.');
      onClose();
      onSaved();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo agregar el ejercicio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: bgColor, maxHeight: '80%' }]}>
          <Text style={[styles.sheetTitle, { color: textPrimary }]}>
            Agregar ejercicio{bloqueNombre ? ` · ${bloqueNombre}` : ''}
          </Text>

          <TextInput
            style={[styles.input, { borderColor, color: textPrimary, marginBottom: 8 }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar ejercicio..."
            placeholderTextColor={textSecondary}
          />

          {loadingList ? (
            <ActivityIndicator color={palette.primary} style={{ marginVertical: 24 }} />
          ) : (
            <ScrollView style={{ maxHeight: 280 }}>
              {filtered.map((e) => (
                <TouchableOpacity
                  key={e.id}
                  style={[
                    styles.selectorItem,
                    { borderColor: sel === e.id ? palette.primary : borderColor },
                    sel === e.id && { backgroundColor: `${palette.primary}12` },
                  ]}
                  onPress={() => setSel(e.id)}
                >
                  <MaterialCommunityIcons
                    name={sel === e.id ? 'radiobox-marked' : 'radiobox-blank'}
                    size={18}
                    color={sel === e.id ? palette.primary : textSecondary}
                  />
                  <Text style={[styles.selectorText, { color: textPrimary }]}>{e.nombre}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Text style={{ color: textSecondary }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.submitText}>Agregar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  selectorText: { fontSize: 15, flex: 1 },
});
