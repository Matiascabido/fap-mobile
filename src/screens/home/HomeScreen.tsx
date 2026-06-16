import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useAppTheme } from '../../context/ThemeContext';
import { useScreenBackground } from '../../hooks/useScreenBackground';
import { palette } from '../../constants/colors';
import { getGreeting, formatLongDate, capitalize } from '../../utils/formatters';
import { getRolLabel } from '../../utils/sessionRole';
import QuickAccessGrid from '../../components/common/QuickAccessGrid';
import { buildQuickAccesses } from '../../utils/quickAccesses';
import { navigateToModule } from '../../utils/navigateModule';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const {
    hasPermission,
    isProfesionalUser,
    isSocioSinPlan,
    isGodOrAdmin,
    canManageTurnos,
    canEnrollTurnos,
    canManageEvaluaciones,
  } = usePermissions();
  const { isDark, colors } = useAppTheme();

  const bgColor = useScreenBackground();
  const cardBg = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.slate200;

  const greeting = getGreeting();
  const today = formatLongDate(new Date());
  const rolLabel = getRolLabel(user);

  const isSocioSolo = isSocioSinPlan();

  const quickAccesses = buildQuickAccesses({
    isSocioSolo,
    isProfesional: isProfesionalUser,
    isAdmin: isGodOrAdmin(),
    canManageTurnos: canManageTurnos(),
    canEnrollTurnos: canEnrollTurnos(),
    canManageEvaluaciones: canManageEvaluaciones(),
    hasPermission,
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {/* Hero card */}
      <LinearGradient
        colors={['#0f172a', '#7f1d1d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.heroCard}
      >
        <View style={styles.heroBlob} />
        <View style={styles.heroBlob2} />
        <View style={styles.heroContent}>
          <Text style={styles.heroDate}>{capitalize(today).toUpperCase()}</Text>
          <Text style={styles.heroGreeting}>
            {greeting},{' '}
            <Text style={styles.heroName}>{user?.nombre ?? 'usuario'}</Text>!
          </Text>
          <Text style={styles.heroSubtitle}>
            Desde acá podés acceder a todas las secciones del club.
          </Text>
          <View style={styles.rolePill}>
            <MaterialCommunityIcons name="shield-account" size={14} color="#FFFFFF" />
            <Text style={styles.roleText}>{rolLabel}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Mensaje contextual para socios club (sin plan) */}
      {isSocioSolo && (
        <View style={[styles.infoBanner, { backgroundColor: `${palette.info}18`, borderColor: `${palette.info}40` }]}>
          <MaterialCommunityIcons name="information" size={18} color={palette.info} />
          <Text style={[styles.infoBannerText, { color: palette.info }]}>
            Accedé a los tutoriales y videos de entrenamiento disponibles para vos.
          </Text>
        </View>
      )}

      {/* Accesos rápidos */}
      <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Accesos rápidos</Text>
        <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
          Navegá directamente a las secciones más usadas
        </Text>

        <View style={styles.grid}>
          <QuickAccessGrid
            items={quickAccesses}
            onPress={(route) => navigateToModule(navigation, route)}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  heroCard: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  heroBlob: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroBlob2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(220,38,38,0.15)',
  },
  heroContent: {
    padding: 20,
  },
  heroDate: {
    color: 'rgba(147,197,253,0.9)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heroGreeting: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
  },
  heroName: {
    color: '#f87171',
  },
  heroSubtitle: {
    color: palette.slate400,
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
    maxWidth: 320,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
});
