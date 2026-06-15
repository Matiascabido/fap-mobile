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
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import { formatTimeHHmm, parseTimeHHmm } from '../../utils/formatters';

interface TimePickerFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

export default function TimePickerField({
  label,
  value,
  onChange,
  error,
  placeholder = 'Seleccionar hora',
}: TimePickerFieldProps) {
  const { isDark } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [draftTime, setDraftTime] = useState(new Date());

  const parsed = parseTimeHHmm(value);

  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = error
    ? palette.error
    : isDark
      ? palette.darkBorder
      : palette.lightBorder;

  const displayText = useMemo(() => {
    if (!parsed) return placeholder;
    return formatTimeHHmm(parsed);
  }, [parsed, placeholder]);

  const openPicker = () => {
    setDraftTime(parsed ?? new Date());
    setShowPicker(true);
  };

  const handleAndroidChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowPicker(false);
    if (event.type === 'set' && selected) {
      onChange(formatTimeHHmm(selected));
    }
  };

  const confirmIOS = () => {
    onChange(formatTimeHHmm(draftTime));
    setShowPicker(false);
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.label, { color: textSecondary }]}>{label}</Text> : null}

      <TouchableOpacity
        style={[styles.field, { borderColor }]}
        onPress={openPicker}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label ?? 'Seleccionar hora'}
      >
        <MaterialCommunityIcons
          name="clock-outline"
          size={20}
          color={parsed ? palette.primary : textSecondary}
          style={styles.icon}
        />
        <Text
          style={[styles.valueText, { color: parsed ? textPrimary : textSecondary }]}
        >
          {displayText}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={textSecondary} />
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {Platform.OS === 'android' && showPicker ? (
        <DateTimePicker
          value={draftTime}
          mode="time"
          display="default"
          is24Hour
          onChange={handleAndroidChange}
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
                <TouchableOpacity onPress={confirmIOS}>
                  <Text style={[styles.sheetAction, styles.sheetConfirm]}>Listo</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={draftTime}
                mode="time"
                display="spinner"
                is24Hour
                onChange={(_, selected) => {
                  if (selected) setDraftTime(selected);
                }}
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
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 48,
  },
  icon: {
    marginRight: 8,
  },
  valueText: {
    flex: 1,
    fontSize: 15,
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(100,116,139,0.25)',
  },
  sheetAction: {
    fontSize: 16,
    fontWeight: '600',
  },
  sheetConfirm: {
    color: palette.primary,
  },
});
