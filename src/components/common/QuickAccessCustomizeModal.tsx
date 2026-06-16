import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import { QuickAccess } from '../../utils/quickAccesses';
import { MAX_TAB_SLOTS } from '../../types/navigationPreferences.types';

interface QuickAccessCustomizeModalProps {
  visible: boolean;
  items: QuickAccess[];
  isTabRoute: (route: string) => boolean;
  isHomePinned: (route: string) => boolean;
  isMoreRoute: (route: string) => boolean;
  onToggleTab: (route: string) => void;
  onToggleHome: (route: string) => void;
  onToggleMore: (route: string) => void;
  onRestore: () => void;
  onClose: () => void;
}

function PlacementSwitch({
  label,
  icon,
  value,
  onValueChange,
  disabled,
  colors,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: boolean;
  onValueChange: () => void;
  disabled?: boolean;
  colors: { separator: string };
}) {
  return (
    <View style={styles.placement}>
      <Ionicons
        name={icon}
        size={16}
        color={value ? palette.primary : palette.slate400}
        style={styles.placementIcon}
      />
      <Text style={[styles.placementLabel, value && styles.placementLabelOn]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        style={styles.placementSwitch}
        trackColor={{ false: colors.separator, true: `${palette.primary}55` }}
        thumbColor={value ? palette.primary : '#f4f4f5'}
      />
    </View>
  );
}

export default function QuickAccessCustomizeModal({
  visible,
  items,
  isTabRoute,
  isHomePinned,
  isMoreRoute,
  onToggleTab,
  onToggleHome,
  onToggleMore,
  onRestore,
  onClose,
}: QuickAccessCustomizeModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.groupedBackground,
            paddingTop: Platform.OS === 'ios' ? 12 : insets.top + 8,
          },
        ]}
      >
        <View style={[styles.header, { borderBottomColor: colors.separator }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn} accessibilityLabel="Cerrar">
            <Ionicons name="close" size={24} color={colors.label} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.label }]}>Personalizar accesos</Text>
          <View style={styles.headerBtn} />
        </View>

        <Text style={[styles.intro, { color: colors.secondaryLabel }]}>
          Elegí dónde ver cada sección: barra inferior (máx. {MAX_TAB_SLOTS}), fijados en Inicio o
          accesos rápidos en Más.
        </Text>

        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const accent = item.accent ?? palette.primary;
            const tabOn = isTabRoute(item.route);
            const homeOn = isHomePinned(item.route);
            const moreOn = isMoreRoute(item.route);
            const moreOnlyCount = items.filter(
              (i) =>
                isMoreRoute(i.route) &&
                !isTabRoute(i.route) &&
                !isHomePinned(i.route)
            ).length;
            const moreDisabled = moreOn && !tabOn && !homeOn && moreOnlyCount <= 1;

            return (
              <View
                key={item.route}
                style={[
                  styles.card,
                  { backgroundColor: colors.secondaryGroupedBackground, borderColor: colors.separator },
                  !isLast && styles.cardSpacing,
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconWrap, { backgroundColor: `${accent}18` }]}>
                    <MaterialCommunityIcons name={item.icon} size={22} color={accent} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={[styles.rowTitle, { color: colors.label }]}>{item.title}</Text>
                    <Text style={[styles.rowSub, { color: colors.secondaryLabel }]} numberOfLines={2}>
                      {item.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.placements}>
                  <PlacementSwitch
                    label="Barra"
                    icon="phone-portrait-outline"
                    value={tabOn}
                    onValueChange={() => onToggleTab(item.route)}
                    colors={colors}
                  />
                  <PlacementSwitch
                    label="Inicio"
                    icon="home-outline"
                    value={homeOn}
                    onValueChange={() => onToggleHome(item.route)}
                    colors={colors}
                  />
                  <PlacementSwitch
                    label="Más"
                    icon="grid-outline"
                    value={moreOn}
                    onValueChange={() => onToggleMore(item.route)}
                    disabled={moreDisabled}
                    colors={colors}
                  />
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View
          style={[styles.footer, { borderTopColor: colors.separator, paddingBottom: insets.bottom + 12 }]}
        >
          <TouchableOpacity style={styles.restoreBtn} onPress={onRestore}>
            <Ionicons name="refresh-outline" size={18} color={palette.primary} />
            <Text style={styles.restoreText}>Restaurar predeterminados</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
  },
  intro: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  cardSpacing: {
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '700' },
  rowSub: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  placements: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  placement: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  placementIcon: {
    marginBottom: 2,
  },
  placementLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.slate400,
  },
  placementLabelOn: {
    color: palette.primary,
  },
  placementSwitch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  restoreText: {
    color: palette.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});
