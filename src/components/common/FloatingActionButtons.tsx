import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';
import { palette } from '../../constants/colors';
import QuickAccessGrid from './QuickAccessGrid';
import { buildQuickAccesses } from '../../utils/quickAccesses';
import { navigateToModule } from '../../utils/navigateModule';

const HIDE_FAB_ROUTES = new Set([
  'HomeMain',
  'MoreMenu',
  'Socios',
  'Suscripciones',
  'Turnero',
  'Evaluaciones',
  'Metricas',
  'Perfil',
  'SociosList',
  'SocioDetail',
  'SocioForm',
  'PlanDetail',
  'PlanForm',
  'PlanEjercicioDetail',
]);

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 49 : 56;

interface FloatingActionButtonsProps {
  activeRoute?: string;
  hide?: boolean;
}

export default function FloatingActionButtons({ activeRoute, hide }: FloatingActionButtonsProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useAppTheme();
  const {
    hasPermission,
    isProfesionalUser,
    isSocioSinPlan,
    isGodOrAdmin,
    canManageTurnos,
    canEnrollTurnos,
    canManageEvaluaciones,
  } = usePermissions();

  const [open, setOpen] = useState(false);

  const hideFab = hide || (activeRoute ? HIDE_FAB_ROUTES.has(activeRoute) : false);

  const quickAccesses = useMemo(
    () =>
      buildQuickAccesses({
        isSocioSolo: isSocioSinPlan(),
        isProfesional: isProfesionalUser,
        isAdmin: isGodOrAdmin(),
        canManageTurnos: canManageTurnos(),
        canEnrollTurnos: canEnrollTurnos(),
        canManageEvaluaciones: canManageEvaluaciones(),
        hasPermission,
      }),
    [
      isSocioSinPlan,
      isProfesionalUser,
      isGodOrAdmin,
      canManageTurnos,
      canEnrollTurnos,
      canManageEvaluaciones,
      hasPermission,
    ]
  );

  const handleNavigate = (route: string) => {
    setOpen(false);
    navigateToModule(navigation, route);
  };

  const sheetBg = isDark ? palette.darkCard : '#FFFFFF';

  return (
    <>
      {!hideFab && (
        <View style={[styles.fabContainer, { bottom: insets.bottom + TAB_BAR_HEIGHT + 12 }]}>
          <TouchableOpacity
            style={styles.fabMain}
            onPress={() => setOpen(true)}
            activeOpacity={0.9}
            accessibilityLabel="Accesos rápidos"
          >
            <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: sheetBg }]} onPress={() => {}}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <MaterialCommunityIcons name="flash" size={20} color={palette.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.label }]}>Accesos rápidos</Text>
                <Text style={[styles.subtitle, { color: colors.secondaryLabel }]}>
                  Ir a cualquier sección del club
                </Text>
              </View>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={24} color={colors.secondaryLabel} />
              </TouchableOpacity>
            </View>
            <ScrollView
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <QuickAccessGrid items={quickAccesses} onPress={handleNavigate} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 20,
    alignItems: 'flex-end',
    zIndex: 999,
  },
  fabMain: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '75%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(100,116,139,0.35)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(220,38,38,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  body: { paddingHorizontal: 20, paddingBottom: 8 },
});
