import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  type LayoutChangeEvent,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import { formatRelativeTime } from '../../utils/formatters';
import { hapticSelection } from '../../utils/haptics';
import type { AppNotification, NotificationType } from '../../types/notifications.types';

const TITLE_LINE_HEIGHT = 21;
const BODY_LINE_HEIGHT = 18;

type TypeMeta = {
  accent: string;
  icon: keyof typeof Ionicons.glyphMap;
  routeLabel: string;
};

function metaForType(type: NotificationType): TypeMeta {
  switch (type) {
    case 'turno_proximo':
      return { accent: palette.info, icon: 'calendar-outline', routeLabel: 'Turnero' };
    case 'suscripcion_por_vencer':
      return { accent: palette.warning, icon: 'time-outline', routeLabel: 'Suscripciones' };
    case 'suscripcion_vencida':
      return { accent: palette.error, icon: 'alert-circle-outline', routeLabel: 'Suscripciones' };
    case 'suscripcion_antiguedad':
      return { accent: palette.success, icon: 'ribbon-outline', routeLabel: 'Suscripciones' };
    default:
      return { accent: palette.primary, icon: 'notifications-outline', routeLabel: 'Abrir' };
  }
}

interface Props {
  item: AppNotification;
  onDismiss: () => void;
  onOpen?: () => void;
  isLast?: boolean;
}

export default function NotificationListItem({ item, onDismiss, onOpen, isLast = false }: Props) {
  const { colors } = useAppTheme();
  const swipeRef = useRef<Swipeable>(null);
  const meta = metaForType(item.type);
  const [textWidth, setTextWidth] = useState(0);

  const onTextLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.floor(event.nativeEvent.layout.width);
    setTextWidth((prev) => (prev !== next ? next : prev));
  }, []);

  const handleDismiss = () => {
    hapticSelection();
    swipeRef.current?.close();
    onDismiss();
  };

  const renderDeleteAction = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    side: 'left' | 'right'
  ) => {
    const translateX =
      side === 'right'
        ? dragX.interpolate({
            inputRange: [-80, 0],
            outputRange: [0, 80],
            extrapolate: 'clamp',
          })
        : dragX.interpolate({
            inputRange: [0, 80],
            outputRange: [-80, 0],
            extrapolate: 'clamp',
          });

    return (
      <Animated.View style={[styles.deleteAction, { transform: [{ translateX }] }]}>
        <Pressable style={styles.deletePress} onPress={handleDismiss}>
          <Ionicons name="close-circle-outline" size={22} color="#FFFFFF" />
          <Text style={styles.deleteLabel}>Cerrar</Text>
        </Pressable>
      </Animated.View>
    );
  };

  const textStyle = textWidth > 0 ? { width: textWidth, maxWidth: textWidth } : styles.textMeasuring;

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      overshootRight={false}
      overshootLeft={false}
      renderRightActions={(progress, dragX) => renderDeleteAction(progress, dragX, 'right')}
      renderLeftActions={(progress, dragX) => renderDeleteAction(progress, dragX, 'left')}
      onSwipeableOpen={handleDismiss}
      containerStyle={styles.swipeContainer}
      childrenContainerStyle={styles.swipeChild}
    >
      <View
        style={[
          styles.row,
          !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
        ]}
      >
        <View style={[styles.rowIcon, { backgroundColor: `${meta.accent}12` }]}>
          <Ionicons name={meta.icon} size={20} color={meta.accent} />
        </View>

        <View style={styles.textColumn} onLayout={onTextLayout}>
          <Pressable
            onPress={onOpen}
            disabled={!onOpen}
            style={({ pressed }) => [pressed && onOpen && { opacity: 0.65 }]}
          >
            <Text style={[styles.rowTitle, textStyle, { color: colors.label }]}>{item.title}</Text>

            <Text style={[styles.rowBody, textStyle, { color: colors.secondaryLabel }]}>{item.body}</Text>

            <View style={styles.metaRow}>
              <Text style={[styles.rowTime, { color: colors.tertiaryLabel }]}>
                {formatRelativeTime(item.createdAt)}
              </Text>
              {item.isDemo ? (
                <View style={[styles.demoPill, { backgroundColor: `${colors.tint}12` }]}>
                  <Text style={[styles.demoPillText, { color: colors.tint }]}>Demo</Text>
                </View>
              ) : null}
            </View>

            {onOpen ? (
              <View style={styles.routeRow}>
                <Text style={[styles.routeHint, { color: colors.tint }]}>{meta.routeLabel}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.tertiaryLabel} />
              </View>
            ) : null}
          </Pressable>
        </View>

        <Pressable
          onPress={handleDismiss}
          hitSlop={8}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.55 }]}
          accessibilityRole="button"
          accessibilityLabel="Cerrar notificación"
        >
          <Ionicons name="close" size={18} color={colors.tertiaryLabel} />
        </Pressable>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    alignSelf: 'stretch',
  },
  swipeChild: {
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  textMeasuring: {
    alignSelf: 'stretch',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: TITLE_LINE_HEIGHT,
  },
  rowBody: {
    fontSize: 13,
    lineHeight: BODY_LINE_HEIGHT,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  rowTime: {
    fontSize: 12,
    flexShrink: 1,
  },
  demoPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  demoPillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  routeHint: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  deleteAction: {
    width: 80,
    justifyContent: 'center',
  },
  deletePress: {
    flex: 1,
    backgroundColor: palette.error,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 10,
    marginVertical: 4,
    marginHorizontal: 4,
  },
  deleteLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
