import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';

export interface NuevoPlanSuscripcionData {
  nombre: string;
  precio: string;
}

interface NuevoPlanSuscripcionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: NuevoPlanSuscripcionData) => Promise<void>;
}

export default function NuevoPlanSuscripcionModal({
  visible,
  onClose,
  onSave,
}: NuevoPlanSuscripcionModalProps) {
  const { isDark } = useTheme();
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [saving, setSaving] = useState(false);

  const bgColor = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;
  const inputBg = isDark ? palette.slate800 : palette.slate50;

  useEffect(() => {
    if (!visible) {
      setNombre('');
      setPrecio('');
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    if (saving) return;
    setNombre('');
    setPrecio('');
    onClose();
  }, [saving, onClose]);

  const handleSave = async () => {
    const trimmedNombre = nombre.trim();
    if (!trimmedNombre || !precio) return;

    const capitalizedName =
      trimmedNombre.charAt(0).toUpperCase() + trimmedNombre.slice(1).toLowerCase();

    setSaving(true);
    try {
      await onSave({ nombre: capitalizedName, precio });
      setNombre('');
      setPrecio('');
    } catch {
      /* el padre muestra el error */
    } finally {
      setSaving(false);
    }
  };

  const canSave = Boolean(nombre.trim()) && Boolean(precio);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.sheet, { backgroundColor: bgColor }]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: palette.primary }]}>Nuevo plan</Text>
              <Text style={[styles.subtitle, { color: textSecondary }]}>
                Se agrega al catálogo de planes de suscripción
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} disabled={saving} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={22} color={textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: textSecondary }]}>NOMBRE DEL PLAN</Text>
          <TextInput
            style={[
              styles.input,
              { color: textPrimary, borderColor, backgroundColor: inputBg },
            ]}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej: Plan mensual"
            placeholderTextColor={textSecondary}
            editable={!saving}
            autoFocus
            returnKeyType="next"
          />

          <Text style={[styles.label, { color: textSecondary }]}>PRECIO</Text>
          <View style={[styles.precioWrap, { borderColor, backgroundColor: inputBg }]}>
            <Text style={[styles.precioPrefix, { color: textSecondary }]}>$</Text>
            <TextInput
              style={[styles.precioInput, { color: textPrimary }]}
              value={precio}
              onChangeText={(value) => {
                if (value === '' || /^\d+(\.\d+)?$/.test(value)) setPrecio(value);
              }}
              placeholder="Ej: 48500"
              placeholderTextColor={textSecondary}
              keyboardType="decimal-pad"
              editable={!saving}
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: inputBg }]}
              onPress={handleClose}
              disabled={saving}
            >
              <Text style={[styles.cancelBtnText, { color: textPrimary }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, (!canSave || saving) && styles.saveBtnDisabled]}
              onPress={() => void handleSave()}
              disabled={!canSave || saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveBtnText}>Guardar plan</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  precioWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  precioPrefix: { fontSize: 16, fontWeight: '700', marginRight: 4 },
  precioInput: { flex: 1, fontSize: 16, paddingVertical: 12 },
  footer: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelBtnText: { fontWeight: '700', fontSize: 15 },
  saveBtn: {
    flex: 1,
    backgroundColor: palette.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
