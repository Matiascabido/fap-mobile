import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Input from '../../components/common/Input';
import { useAuth } from '../../hooks/useAuth';
import { palette } from '../../constants/colors';
import { storage, STORAGE_KEYS } from '../../services/api/storage';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadRemembered = async () => {
      const savedUser = await storage.get(STORAGE_KEYS.REMEMBER_USER);
      const savedPass = await storage.get(STORAGE_KEYS.REMEMBER_PASS);
      if (savedUser) {
        setUsuario(savedUser);
        setRemember(true);
      }
      if (savedPass) {
        setPassword(savedPass);
      }
    };
    loadRemembered();
  }, []);

  const handleLogin = async () => {
    setError('');

    if (!usuario.trim() || !password.trim()) {
      setError('Por favor, completá todos los campos.');
      return;
    }

    setLoading(true);
    try {
      await login(usuario.trim(), password);

      if (remember) {
        await storage.set(STORAGE_KEYS.REMEMBER_USER, usuario);
        await storage.set(STORAGE_KEYS.REMEMBER_PASS, password);
      } else {
        await storage.remove(STORAGE_KEYS.REMEMBER_USER);
        await storage.remove(STORAGE_KEYS.REMEMBER_PASS);
      }
    } catch (err: any) {
      setError(err?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#172554']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, styles.orbRed]} />
      <View style={[styles.orb, styles.orbBlue]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 16,
              paddingBottom: insets.bottom + 24,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.logoOuter}>
              <LinearGradient
                colors={[palette.primary, palette.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoRing}
              >
                <View style={styles.logoInner}>
                  <MaterialCommunityIcons name="dumbbell" size={40} color={palette.primary} />
                </View>
              </LinearGradient>
            </View>
            <Text style={styles.brandTitle}>FAP</Text>
            <Text style={styles.brandSubtitle}>Funcional Alta Performance</Text>
            <Text style={styles.heroHint}>Tu entrenamiento, en un solo lugar</Text>
          </View>

          <View style={styles.card}>
            {loading ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={palette.primary} />
                <Text style={styles.loadingText}>Iniciando sesión…</Text>
              </View>
            ) : null}

            <Text style={styles.cardTitle}>Bienvenidos</Text>
            <Text style={styles.cardSubtitle}>Ingresá tus credenciales para continuar</Text>

            <View style={styles.form}>
              <Input
                label="Usuario o correo"
                placeholder="Ingresá tu usuario"
                value={usuario}
                onChangeText={(text) => {
                  setUsuario(text);
                  if (error) setError('');
                }}
                icon="account-outline"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!loading}
                surface="light"
              />

              <Input
                label="Contraseña"
                placeholder="Ingresá tu contraseña"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError('');
                }}
                icon="lock-outline"
                isPassword
                editable={!loading}
                surface="light"
              />

              <TouchableOpacity
                style={styles.rememberContainer}
                onPress={() => setRemember((prev) => !prev)}
                disabled={loading}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.rememberCheck,
                    remember && styles.rememberCheckActive,
                  ]}
                >
                  {remember ? (
                    <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                  ) : null}
                </View>
                <Text style={styles.rememberText}>Recordarme en este dispositivo</Text>
              </TouchableOpacity>

              {error ? (
                <View style={styles.errorBanner}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={18} color={palette.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
                style={styles.loginButtonWrap}
              >
                <LinearGradient
                  colors={
                    loading
                      ? [palette.slate400, palette.slate500]
                      : [palette.primary, '#B91C1C']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <View style={styles.loginButtonContent}>
                      <Text style={styles.loginButtonText}>Ingresar</Text>
                      <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.footer}>Acceso exclusivo para socios y staff del club</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.slate900,
  },
  flex: {
    flex: 1,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbRed: {
    width: 280,
    height: 280,
    top: -80,
    right: -100,
    backgroundColor: palette.primary,
    opacity: 0.14,
  },
  orbBlue: {
    width: 220,
    height: 220,
    bottom: 120,
    left: -90,
    backgroundColor: '#3B82F6',
    opacity: 0.1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  hero: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  logoOuter: {
    marginBottom: 16,
  },
  logoRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  logoInner: {
    flex: 1,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  brandSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.82)',
    letterSpacing: 0.3,
  },
  heroHint: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
  },
  card: {
    marginTop: 28,
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 14,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate500,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.slate900,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: palette.slate500,
    marginTop: 6,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: palette.slate50,
  },
  rememberCheck: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: palette.slate300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  rememberCheckActive: {
    borderColor: palette.primary,
    backgroundColor: palette.primary,
  },
  rememberText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 10,
    color: palette.slate600,
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  loginButtonWrap: {
    marginTop: 4,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  loginGradient: {
    minHeight: 52,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});
