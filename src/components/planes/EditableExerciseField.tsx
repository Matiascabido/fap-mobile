import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { ejerciciosService } from '../../services/api/ejercicios.service';
import { palette } from '../../constants/colors';
import { EjercicioPatchField, FIELD_MAX } from '../../utils/ejercicioEditFields';
import { hapticSelection } from '../../utils/haptics';

interface EditableExerciseFieldProps {
  label: string;
  value: string;
  fieldName: EjercicioPatchField;
  ejercicioId: string | null;
  editable?: boolean;
  multiline?: boolean;
  placeholder?: string;
  isLast?: boolean;
  editingKey: string | null;
  onEditStart: (key: string) => void;
  onEditEnd: () => void;
  onSaved: () => void;
}

export default function EditableExerciseField({
  label,
  value,
  fieldName,
  ejercicioId,
  editable = true,
  multiline = false,
  placeholder = 'Sin valor',
  isLast = false,
  editingKey,
  onEditStart,
  onEditEnd,
  onSaved,
}: EditableExerciseFieldProps) {
  const { colors } = useAppTheme();
  const [tempValue, setTempValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const fieldKey = `${ejercicioId}-${fieldName}`;
  const isEditing = editingKey === fieldKey;
  const isBlocked = editingKey != null && editingKey !== fieldKey;

  useEffect(() => {
    if (!isEditing) setTempValue(value);
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (!editable || !ejercicioId || isBlocked) return;
    hapticSelection();
    setTempValue(value);
    onEditStart(fieldKey);
  };

  const handleCancel = () => {
    setTempValue(value);
    onEditEnd();
  };

  const handleSave = async () => {
    if (!ejercicioId) return;
    const trimmed = tempValue.trim();
    if (trimmed === value.trim()) {
      onEditEnd();
      return;
    }

    setSaving(true);
    try {
      await ejerciciosService.update(ejercicioId, { [fieldName]: trimmed || null });
      onEditEnd();
      onSaved();
    } catch (err: any) {
      Alert.alert('Error', err?.message || `No se pudo actualizar ${label.toLowerCase()}.`);
    } finally {
      setSaving(false);
    }
  };

  const displayValue = value.trim() || placeholder;
  const isPlaceholder = !value.trim();

  return (
    <View
      style={[
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
      ]}
    >
      <Text style={[styles.label, { color: colors.secondaryLabel }]}>{label}</Text>

      {isEditing ? (
        <View style={styles.editWrap}>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              multiline && styles.inputMultiline,
              {
                color: colors.label,
                borderColor: colors.separator,
                backgroundColor: colors.secondaryGroupedBackground,
              },
            ]}
            value={tempValue}
            onChangeText={(t) => setTempValue(t.slice(0, FIELD_MAX))}
            multiline={multiline}
            editable={!saving}
            placeholder={placeholder}
            placeholderTextColor={colors.tertiaryLabel}
            returnKeyType={multiline ? 'default' : 'done'}
            onSubmitEditing={() => !multiline && void handleSave()}
          />
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleCancel}
              disabled={saving}
              style={[styles.actionBtn, { backgroundColor: 'rgba(255,59,48,0.12)' }]}
            >
              <Ionicons name="close" size={18} color={palette.error} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => void handleSave()}
              disabled={saving}
              style={[styles.actionBtn, { backgroundColor: 'rgba(52,199,89,0.12)' }]}
            >
              {saving ? (
                <ActivityIndicator size="small" color={palette.success} />
              ) : (
                <Ionicons name="checkmark" size={18} color={palette.success} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.valueRow}
          onPress={handleStartEdit}
          disabled={!editable || !ejercicioId || isBlocked}
          activeOpacity={editable && ejercicioId ? 0.65 : 1}
        >
          <Text
            style={[
              styles.value,
              { color: isPlaceholder ? colors.tertiaryLabel : colors.label },
              multiline && styles.valueMultiline,
            ]}
          >
            {displayValue}
          </Text>
          {editable && ejercicioId && !isBlocked ? (
            <Ionicons name="pencil" size={16} color={colors.tint} style={styles.editIcon} />
          ) : null}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minHeight: Platform.OS === 'ios' ? 22 : 24,
  },
  value: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
  },
  valueMultiline: {
    lineHeight: 24,
  },
  editIcon: {
    marginTop: 2,
  },
  editWrap: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 17,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
