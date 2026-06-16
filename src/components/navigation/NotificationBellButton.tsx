import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../hooks/useNotifications';
import { palette } from '../../constants/colors';
import { hapticSelection } from '../../utils/haptics';
import { HeaderIconButton } from './HeaderIconButton';

const ICON_SIZE = 22;

export default function NotificationBellButton() {
  const navigation = useNavigation<any>();
  const { colors } = useAppTheme();
  const { unreadCount } = useNotifications();

  return (
    <HeaderIconButton
      onPress={() => {
        hapticSelection();
        navigation.navigate('More', { screen: 'Notifications' });
      }}
      accessibilityLabel={
        unreadCount > 0
          ? `Notificaciones, ${unreadCount} pendientes`
          : 'Notificaciones'
      }
    >
      <Ionicons name="notifications-outline" size={ICON_SIZE} color={colors.tint} />
      {unreadCount > 0 ? (
        <View
          style={[styles.dot, { borderColor: colors.secondaryGroupedBackground }]}
          pointerEvents="none"
        />
      ) : null}
    </HeaderIconButton>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.error,
    borderWidth: 1.5,
  },
});
