import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../hooks/useNotifications';
import GroupedSection from '../../components/common/GroupedSection';
import { typography } from '../../theme/iosTheme';
import { palette } from '../../constants/colors';
import {
  loadNotificationSettings,
  saveNotificationSettings,
} from '../../utils/notifications/notificationSettings';
import { TURN_LEAD_OPTIONS, DEFAULT_TURN_LEAD_MINUTES } from '../../types/notifications.types';
import { ENABLE_NOTIFICATION_DEMOS } from '../../utils/notifications/demoNotifications';
import { hapticSelection } from '../../utils/haptics';
import { useScreenBackground } from '../../hooks/useScreenBackground';

export default function NotificationSettingsScreen() {
  const { colors } = useAppTheme();
  const screenBg = useScreenBackground();
  const { resetDemoNotifications } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const [turnLeadMinutes, setTurnLeadMinutes] = useState(30);
  const [planTenureEnabled, setPlanTenureEnabled] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await loadNotificationSettings();
      setMuted(s.muted);
      setTurnLeadMinutes(s.turnLeadMinutes);
      setPlanTenureEnabled(s.planTenureEnabled);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const persist = async (patch: Partial<{ muted: boolean; turnLeadMinutes: number; planTenureEnabled: boolean }>) => {
    hapticSelection();
    const next = {
      muted: patch.muted ?? muted,
      turnLeadMinutes: patch.turnLeadMinutes ?? turnLeadMinutes,
      planTenureEnabled: patch.planTenureEnabled ?? planTenureEnabled,
    };
    if (patch.muted !== undefined) setMuted(patch.muted);
    if (patch.turnLeadMinutes !== undefined) setTurnLeadMinutes(patch.turnLeadMinutes);
    if (patch.planTenureEnabled !== undefined) setPlanTenureEnabled(patch.planTenureEnabled);
    await saveNotificationSettings(next);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: screenBg }]}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: screenBg }]}
      contentContainerStyle={styles.form}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={[styles.intro, { color: colors.secondaryLabel }]}>
        Configurá cuándo y qué alertas ver en la app. Se generan en el teléfono según tus turnos y suscripciones,
        sin notificaciones push del sistema.
      </Text>

      <GroupedSection title="General">
        <View style={[styles.settingRow, { borderBottomColor: colors.separator }]}>
          <Ionicons
            name={muted ? 'notifications-off-outline' : 'notifications-outline'}
            size={20}
            color={muted ? palette.error : colors.tint}
          />
          <View style={styles.settingText}>
            <Text style={[styles.settingTitle, typography.body, { color: colors.label }]}>Silenciar todo</Text>
            <Text style={[styles.settingSub, { color: colors.secondaryLabel }]}>
              Oculta alertas hasta que lo desactives
            </Text>
          </View>
          <Switch
            value={muted}
            onValueChange={(v) => persist({ muted: v })}
            trackColor={{ false: colors.separator, true: palette.primary }}
          />
        </View>
      </GroupedSection>

      <GroupedSection
        title="Turnos"
        footer={`Aviso ${turnLeadMinutes} minutos antes del inicio, solo si estás inscripto al turno.`}
      >
        <View style={styles.leadRow}>
          {TURN_LEAD_OPTIONS.map((minutes) => {
            const active = turnLeadMinutes === minutes;
            const recommended = minutes === DEFAULT_TURN_LEAD_MINUTES;
            return (
              <TouchableOpacity
                key={minutes}
                style={[
                  styles.leadChip,
                  {
                    backgroundColor: active
                      ? palette.primary
                      : recommended
                        ? `${palette.success}18`
                        : colors.tertiaryGroupedBackground,
                    borderColor: active
                      ? palette.primary
                      : recommended
                        ? `${palette.success}55`
                        : colors.separator,
                  },
                ]}
                onPress={() => persist({ turnLeadMinutes: minutes })}
                accessibilityLabel={`${minutes} minutos antes${recommended ? ', recomendado' : ''}`}
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[
                    styles.leadChipValue,
                    {
                      color: active ? '#FFFFFF' : recommended ? palette.success : colors.label,
                    },
                  ]}
                >
                  {minutes}
                </Text>
                <Text
                  style={[
                    styles.leadChipSub,
                    {
                      color: active
                        ? 'rgba(255,255,255,0.85)'
                        : recommended
                          ? `${palette.success}CC`
                          : colors.tertiaryLabel,
                    },
                  ]}
                >
                  min
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={[styles.leadLegend, { borderTopColor: colors.separator }]}>
          <View
            style={[
              styles.legendSwatch,
              { backgroundColor: `${palette.success}18`, borderColor: palette.success },
            ]}
          />
          <Text style={[styles.leadLegendText, { color: colors.secondaryLabel }]}>
            El resaltado verde indica la opción recomendada ({DEFAULT_TURN_LEAD_MINUTES} min).
          </Text>
        </View>
      </GroupedSection>

      <GroupedSection title="Suscripciones">
        <View style={styles.tipoList}>
          <View style={[styles.settingRow, styles.settingRowPlain]}>
            <Ionicons name="calendar-outline" size={20} color={palette.success} />
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, typography.body, { color: colors.label }]}>
                Antigüedad del plan
              </Text>
              <Text style={[styles.settingSub, { color: colors.secondaryLabel }]}>
                Recordatorio diario mientras la suscripción esté vigente
              </Text>
            </View>
            <Switch
              value={planTenureEnabled}
              onValueChange={(v) => persist({ planTenureEnabled: v })}
              trackColor={{ false: colors.separator, true: palette.primary }}
            />
          </View>

          <View style={[styles.infoBlock, { borderTopColor: colors.separator, backgroundColor: `${colors.tint}08` }]}>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color={colors.tint} />
              <Text style={[styles.infoText, { color: colors.secondaryLabel }]}>
                Por vencer: aviso diario desde 5 días antes hasta el vencimiento.
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="alert-circle-outline" size={16} color={palette.warning} />
              <Text style={[styles.infoText, { color: colors.secondaryLabel }]}>
                Vencida: recordatorio diario hasta que renueves.
              </Text>
            </View>
          </View>
        </View>
      </GroupedSection>

      <GroupedSection
        title="Bandeja"
        footer="Deslizá a la izquierda o derecha, o tocá ✕ en cada tarjeta para cerrar la alerta."
      >
        <View style={[styles.tipoItem, { backgroundColor: `${colors.tint}08` }]}>
          <Ionicons name="hand-left-outline" size={20} color={colors.tint} />
          <Text style={[styles.tipoText, typography.body, { color: colors.label }]}>
            Las alertas cerradas no vuelven a aparecer hasta que se cumpla de nuevo la condición.
          </Text>
        </View>
      </GroupedSection>

      {ENABLE_NOTIFICATION_DEMOS ? (
        <GroupedSection title="Demo">
          <TouchableOpacity
            style={[styles.nuevoTipoBtn, { borderTopColor: colors.separator }]}
            onPress={() => {
              hapticSelection();
              resetDemoNotifications();
            }}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.tint} />
            <Text style={[styles.nuevoTipoText, { color: colors.tint }]}>Restaurar ejemplos de notificación</Text>
          </TouchableOpacity>
        </GroupedSection>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    marginHorizontal: 4,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingRowPlain: {
    borderBottomWidth: 0,
  },
  settingText: { flex: 1 },
  settingTitle: { fontWeight: '600' },
  settingSub: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  leadRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    justifyContent: 'space-between',
  },
  leadChip: {
    width: '22%',
    minWidth: 68,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  leadChipValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  leadChipSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  leadLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  legendSwatch: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
  },
  leadLegendText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
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
  infoBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  nuevoTipoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  nuevoTipoText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
