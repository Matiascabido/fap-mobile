import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useScreenBackground } from '../../hooks/useScreenBackground';
import { navigateToModule } from '../../utils/navigateModule';
import { hapticSelection } from '../../utils/haptics';
import GroupedSection from '../../components/common/GroupedSection';
import { typography } from '../../theme/iosTheme';
import NotificationListItem from '../../components/notifications/NotificationListItem';
import type { AppNotification } from '../../types/notifications.types';
import { ENABLE_NOTIFICATION_DEMOS, isDemoNotificationId } from '../../utils/notifications/demoNotifications';

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useAppTheme();
  const screenBg = useScreenBackground();
  const { notifications, isRefreshing, refreshNotifications, dismissNotification, resetDemoNotifications } =
    useNotifications();

  const onRefresh = useCallback(() => {
    void refreshNotifications(true);
  }, [refreshNotifications]);

  const handleDismiss = useCallback(
    (item: AppNotification) => {
      void dismissNotification(item.id);
    },
    [dismissNotification]
  );

  const handleOpen = useCallback(
    (item: AppNotification) => {
      hapticSelection();
      void dismissNotification(item.id);
      navigateToModule(navigation.getParent() ?? navigation, item.targetRoute);
    },
    [dismissNotification, navigation]
  );

  const hasDemos = notifications.some((n) => n.isDemo);
  const count = notifications.length;

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: screenBg }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.form}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.tint]}
            tintColor={colors.tint}
          />
        }
      >
        <Text style={[styles.intro, { color: colors.secondaryLabel }]}>
          {count > 0
            ? 'Tocá una alerta para ir al módulo correspondiente. Deslizá o usá ✕ para cerrarla.'
            : 'Acá vas a ver avisos de turnos y suscripciones generados en el teléfono.'}
        </Text>

        {hasDemos ? (
          <GroupedSection title="Demo">
            <View style={[styles.infoRow, { backgroundColor: `${colors.tint}08` }]}>
              <Ionicons name="flask-outline" size={20} color={colors.tint} />
              <Text style={[styles.infoText, typography.body, { color: colors.label }]}>
                Ejemplos de cada tipo de alerta. Deslizá o tocá ✕ para cerrarlos.
              </Text>
            </View>
          </GroupedSection>
        ) : null}

        <GroupedSection
          title={count > 0 ? `Pendientes (${count})` : 'Alertas'}
          footer={
            count > 0
              ? 'Las alertas cerradas no vuelven hasta que se cumpla de nuevo la condición.'
              : 'Cuando haya avisos de turnos o suscripciones, los vas a ver acá.'
          }
        >
          {count === 0 ? (
            <View style={styles.emptyRow}>
              <Ionicons name="notifications-off-outline" size={20} color={colors.tertiaryLabel} />
              <Text style={[styles.emptyText, { color: colors.secondaryLabel }]}>Sin notificaciones</Text>
            </View>
          ) : (
            notifications.map((item, index) => (
              <NotificationListItem
                key={item.id}
                item={item}
                isLast={index === notifications.length - 1}
                onDismiss={() => handleDismiss(item)}
                onOpen={isDemoNotificationId(item.id) ? undefined : () => handleOpen(item)}
              />
            ))
          )}
        </GroupedSection>

        <GroupedSection title="Acciones">
          <TouchableOpacity
            style={[styles.actionBtn, { borderBottomColor: colors.separator }]}
            onPress={() => navigation.navigate('NotificationSettings')}
          >
            <Ionicons name="settings-outline" size={20} color={colors.tint} />
            <Text style={[styles.actionText, { color: colors.tint }]}>Configuración de alertas</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.tertiaryLabel} />
          </TouchableOpacity>

          {ENABLE_NOTIFICATION_DEMOS ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                hapticSelection();
                resetDemoNotifications();
              }}
            >
              <Ionicons name="refresh-outline" size={20} color={colors.tint} />
              <Text style={[styles.actionText, { color: colors.tint }]}>Restaurar ejemplos</Text>
            </TouchableOpacity>
          ) : null}
        </GroupedSection>
      </ScrollView>
    </GestureHandlerRootView>
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoText: { flex: 1 },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
});
