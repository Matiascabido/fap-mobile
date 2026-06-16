import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useAppTheme } from '../../context/ThemeContext';
import { getRolLabel } from '../../utils/sessionRole';
import GroupedSection from '../../components/common/GroupedSection';
import QuickAccessGrid from '../../components/common/QuickAccessGrid';
import { buildQuickAccesses } from '../../utils/quickAccesses';
import { navigateToModule } from '../../utils/navigateModule';
import { MoreStackParamList } from '../../navigation/types';
import { palette } from '../../constants/colors';

type MoreNav = NativeStackNavigationProp<MoreStackParamList, 'MoreMenu'>;

export default function MoreScreen() {
  const navigation = useNavigation<MoreNav>();
  const { user, logout } = useAuth();
  const { colors, isDark } = useAppTheme();
  const {
    hasPermission,
    isGodOrAdmin,
    isProfesionalUser,
    isSocioSinPlan,
    canManageTurnos,
    canEnrollTurnos,
    canManageEvaluaciones,
  } = usePermissions();

  const rolLabel = getRolLabel(user);
  const cardBg = isDark ? palette.darkCard : '#FFFFFF';
  const borderColor = isDark ? palette.darkBorder : palette.slate200;

  const quickAccesses = buildQuickAccesses({
    isSocioSolo: isSocioSinPlan(),
    isProfesional: isProfesionalUser,
    isAdmin: isGodOrAdmin(),
    canManageTurnos: canManageTurnos(),
    canEnrollTurnos: canEnrollTurnos(),
    canManageEvaluaciones: canManageEvaluaciones(),
    hasPermission,
  });

  const handleQuickAccess = (route: string) => {
    navigateToModule(navigation.getParent() ?? navigation, route);
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
      <LinearGradient
        colors={['#0f172a', '#7f1d1d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileCard}
      >
        <Avatar nombre={user?.nombre} apellido={user?.apellido} size={56} />
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>
            {user?.nombre} {user?.apellido}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {user?.mail}
          </Text>
          <View style={styles.rolePill}>
            <Ionicons name="shield-checkmark" size={13} color="#FFF" />
            <Text style={styles.roleText}>{rolLabel}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: colors.label }]}>Accesos rápidos</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.secondaryLabel }]}>
          Navegá directamente a las secciones más usadas
        </Text>
        <QuickAccessGrid items={quickAccesses} onPress={handleQuickAccess} />
      </View>

      <GroupedSection title="Cuenta">
        <TouchableOpacity
          style={[styles.accountRow, { borderBottomColor: colors.separator }]}
          onPress={() => navigation.navigate('Perfil')}
        >
          <View style={[styles.accountIcon, { backgroundColor: `${palette.primary}15` }]}>
            <Ionicons name="person-outline" size={20} color={palette.primary} />
          </View>
          <Text style={[styles.accountLabel, { color: colors.label }]}>Mi perfil</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.tertiaryLabel} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.accountRow} onPress={handleLogout}>
          <View style={[styles.accountIcon, { backgroundColor: `${palette.error}12` }]}>
            <Ionicons name="log-out-outline" size={20} color={palette.error} />
          </View>
          <Text style={[styles.accountLabel, { color: palette.error }]}>Cerrar sesión</Text>
        </TouchableOpacity>
      </GroupedSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    paddingBottom: 32,
    gap: 16,
  },
  profileCard: {
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
  },
  profileInfo: { flex: 1 },
  userName: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  userEmail: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 2 },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    gap: 5,
  },
  roleText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionSubtitle: { fontSize: 13, marginTop: 4, marginBottom: 16, lineHeight: 18 },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  accountIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
});
