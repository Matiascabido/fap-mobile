import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import { capitalize, parseIsoDateString, toIsoDateString } from '../../utils/formatters';

interface DatePickerFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  placeholder?: string;
  /** 'form' alinea el estilo con Input; 'modal' usa etiqueta en mayúsculas */
  variant?: 'form' | 'modal';
  /** Permite quitar la fecha seleccionada (campos opcionales) */
  clearable?: boolean;
}

export default function DatePickerField({
  label,
  value,
  onChange,
  error,
  hint,
  minimumDate,
  maximumDate,
  placeholder = 'Seleccionar fecha',
  variant = 'modal',
  clearable = false,
}: DatePickerFieldProps) {
  const { isDark } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [draftDate, setDraftDate] = useState(new Date());

  const parsed = parseIsoDateString(value);

  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const inputBg =
    variant === 'form'
      ? isDark
        ? palette.darkBg
        : '#FFFFFF'
      : isDark
        ? palette.slate800
        : palette.slate50;
  const labelColor =
    variant === 'form' ? textPrimary : textSecondary;
  const borderColor = error
    ? palette.error
    : isDark
      ? palette.darkBorder
      : palette.lightBorder;

  const displayText = useMemo(() => {
    if (!parsed) return placeholder;
    return capitalize(format(parsed, "EEEE d 'de' MMMM yyyy", { locale: es }));
  }, [parsed, placeholder]);

  const openPicker = () => {
    setDraftDate(parsed ?? minimumDate ?? new Date());
    setShowPicker(true);
  };

  const handleAndroidChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowPicker(false);
    if (event.type === 'set' && selected) {
      onChange(toIsoDateString(selected));
    }
  };

  const confirmIOS = () => {
    onChange(toIsoDateString(draftDate));
    setShowPicker(false);
  };

  const clearSelection = () => {
    onChange('');
    setShowPicker(false);
  };

  return (
    <View style={[styles.container, variant === 'form' && styles.containerForm]}>
      {label ? (
        <Text
          style={[
            styles.label,
            variant === 'form' ? styles.labelForm : styles.labelModal,
            { color: labelColor },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[styles.field, { backgroundColor: inputBg, borderColor }]}
        onPress={openPicker}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label ?? 'Seleccionar fecha'}
      >
        <MaterialCommunityIcons
          name="calendar"
          size={20}
          color={parsed ? palette.primary : textSecondary}
          style={styles.icon}
        />
        <Text
          style={[styles.valueText, { color: parsed ? textPrimary : textSecondary }]}
          numberOfLines={2}
        >
          {displayText}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={textSecondary} />
      </TouchableOpacity>

      {hint ? <Text style={[styles.hint, { color: textSecondary }]}>{hint}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {Platform.OS === 'android' && showPicker ? (
        <DateTimePicker
          value={draftDate}
          mode="date"
          display="default"
          onChange={handleAndroidChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      ) : null}

      {Platform.OS === 'ios' && showPicker ? (
        <Modal transparent animationType="slide" visible onRequestClose={() => setShowPicker(false)}>
          <Pressable style={styles.overlay} onPress={() => setShowPicker(false)}>
            <Pressable
              style={[styles.sheet, { backgroundColor: isDark ? palette.darkCard : '#FFFFFF' }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.sheetHeader}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={[styles.sheetAction, { color: textSecondary }]}>Cancelar</Text>
                </TouchableOpacity>
                {clearable && value ? (
                  <TouchableOpacity onPress={clearSelection}>
                    <Text style={[styles.sheetAction, { color: palette.error }]}>Borrar</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.sheetSpacer} />
                )}
                <TouchableOpacity onPress={confirmIOS}>
                  <Text style={[styles.sheetAction, styles.sheetConfirm]}>Listo</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={draftDate}
                mode="date"
                display="spinner"
                onChange={(_, selected) => {
                  if (selected) setDraftDate(selected);
                }}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                locale="es-AR"
                textColor={textPrimary}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  containerForm: {
    marginTop: 0,
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
  },
  labelForm: {
    fontSize: 14,
    fontWeight: '500',
  },
  labelModal: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  icon: {
    marginRight: 10,
  },
  valueText: {
    flex: 1,
    fontSize: 15,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  error: {
    fontSize: 12,
    color: palette.error,
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(100,116,139,0.25)',
  },
  sheetSpacer: {
    width: 48,
  },
  sheetAction: {
    fontSize: 16,
    fontWeight: '600',
  },
  sheetConfirm: {
    color: palette.primary,
  },
});
