import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../context/ThemeContext';
import { getRolLabel } from '../../utils/sessionRole';
import GroupedSection from '../../components/common/GroupedSection';
import QuickAccessGrid from '../../components/common/QuickAccessGrid';
import QuickAccessCustomizeModal from '../../components/common/QuickAccessCustomizeModal';
import { navigateToModule } from '../../utils/navigateModule';
import { MoreStackParamList } from '../../navigation/types';
import { palette } from '../../constants/colors';
import { useScreenBackground } from '../../hooks/useScreenBackground';
import { useNavigationPreferences } from '../../context/NavigationPreferencesContext';
import { useLocalProfile } from '../../context/LocalProfileContext';
import { hapticSelection } from '../../utils/haptics';

type MoreNav = NativeStackNavigationProp<MoreStackParamList, 'MoreMenu'>;

export default function MoreScreen() {
  const navigation = useNavigation<MoreNav>();
  const { user, logout } = useAuth();
  const { colors } = useAppTheme();
  const { displayName, hasNickname, photoUri } = useLocalProfile();
  const {
    available,
    moreItems,
    toggleTabRoute,
    toggleHomePin,
    toggleMoreRoute,
    isTabRoute,
    isHomePinned,
    isMoreRoute,
    restoreDefaults,
  } = useNavigationPreferences();

  const [customizeOpen, setCustomizeOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const rolLabel = getRolLabel(user);
  const screenBg = useScreenBackground();
  const cardBg = colors.secondaryGroupedBackground;
  const borderColor = colors.separator;

  const handleQuickAccess = (route: string) => {
    navigateToModule(navigation.getParent() ?? navigation, route);
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const openCustomize = () => {
    hapticSelection();
    setCustomizeOpen(true);
  };

  const handleRestoreDefaults = async () => {
    hapticSelection();
    await restoreDefaults();
  };

  return (
    <>
      <ScrollView
        ref={scrollRef}
        style={[styles.container, { backgroundColor: screenBg }]}
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
          <Avatar
            nombre={user?.nombre}
            apellido={user?.apellido}
            size={56}
            imageUri={photoUri}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            {hasNickname ? (
              <Text style={styles.userLegalName} numberOfLines={1}>
                {user?.nombre} {user?.apellido}
              </Text>
            ) : null}
            <Text style={styles.userEmail} numberOfLines={1}>
              {user?.mail}
            </Text>
            <View style={styles.rolePill}>
              <Ionicons name="shield-checkmark" size={13} color="#FFF" />
              <Text style={styles.roleText}>{rolLabel}</Text>
            </View>
          </View>
        </LinearGradient>

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
          <TouchableOpacity
            style={[styles.accountRow, { borderBottomColor: colors.separator }]}
            onPress={() => navigation.navigate('NotificationSettings')}
          >
            <View style={[styles.accountIcon, { backgroundColor: `${palette.info}15` }]}>
              <Ionicons name="notifications-outline" size={20} color={palette.info} />
            </View>
            <Text style={[styles.accountLabel, { color: colors.label }]}>Notificaciones</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.tertiaryLabel} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.accountRow} onPress={handleLogout}>
            <View style={[styles.accountIcon, { backgroundColor: `${palette.error}12` }]}>
              <Ionicons name="log-out-outline" size={20} color={palette.error} />
            </View>
            <Text style={[styles.accountLabel, { color: palette.error }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </GroupedSection>

        {available.length > 0 ? (
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.label }]}>Accesos rápidos</Text>
              <TouchableOpacity
                onPress={openCustomize}
                style={styles.customizeBtn}
                accessibilityLabel="Personalizar accesos"
              >
                <Ionicons name="options-outline" size={16} color={palette.primary} />
                <Text style={styles.customizeText}>Personalizar</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.secondaryLabel }]}>
              Navegá directamente a las secciones más usadas
            </Text>
            <QuickAccessGrid items={moreItems} onPress={handleQuickAccess} />
          </View>
        ) : null}
      </ScrollView>

      <QuickAccessCustomizeModal
        visible={customizeOpen}
        items={available}
        isTabRoute={isTabRoute}
        isHomePinned={isHomePinned}
        isMoreRoute={isMoreRoute}
        onToggleTab={(route) => void toggleTabRoute(route)}
        onToggleHome={(route) => void toggleHomePin(route)}
        onToggleMore={(route) => void toggleMoreRoute(route)}
        onRestore={() => void handleRestoreDefaults()}
        onClose={() => setCustomizeOpen(false)}
      />
    </>
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
  userLegalName: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
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
  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  customizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  customizeText: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
