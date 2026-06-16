import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import { hapticLight, hapticSelection } from '../../utils/haptics';
import DejanosTuMensajeModal from './DejanosTuMensajeModal';

type ConsultaTipo = 'mensaje' | 'sugerir-ejercicio';

const HIDE_FAB_ROUTES = new Set([
  'Socios',
  'Suscripciones',
  'Turnero',
  'Evaluaciones',
  'Metricas',
  'Perfil',
  'SociosList',
  'SocioDetail',
  'SocioForm',
  'PlanesList',
  'PlanDetail',
  'PlanForm',
  'PlanEjercicioDetail',
  'TutorialesMain',
  'MoreMenu',
]);

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 49 : 56;
const ACTION_ROW_HEIGHT = 64;
const ACTION_ROW_SPACING = 54;
const ACTION_GAP = ACTION_ROW_HEIGHT + ACTION_ROW_SPACING;

const ACTIONS: {
  id: ConsultaTipo;
  label: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}[] = [
  {
    id: 'mensaje',
    label: 'Dejanos un mensaje',
    subtitle: 'Consultas y soporte',
    icon: 'message-text-outline',
    color: palette.primary,
  },
  {
    id: 'sugerir-ejercicio',
    label: 'Sugerir ejercicio',
    subtitle: 'Sumá al catálogo',
    icon: 'dumbbell',
    color: palette.info,
  },
];

interface FloatingActionButtonsProps {
  activeRoute?: string;
  hide?: boolean;
}

export default function FloatingActionButtons({ activeRoute, hide }: FloatingActionButtonsProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const hideFab = hide || (activeRoute ? HIDE_FAB_ROUTES.has(activeRoute) : false);

  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialConsulta, setInitialConsulta] = useState<ConsultaTipo>('mensaje');
  const expandAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: expanded ? 1 : 0,
      friction: 8,
      tension: expanded ? 120 : 140,
      useNativeDriver: true,
    }).start();
  }, [expanded, expandAnim]);

  useEffect(() => {
    if (modalOpen) setExpanded(false);
  }, [modalOpen]);

  const openModal = (tipo: ConsultaTipo) => {
    hapticSelection();
    setInitialConsulta(tipo);
    setModalOpen(true);
  };

  const toggleExpanded = () => {
    hapticLight();
    if (modalOpen) return;
    setExpanded((prev) => !prev);
  };

  const scrimOpacity = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const cardShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
  });

  if (hideFab) {
    return (
      <DejanosTuMensajeModal
        visible={modalOpen}
        initialConsulta={initialConsulta}
        onClose={() => setModalOpen(false)}
      />
    );
  }

  return (
    <>
      <Animated.View
        pointerEvents={expanded ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFill, styles.scrimLayer, { opacity: scrimOpacity }]}
      >
        <Pressable
          style={[
            styles.scrim,
            { backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(15,23,42,0.32)' },
          ]}
          onPress={() => setExpanded(false)}
        />
      </Animated.View>

      <View
        style={[styles.fabContainer, { bottom: insets.bottom + TAB_BAR_HEIGHT + 16 }]}
        pointerEvents="box-none"
      >
        {ACTIONS.map((action, index) => {
          const reverseIndex = ACTIONS.length - 1 - index;
          const translateY = expandAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -(reverseIndex + 1) * ACTION_GAP],
          });
          const opacity = expandAnim.interpolate({
            inputRange: [0, 0.25 + reverseIndex * 0.12, 1],
            outputRange: [0, 0, 1],
          });
          const scale = expandAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          });

          return (
            <Animated.View
              key={action.id}
              style={[
                styles.actionWrap,
                {
                  opacity,
                  transform: [{ translateY }, { scale }],
                },
              ]}
              pointerEvents={expanded ? 'auto' : 'none'}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.actionRow,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => openModal(action.id)}
              >
                <View
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: colors.secondaryGroupedBackground,
                      borderColor: colors.separator,
                    },
                    cardShadow,
                  ]}
                >
                  <View style={[styles.actionAccent, { backgroundColor: action.color }]} />
                  <View style={styles.actionTextWrap}>
                    <Text style={[styles.actionLabel, { color: colors.label }]} numberOfLines={1}>
                      {action.label}
                    </Text>
                    <Text
                      style={[styles.actionSubtitle, { color: colors.secondaryLabel }]}
                      numberOfLines={1}
                    >
                      {action.subtitle}
                    </Text>
                  </View>
                </View>

                <View style={[styles.actionFab, { backgroundColor: action.color }, cardShadow]}>
                  <MaterialCommunityIcons name={action.icon} size={22} color="#FFFFFF" />
                </View>
              </Pressable>
            </Animated.View>
          );
        })}

        <TouchableOpacity
          style={[
            styles.fabMain,
            {
              backgroundColor: expanded
                ? isDark
                  ? palette.slate700
                  : palette.slate800
                : colors.tint,
            },
            cardShadow,
          ]}
          onPress={toggleExpanded}
          activeOpacity={0.9}
          accessibilityLabel="Ayuda y consultas"
          accessibilityState={{ expanded }}
        >
          <Animated.View
            style={{
              transform: [
                {
                  rotate: expandAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '45deg'],
                  }),
                },
              ],
            }}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      <DejanosTuMensajeModal
        visible={modalOpen}
        initialConsulta={initialConsulta}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scrimLayer: {
    zIndex: 998,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    alignItems: 'flex-end',
    zIndex: 999,
  },
  actionWrap: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    minWidth: 200,
    maxWidth: 240,
  },
  actionAccent: {
    width: 4,
    alignSelf: 'stretch',
  },
  actionTextWrap: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  actionFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabMain: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
