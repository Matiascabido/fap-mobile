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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
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
      await login(usuario, password);

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
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#dc2626']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={palette.primary} />
                <Text style={styles.loadingText}>Iniciando sesión…</Text>
              </View>
            )}

            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>FAP</Text>
              </View>
            </View>

            <Text style={styles.title}>Bienvenidos</Text>
            <Text style={styles.subtitle}>Ingresá tus credenciales para continuar</Text>

            <View style={styles.form}>
              <Input
                label="Usuario"
                placeholder="Ingresá tu usuario"
                value={usuario}
                onChangeText={(text) => {
                  setUsuario(text);
                  if (error) setError('');
                }}
                icon="account"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!loading}
              />

              <Input
                label="Contraseña"
                placeholder="Ingresá tu contraseña"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError('');
                }}
                icon="lock"
                isPassword
                editable={!loading}
              />

              <TouchableOpacity
                style={styles.rememberContainer}
                onPress={() => setRemember((prev) => !prev)}
                disabled={loading}
              >
                <MaterialCommunityIcons
                  name={remember ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={22}
                  color={remember ? palette.primary : palette.slate400}
                />
                <Text style={styles.rememberText}>Recordarme</Text>
              </TouchableOpacity>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Button
                title="Ingresar"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.loginButton}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate500,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: palette.slate500,
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rememberText: {
    fontSize: 14,
    marginLeft: 8,
    color: palette.slate500,
  },
  errorText: {
    color: palette.error,
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 4,
  },
});
