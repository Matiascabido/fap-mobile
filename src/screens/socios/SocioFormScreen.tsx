import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { sociosService } from '../../services/api/socios.service';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';

export default function SocioFormScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const [idRol, setIdRol] = useState('');
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [mail, setMail] = useState('');
  const [celular, setCelular] = useState('');
  const [password, setPassword] = useState('');

  const bgColor = isDark ? palette.darkBg : palette.lightBg;
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;

  useEffect(() => {
    sociosService
      .getDefaultSocioRolId()
      .then(setIdRol)
      .catch(() => setError('No se pudo cargar la configuración de roles.'))
      .finally(() => setLoadingMeta(false));
  }, []);

  const handleSubmit = async () => {
    setError('');
    if (!nombre.trim() || !apellido.trim() || !dni.trim() || !mail.trim()) {
      setError('Completá nombre, apellido, DNI y correo.');
      return;
    }
    if (!idRol) {
      setError('No se pudo determinar el rol de socio.');
      return;
    }

    setLoading(true);
    try {
      await sociosService.create({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim(),
        id_rol: idRol,
        mail: mail.trim(),
        password: password.trim() || dni.trim(),
        celular: celular.trim() || undefined,
        historia_clinica: {
          antecedentes: false,
          cirugias: false,
          tratamiento: false,
          patologiaBase: false,
        },
      });
      Alert.alert('Éxito', 'Socio creado correctamente.');
      navigation.goBack();
    } catch (err: any) {
      setError(err?.message || 'No se pudo crear el socio.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingMeta) {
    return <Loader fullscreen message="Preparando formulario..." />;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: bgColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textPrimary }]}>Nuevo socio</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Input label="Nombre *" value={nombre} onChangeText={setNombre} icon="account" />
        <Input label="Apellido *" value={apellido} onChangeText={setApellido} icon="account" />
        <Input
          label="DNI *"
          value={dni}
          onChangeText={setDni}
          icon="card-account-details"
          keyboardType="numeric"
        />
        <Input
          label="Correo *"
          value={mail}
          onChangeText={setMail}
          icon="email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input label="Celular" value={celular} onChangeText={setCelular} icon="phone" keyboardType="phone-pad" />
        <Input
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          icon="lock"
          isPassword
          placeholder="Opcional (por defecto usa el DNI)"
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button title="Crear socio" onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: { padding: 4 },
  title: { fontSize: 17, fontWeight: '600' },
  form: { padding: 16, paddingBottom: 40 },
  errorText: { color: palette.error, fontSize: 13, marginBottom: 12, textAlign: 'center' },
});
