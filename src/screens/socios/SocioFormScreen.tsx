import React, { useState, useEffect, useCallback } from 'react';
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
import DatePickerField from '../../components/common/DatePickerField';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { sociosService } from '../../services/api/socios.service';
import { rolService, RolData } from '../../services/api/rol.service';
import { useTheme } from '../../context/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';
import { palette } from '../../constants/colors';
import {
  isSocioCreateFormReadyToSubmit,
  isSocioCreateStepValid,
  isValidSocioEmail,
} from '../../utils/socioFormSteps';
import { HistoriaClinica } from '../../types/socios.types';

const STEPS = ['Personales', 'Contacto', 'Salud', 'Intereses'] as const;
type StepIndex = 1 | 2 | 3 | 4;

function rangoFechaNacimiento(): { min: Date; max: Date } {
  const max = new Date();
  const min = new Date();
  min.setFullYear(min.getFullYear() - 100);
  return { min, max };
}

function capitalizeName(s: string): string {
  const t = s.trim();
  if (!t) return '';
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

export default function SocioFormScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { isAdminUser } = usePermissions();

  const [currentStep, setCurrentStep] = useState<StepIndex>(1);
  const [touched, setTouched] = useState(false);
  const [roles, setRoles] = useState<RolData[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [idRol, setIdRol] = useState('');
  const [genero, setGenero] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [mail, setMail] = useState('');
  const [celular, setCelular] = useState('');
  const [calle, setCalle] = useState('');
  const [numero, setNumero] = useState('');
  const [piso, setPiso] = useState('');
  const [depto, setDepto] = useState('');
  const [tieneOS, setTieneOS] = useState(false);
  const [obraSocial, setObraSocial] = useState('');
  const [hc, setHc] = useState<HistoriaClinica>({
    antecedentes: false,
    cirugias: false,
    tratamiento: false,
    patologiaBase: false,
  });
  const [objetivo, setObjetivo] = useState('');
  const [areaInteres, setAreaInteres] = useState('');
  const [obs, setObs] = useState('');

  const bgColor = isDark ? palette.darkBg : palette.lightBg;
  const cardBg = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;

  useEffect(() => {
    Promise.all([
      rolService.getAllRoles().catch(() => []),
      sociosService.getDefaultSocioRolId().catch(() => ''),
    ])
      .then(([r, defaultRolId]) => {
        setRoles(r);
        if (!isAdminUser && defaultRolId) setIdRol(defaultRolId);
        else {
          const entrenado = r.find((x) => x.nombre_rol.toUpperCase() === 'ENTRENADO');
          if (entrenado) setIdRol(entrenado.id_rol);
          else if (defaultRolId) setIdRol(defaultRolId);
        }
      })
      .finally(() => setLoadingMeta(false));
  }, [isAdminUser]);

  const formFields = {
    nombre,
    apellido,
    dni,
    id_rol: idRol,
    genero,
    celular,
    mail,
  };

  const handleNext = () => {
    setTouched(true);
    if (!isSocioCreateStepValid(currentStep, formFields)) {
      setError(
        currentStep === 2 && mail && !isValidSocioEmail(mail)
          ? 'El correo debe ser @gmail.com, @hotmail.com, @yahoo.com o @icloud.com'
          : 'Completá los campos obligatorios del paso.'
      );
      return;
    }
    setError('');
    setTouched(false);
    setCurrentStep((s) => Math.min(s + 1, 4) as StepIndex);
  };

  const handleBack = () => {
    setError('');
    setTouched(false);
    if (currentStep === 1) navigation.goBack();
    else setCurrentStep((s) => (s - 1) as StepIndex);
  };

  const handleSubmit = async () => {
    setTouched(true);
    if (!isSocioCreateFormReadyToSubmit(formFields)) {
      setError('Revisá nombre, DNI, rol, género, celular y correo.');
      return;
    }
    if (!idRol) {
      setError('No se pudo determinar el rol.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await sociosService.create({
        nombre: capitalizeName(nombre),
        apellido: capitalizeName(apellido),
        dni: dni.trim(),
        id_rol: idRol,
        mail: mail.trim().toLowerCase(),
        password: dni.trim(),
        celular: celular.trim().startsWith('+') ? celular.trim() : `+54${celular.replace(/\D/g, '')}`,
        genero,
        ...(fechaNacimiento ? { fecha_nacimiento: fechaNacimiento } : {}),
        ...(calle.trim() ? { calle: calle.trim() } : {}),
        ...(numero.trim() ? { numero: numero.trim() } : {}),
        ...(piso.trim() ? { piso: piso.trim() } : {}),
        ...(depto.trim() ? { depto: depto.trim().toUpperCase() } : {}),
        ...(tieneOS && obraSocial.trim() ? { obra_social: obraSocial.trim() } : {}),
        historia_clinica: hc,
      });
      Alert.alert('Éxito', 'Usuario creado correctamente.');
      navigation.goBack();
    } catch (err: any) {
      setError(err?.message || 'No se pudo crear el usuario.');
    } finally {
      setLoading(false);
    }
  };

  const { min: fechaNacMin, max: fechaNacMax } = rangoFechaNacimiento();

  const renderStepIndicator = () => (
    <View style={styles.stepsRow}>
      {STEPS.map((label, index) => {
        const stepNum = (index + 1) as StepIndex;
        const done = currentStep > stepNum;
        const active = currentStep === stepNum;
        return (
          <View key={label} style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                {
                  backgroundColor: done || active ? palette.primary : cardBg,
                  borderColor: done || active ? palette.primary : borderColor,
                },
              ]}
            >
              {done ? (
                <MaterialCommunityIcons name="check" size={14} color="#FFF" />
              ) : (
                <Text style={{ color: active ? '#FFF' : textSecondary, fontWeight: '700', fontSize: 12 }}>
                  {stepNum}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                { color: active ? palette.primary : textSecondary, fontWeight: active ? '700' : '500' },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );

  const renderSelectChip = (
    label: string,
    value: string,
    options: { value: string; label: string }[],
    onChange: (v: string) => void
  ) => (
    <View style={styles.fieldBlock}>
      <Text style={[styles.fieldLabel, { color: textSecondary }]}>{label}</Text>
      <View style={styles.chipsRow}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.chip,
                {
                  borderColor: selected ? palette.primary : borderColor,
                  backgroundColor: selected ? `${palette.primary}15` : cardBg,
                },
              ]}
              onPress={() => onChange(opt.value)}
            >
              <Text style={{ color: selected ? palette.primary : textPrimary, fontWeight: '600', fontSize: 13 }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {touched && !value ? <Text style={styles.fieldError}>Seleccioná una opción</Text> : null}
    </View>
  );

  const renderHcToggle = (
    key: keyof HistoriaClinica,
    label: string,
    descKey?: keyof HistoriaClinica
  ) => (
    <View style={[styles.hcBox, { borderColor, backgroundColor: hc[key] ? `${palette.primary}08` : cardBg }]}>
      <TouchableOpacity
        style={styles.hcHeader}
        onPress={() => setHc((prev) => ({ ...prev, [key]: !prev[key] }))}
      >
        <MaterialCommunityIcons
          name={hc[key] ? 'checkbox-marked' : 'checkbox-blank-outline'}
          size={22}
          color={hc[key] ? palette.primary : textSecondary}
        />
        <Text style={[styles.hcLabel, { color: textPrimary }]}>{label}</Text>
      </TouchableOpacity>
      {descKey && hc[key] ? (
        <Input
          label="Detalle"
          value={(hc[descKey] as string) ?? ''}
          onChangeText={(t) => setHc((prev) => ({ ...prev, [descKey]: t }))}
          multiline
        />
      ) : null}
    </View>
  );

  if (loadingMeta) {
    return <Loader fullscreen message="Preparando formulario..." />;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: bgColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 8, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: textPrimary }]}>Nuevo usuario</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>Alta de socio o entrenado</Text>
        </View>
      </View>

      {renderStepIndicator()}

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {currentStep === 1 && (
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.sectionTitle, { color: palette.primary }]}>Datos personales</Text>
            <Input
              label="DNI *"
              value={dni}
              onChangeText={(t) => setDni(t.replace(/\D/g, '').slice(0, 8))}
              icon="card-account-details"
              keyboardType="numeric"
            />
            {touched && dni.length > 0 && dni.length < 8 ? (
              <Text style={styles.fieldError}>Mínimo 8 dígitos</Text>
            ) : null}

            {isAdminUser ? (
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>ROL *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipsRow}>
                    {roles.map((r) => {
                      const selected = idRol === r.id_rol;
                      return (
                        <TouchableOpacity
                          key={r.id_rol}
                          style={[
                            styles.chip,
                            {
                              borderColor: selected ? palette.primary : borderColor,
                              backgroundColor: selected ? `${palette.primary}15` : cardBg,
                            },
                          ]}
                          onPress={() => setIdRol(r.id_rol)}
                        >
                          <Text style={{ color: selected ? palette.primary : textPrimary, fontWeight: '600' }}>
                            {r.nombre_rol}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            ) : (
              <Input label="Rol" value="Socio / Entrenado" editable={false} icon="shield-account" />
            )}

            <Input label="Nombre *" value={nombre} onChangeText={setNombre} icon="account" />
            <Input label="Apellido *" value={apellido} onChangeText={setApellido} icon="account" />
            {renderSelectChip('Género *', genero, [
              { value: 'M', label: 'Masculino' },
              { value: 'F', label: 'Femenino' },
              { value: 'O', label: 'Otro' },
            ], setGenero)}
            <DatePickerField
              label="Fecha de nacimiento"
              value={fechaNacimiento}
              onChange={setFechaNacimiento}
              variant="form"
              clearable
              maximumDate={fechaNacMax}
              minimumDate={fechaNacMin}
              placeholder="Opcional"
            />
          </View>
        )}

        {currentStep === 2 && (
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.sectionTitle, { color: palette.primary }]}>Contacto y domicilio</Text>
            <Input
              label="Correo *"
              value={mail}
              onChangeText={setMail}
              icon="email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input label="Celular / WhatsApp *" value={celular} onChangeText={setCelular} icon="phone" keyboardType="phone-pad" />
            <Input label="Calle" value={calle} onChangeText={setCalle} icon="home" />
            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <Input label="Número" value={numero} onChangeText={setNumero} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Piso" value={piso} onChangeText={setPiso} />
              </View>
            </View>
            <Input label="Depto / Of." value={depto} onChangeText={setDepto} />

            <TouchableOpacity
              style={[styles.hcBox, { borderColor, backgroundColor: tieneOS ? `${palette.primary}08` : cardBg }]}
              onPress={() => setTieneOS((v) => !v)}
            >
              <View style={styles.hcHeader}>
                <MaterialCommunityIcons
                  name={tieneOS ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={22}
                  color={tieneOS ? palette.primary : textSecondary}
                />
                <Text style={[styles.hcLabel, { color: textPrimary }]}>¿Posee obra social?</Text>
              </View>
            </TouchableOpacity>
            {tieneOS ? (
              <Input label="Obra social / prepaga" value={obraSocial} onChangeText={setObraSocial} icon="hospital-box" />
            ) : null}
          </View>
        )}

        {currentStep === 3 && (
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.sectionTitle, { color: palette.primary }]}>Historia clínica</Text>
            {renderHcToggle('antecedentes', 'Antecedentes de lesiones', 'antecedentes_desc')}
            {renderHcToggle('cirugias', 'Cirugías previas', 'cirugias_desc')}
            {renderHcToggle('tratamiento', 'Tratamiento médico actual', 'tratamiento_desc')}
            {renderHcToggle('patologiaBase', 'Patología de base', 'patologiaBase_desc')}
          </View>
        )}

        {currentStep === 4 && (
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.sectionTitle, { color: palette.primary }]}>Intereses</Text>
            {renderSelectChip('Objetivo principal', objetivo, [
              { value: 'Salud', label: 'Salud' },
              { value: 'Estética', label: 'Estética' },
              { value: 'Rendimiento', label: 'Rendimiento' },
            ], setObjetivo)}
            {renderSelectChip('Área de interés', areaInteres, [
              { value: 'Kinesiologia', label: 'Kinesiología' },
              { value: 'Readaptacion', label: 'Readaptación' },
              { value: 'Entrenamiento', label: 'Entrenamiento' },
            ], setAreaInteres)}
            <Input
              label="Objetivos y expectativas"
              value={obs}
              onChangeText={setObs}
              multiline
              icon="note-text"
            />
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: borderColor, paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleBack}>
          <Text style={[styles.secondaryBtnText, { color: textSecondary }]}>
            {currentStep === 1 ? 'Cancelar' : 'Anterior'}
          </Text>
        </TouchableOpacity>
        {currentStep < 4 ? (
          <Button title="Siguiente" onPress={handleNext} />
        ) : (
          <Button title="Finalizar" onPress={handleSubmit} loading={loading} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  backButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  stepsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 4,
  },
  stepItem: { flex: 1, alignItems: 'center' },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepLabel: { fontSize: 10, textAlign: 'center' },
  form: { padding: 16, paddingBottom: 24 },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: palette.primary,
    paddingLeft: 10,
  },
  fieldBlock: { marginBottom: 12 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  fieldError: { color: palette.error, fontSize: 12, marginBottom: 8 },
  hcBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  hcHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hcLabel: { fontSize: 14, fontWeight: '600', flex: 1 },
  rowInputs: { flexDirection: 'row', gap: 10 },
  errorText: { color: palette.error, fontSize: 13, marginTop: 8, textAlign: 'center' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  secondaryBtn: { paddingVertical: 14, paddingHorizontal: 8 },
  secondaryBtnText: { fontSize: 15, fontWeight: '600' },
});
