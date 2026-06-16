import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import { CreateTipoPlanDTO } from '../../services/api/planes.service';

interface NuevoTipoPlanModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: CreateTipoPlanDTO) => Promise<void>;
}

export default function NuevoTipoPlanModal({ visible, onClose, onSave }: NuevoTipoPlanModalProps) {
  const { colors } = useAppTheme();
  const [nombreTipo, setNombreTipo] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) setNombreTipo('');
  }, [visible]);

  const handleClose = () => {
    if (saving) return;
    setNombreTipo('');
    onClose();
  };

  const handleSave = async () => {
    const t = nombreTipo.trim();
    if (!t) return;
    setSaving(true);
    try {
      await onSave({ nombre_tipo: t });
      setNombreTipo('');
    } catch {
      /* el padre muestra el error */
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.sheet, { backgroundColor: colors.secondaryGroupedBackground }]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: palette.primary }]}>Nuevo tipo de plan</Text>
              <Text style={[styles.subtitle, { color: colors.secondaryLabel }]}>
                Se guarda en el catálogo para usarlo en este y otros planes.
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} disabled={saving} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.secondaryLabel} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.secondaryLabel }]}>NOMBRE DEL TIPO</Text>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.label,
                borderColor: colors.separator,
                backgroundColor: colors.groupedBackground,
              },
            ]}
            value={nombreTipo}
            onChangeText={setNombreTipo}
            placeholder="Ej: Demo funcional"
            placeholderTextColor={colors.tertiaryLabel}
            editable={!saving}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => void handleSave()}
          />

          <TouchableOpacity
            style={[styles.saveBtn, (!nombreTipo.trim() || saving) && styles.saveBtnDisabled]}
            onPress={() => void handleSave()}
            disabled={!nombreTipo.trim() || saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveBtnText}>Guardar tipo</Text>
            )}
          </TouchableOpacity>
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
  saveBtn: {
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
