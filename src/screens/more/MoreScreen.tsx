import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useAppTheme } from '../../context/ThemeContext';
import { drawerItems, ROUTES } from '../../constants/navigation';
import { getRolLabel } from '../../utils/sessionRole';
import ListRow from '../../components/common/ListRow';
import GroupedSection from '../../components/common/GroupedSection';
import { MoreStackParamList, MainTabParamList } from '../../navigation/types';

const MORE_ROUTES = new Set([ROUTES.HOME, ROUTES.PLANES, ROUTES.TUTORIALES]);
const TAB_ROUTES = new Set([ROUTES.HOME, ROUTES.PLANES, ROUTES.TUTORIALES]);

type MoreNav = NativeStackNavigationProp<MoreStackParamList, 'MoreMenu'>;

export default function MoreScreen() {
  const navigation = useNavigation<MoreNav>();
  const { user, logout } = useAuth();
  const { colors } = useAppTheme();
  const {
    hasPermission,
    isGodOrAdmin,
    isProfesional,
    isSocioSinPlan,
    canManageEvaluaciones,
  } = usePermissions();

  const rolLabel = getRolLabel(user);
  const isSocioSolo = isSocioSinPlan();

  const isItemVisible = (item: (typeof drawerItems)[0]): boolean => {
    if (MORE_ROUTES.has(item.route)) return false;
    if (!item.scope) return item.route !== ROUTES.HOME;
    if (item.route === ROUTES.METRICAS) return true;
    if (isSocioSolo) return item.route === ROUTES.METRICAS;
    if (item.route === ROUTES.EVALUACIONES) return canManageEvaluaciones();
    if (item.route === ROUTES.SOCIOS) return isGodOrAdmin() || isProfesional();
    if (item.route === ROUTES.SUSCRIPCIONES) {
      return isGodOrAdmin() || isProfesional() || hasPermission(item.scope);
    }
    const permisos = user?.permisos ?? [];
    if (permisos.length === 0) {
      if (isGodOrAdmin() || isProfesional()) return true;
      return item.route === ROUTES.TURNERO || item.route === ROUTES.METRICAS;
    }
    return hasPermission(item.scope);
  };

  const menuItems = drawerItems.filter(isItemVisible);

  const navigateToModule = (route: keyof MoreStackParamList | keyof MainTabParamList) => {
    if (TAB_ROUTES.has(route)) {
      navigation.getParent()?.navigate(route as keyof MainTabParamList);
      return;
    }
    navigation.navigate(route as Exclude<keyof MoreStackParamList, 'MoreMenu'>);
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.groupedBackground }]}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <GroupedSection title="Perfil">
        <View style={styles.profileRow}>
          <Avatar nombre={user?.nombre} apellido={user?.apellido} size={52} />
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: colors.label }]}>
              {user?.nombre} {user?.apellido}
            </Text>
            <Text style={[styles.userEmail, { color: colors.secondaryLabel }]} numberOfLines={1}>
              {user?.mail}
            </Text>
            <Text style={[styles.roleText, { color: colors.tint }]}>{rolLabel}</Text>
          </View>
        </View>
      </GroupedSection>

      {menuItems.length > 0 ? (
        <GroupedSection title="Módulos">
          {menuItems.map((item, index) => (
            <ListRow
              key={item.route}
              title={item.name}
              onPress={() => navigateToModule(item.route as keyof MoreStackParamList)}
              icon={mapIcon(item.icon)}
              isLast={index === menuItems.length - 1}
            />
          ))}
        </GroupedSection>
      ) : null}

      <GroupedSection title="Cuenta">
        <ListRow
          title="Mi perfil"
          onPress={() => navigation.navigate('Perfil')}
          icon="person-outline"
        />
        <ListRow
          title="Cerrar sesión"
          onPress={handleLogout}
          icon="log-out-outline"
          isLast
          showChevron={false}
        />
      </GroupedSection>
    </ScrollView>
  );
}

function mapIcon(icon: string): keyof typeof Ionicons.glyphMap {
  const map: Record<string, keyof typeof Ionicons.glyphMap> = {
    home: 'home-outline',
    'account-group': 'people-outline',
    dumbbell: 'barbell-outline',
    'card-account-details': 'card',
    'calendar-clock': 'calendar',
    'clipboard-text': 'clipboard-outline',
    'chart-line': 'stats-chart-outline',
    video: 'videocam-outline',
  };
  return map[icon] || 'ellipse-outline';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    paddingBottom: 32,
    gap: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  profileInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '700' },
  userEmail: { fontSize: 14, marginTop: 2 },
  roleText: { fontSize: 13, fontWeight: '600', marginTop: 6 },
});
