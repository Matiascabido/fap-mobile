import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
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
import { useNotifications } from '../../hooks/useNotifications';
import { useNavigationPreferences } from '../../context/NavigationPreferencesContext';
import { useLocalProfile } from '../../context/LocalProfileContext';
import QuickAccessGrid from '../../components/common/QuickAccessGrid';
import { navigateToModule } from '../../utils/navigateModule';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user, profilePhotoUrl } = useAuth();
  const { isSocioSinPlan } = usePermissions();
  const { colors, isDark } = useAppTheme();
  const { refreshNotifications, isRefreshing } = useNotifications();
  const { homeItems } = useNavigationPreferences();
  const { displayName, hasNickname } = useLocalProfile();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void refreshNotifications(true).finally(() => setRefreshing(false));
  }, [refreshNotifications]);

  const bgColor = useScreenBackground();
  const cardBg = isDark ? palette.darkCard : '#FFFFFF';
  const borderColor = isDark ? palette.darkBorder : palette.slate200;
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;

  const greeting = getGreeting();
  const today = formatLongDate(new Date());
  const rolLabel = getRolLabel(user);

  const isSocioSolo = isSocioSinPlan();
  const greetingName = hasNickname ? displayName : user?.nombre ?? 'usuario';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing || isRefreshing}
          onRefresh={onRefresh}
          colors={[colors.tint]}
          tintColor={colors.tint}
        />
      }
    >
      <View style={styles.heroWrap}>
        {profilePhotoUrl ? (
          <View style={styles.photoBannerWrap}>
            <Image
              source={{ uri: profilePhotoUrl }}
              style={styles.photoBanner}
              resizeMode="cover"
              accessibilityLabel="Tu foto de perfil"
            />
            <LinearGradient
              colors={['transparent', 'rgba(15, 23, 42, 0.92)']}
              style={styles.photoBannerFade}
            />
          </View>
        ) : null}

        <LinearGradient
          colors={['#0f172a', '#7f1d1d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.heroCard, profilePhotoUrl ? styles.heroCardWithPhoto : null]}
        >
          <View style={styles.heroBlob} />
          <View style={styles.heroBlob2} />
          <View style={styles.heroContent}>
            <Text style={styles.heroDate}>{capitalize(today).toUpperCase()}</Text>
            <Text style={styles.heroGreeting}>
              {greeting},{' '}
              <Text style={styles.heroName}>{greetingName}</Text>!
            </Text>
            <Text style={styles.heroSubtitle}>
              Personalizá tus accesos desde Más → Personalizar.
            </Text>
            <View style={styles.rolePill}>
              <MaterialCommunityIcons name="shield-account" size={14} color="#FFFFFF" />
              <Text style={styles.roleText}>{rolLabel}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {isSocioSolo && (
        <View style={[styles.infoBanner, { backgroundColor: `${palette.info}18`, borderColor: `${palette.info}40` }]}>
          <MaterialCommunityIcons name="information" size={18} color={palette.info} />
          <Text style={[styles.infoBannerText, { color: palette.info }]}>
            Accedé a los tutoriales y videos de entrenamiento disponibles para vos.
          </Text>
        </View>
      )}

      {homeItems.length > 0 ? (
        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Accesos fijados</Text>
          <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
            Secciones que elegiste mostrar en Inicio
          </Text>
          <QuickAccessGrid
            items={homeItems}
            onPress={(route) => navigateToModule(navigation.getParent() ?? navigation, route)}
          />
        </View>
      ) : null}
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
  heroWrap: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  photoBannerWrap: {
    width: '100%',
    height: 148,
    backgroundColor: palette.slate800,
  },
  photoBanner: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  photoBannerFade: {
    ...StyleSheet.absoluteFillObject,
  },
  heroCard: {
    overflow: 'hidden',
  },
  heroCardWithPhoto: {
    marginTop: -4,
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
});
