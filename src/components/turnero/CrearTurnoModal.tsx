import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { turneroService } from '../../services/api/turnero.service';
import { combineDayAndTime, toGymLocalDateTime } from '../../utils/dateRange';
import TimePickerField from '../../components/common/TimePickerField';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';

interface CrearTurnoModalProps {
  visible: boolean;
  selectedDay: Date;
  onClose: () => void;
  onCreated: () => void;
}

export default function CrearTurnoModal({
  visible,
  selectedDay,
  onClose,
  onCreated,
}: CrearTurnoModalProps) {
  const { isDark } = useTheme();
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [hora, setHora] = useState('09:00');
  const [duracion, setDuracion] = useState('60');
  const [cupos, setCupos] = useState('10');
  const [loading, setLoading] = useState(false);

  const bgColor = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

  const reset = () => {
    setTitulo('');
    setDescripcion('');
    setHora('09:00');
    setDuracion('60');
    setCupos('10');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (!titulo.trim()) {
      Alert.alert('Error', 'Ingresá un título para la clase.');
      return;
    }
    const cuposNum = parseInt(cupos, 10);
    const duracionNum = parseInt(duracion, 10);
    if (!Number.isFinite(cuposNum) || cuposNum < 1) {
      Alert.alert('Error', 'Los cupos deben ser al menos 1.');
      return;
    }
    if (!Number.isFinite(duracionNum) || duracionNum < 1) {
      Alert.alert('Error', 'La duración debe ser al menos 1 minuto.');
      return;
    }

    setLoading(true);
    try {
      const inicio = combineDayAndTime(selectedDay, hora);
      await turneroService.create({
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        cupos_maximos: cuposNum,
        fecha_hora_inicio: toGymLocalDateTime(inicio),
        duracion_minutos: duracionNum,
      });
      Alert.alert('Éxito', 'Clase creada correctamente.');
      handleClose();
      onCreated();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo crear la clase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: bgColor }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: textPrimary }]}>Nueva clase</Text>
            <TouchableOpacity onPress={handleClose}>
              <MaterialCommunityIcons name="close" size={24} color={textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={[styles.label, { color: textSecondary }]}>Título *</Text>
            <TextInput
              style={[styles.input, { borderColor, color: textPrimary }]}
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Ej: Funcional matutino"
              placeholderTextColor={textSecondary}
            />

            <Text style={[styles.label, { color: textSecondary }]}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline, { borderColor, color: textPrimary }]}
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Opcional"
              placeholderTextColor={textSecondary}
              multiline
            />

            <TimePickerField
              label="Hora de inicio *"
              value={hora}
              onChange={setHora}
              placeholder="Elegí la hora de inicio"
            />

            <Text style={[styles.label, { color: textSecondary }]}>Duración (minutos) *</Text>
            <TextInput
              style={[styles.input, { borderColor, color: textPrimary }]}
              value={duracion}
              onChangeText={setDuracion}
              keyboardType="numeric"
            />

            <Text style={[styles.label, { color: textSecondary }]}>Cupos máximos *</Text>
            <TextInput
              style={[styles.input, { borderColor, color: textPrimary }]}
              value={cupos}
              onChangeText={setCupos}
              keyboardType="numeric"
            />
          </ScrollView>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>Crear clase</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  submitBtn: {
    marginTop: 16,
    backgroundColor: palette.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
