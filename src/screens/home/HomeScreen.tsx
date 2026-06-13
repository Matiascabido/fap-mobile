import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import { getGreeting, formatLongDate, capitalize } from '../../utils/formatters';

interface QuickAccess {
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  route: string;
  scope?: string;
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { hasPermission, isProfesionalUser, isSocioUser } = usePermissions();
  const { isDark } = useTheme();

  const bgColor = isDark ? palette.darkBg : palette.slate50;
  const cardBg = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.slate200;

  const greeting = getGreeting();
  const today = formatLongDate(new Date());
  const quickAccesses = getQuickAccesses(hasPermission, isProfesionalUser, isSocioUser);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['#0f172a', '#7f1d1d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.heroCard}
      >
        <View style={styles.heroBlob} />
        <View style={styles.heroContent}>
          <Text style={styles.heroDate}>{capitalize(today).toUpperCase()}</Text>
          <Text style={styles.heroGreeting}>
            {greeting},{' '}
            <Text style={styles.heroName}>{user?.nombre}</Text>!
          </Text>
          <Text style={styles.heroSubtitle}>
            Desde acá podés acceder a todas las secciones del club.
          </Text>
          <View style={styles.rolePill}>
            <MaterialCommunityIcons name="shield-account" size={14} color="#FFFFFF" />
            <Text style={styles.roleText}>{user?.rol}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Accesos rápidos</Text>
        <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
          Navegá directamente a las secciones más usadas
        </Text>

        <View style={styles.grid}>
          {quickAccesses.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={[styles.accessCard, { backgroundColor: isDark ? palette.slate800 : palette.slate50, borderColor }]}
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.85}
            >
              <View style={styles.accessIconContainer}>
                <MaterialCommunityIcons name={item.icon} size={26} color={palette.primary} />
              </View>
              <Text style={[styles.accessTitle, { color: textPrimary }]}>{item.title}</Text>
              <Text style={[styles.accessDescription, { color: textSecondary }]} numberOfLines={2}>
                {item.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function getQuickAccesses(
  hasPermission: (scope: string) => boolean,
  isProfesional: boolean,
  isSocio: boolean
): QuickAccess[] {
  const allAccesses: QuickAccess[] = [
    {
      title: 'Métricas',
      description: 'Visualizá estadísticas y reportes',
      icon: 'chart-line',
      route: 'Metricas',
      scope: 'metricas:view',
    },
    {
      title: 'Turnero',
      description: 'Gestioná clases y turnos',
      icon: 'calendar-clock',
      route: 'Turnero',
      scope: 'turnero:view',
    },
    {
      title: 'Socios',
      description: 'Administrá los socios del gimnasio',
      icon: 'account-group',
      route: 'Socios',
      scope: 'usuarios:view',
    },
    {
      title: 'Planes',
      description: 'Revisá tus planes de entrenamiento',
      icon: 'dumbbell',
      route: 'Planes',
      scope: 'planes:view',
    },
    {
      title: 'Suscripciones',
      description: 'Controlá vencimientos y pagos',
      icon: 'card-account-details',
      route: 'Suscripciones',
      scope: 'suscripciones:view',
    },
    {
      title: 'Evaluaciones',
      description: 'Seguimiento de progreso físico',
      icon: 'clipboard-text',
      route: 'Evaluaciones',
      scope: 'evaluaciones:view',
    },
    {
      title: 'Tutoriales',
      description: 'Aprendé técnicas y ejercicios',
      icon: 'video',
      route: 'Tutoriales',
      scope: 'tutoriales:view',
    },
  ];

  return allAccesses.filter((access) => {
    if (!access.scope) return true;
    return hasPermission(access.scope);
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
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
    backgroundColor: 'rgba(255,255,255,0.06)',
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
  accessCard: {
    width: '48%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    minHeight: 130,
  },
  accessIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(220,38,38,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  accessTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  accessDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
});
