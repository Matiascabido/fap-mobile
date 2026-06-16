import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/common/Input';
import DatePickerField from '../../components/common/DatePickerField';
import Loader from '../../components/common/Loader';
import GroupedSection from '../../components/common/GroupedSection';
import { sociosService } from '../../services/api/socios.service';
import { rolService, RolData } from '../../services/api/rol.service';
import { useAppTheme } from '../../context/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';
import { palette } from '../../constants/colors';
import { typography } from '../../theme/iosTheme';
import {
  isSocioCreateFormReadyToSubmit,
  isSocioCreateStepValid,
  isValidSocioEmail,
} from '../../utils/socioFormSteps';
import { HistoriaClinica } from '../../types/socios.types';

const STEPS = ['Personales', 'Contacto', 'Salud', 'Intereses'] as const;
type StepIndex = 1 | 2 | 3 | 4;

const STEP_HINTS: Record<StepIndex, string> = {
  1: 'Identificá al nuevo socio con DNI, nombre y datos básicos.',
  2: 'Correo y celular son obligatorios para el acceso a la app.',
  3: 'Marcá lo que aplique. Podés detallar cada ítem.',
  4: 'Opcional — ayuda a personalizar el seguimiento.',
};

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
  const { colors } = useAppTheme();
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

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Nuevo socio' });
  }, [navigation]);

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
  const stepIndex = currentStep - 1;
  const progress = currentStep / STEPS.length;

  const renderStepIndicator = () => (
    <View
      style={[
        styles.stepHeader,
        {
          backgroundColor: colors.secondaryGroupedBackground,
          borderBottomColor: colors.separator,
        },
      ]}
    >
      <View style={styles.progressRow}>
        <Text style={[styles.progressLabel, { color: colors.secondaryLabel }]}>
          Paso {currentStep} de {STEPS.length}
        </Text>
        <Text style={[styles.progressLabel, { color: colors.tint, fontWeight: '700' }]}>
          {STEPS[stepIndex]}
        </Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.fill }]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.tint }]} />
      </View>

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
                    backgroundColor: done || active ? colors.tint : colors.tertiaryGroupedBackground,
                    borderColor: done || active ? colors.tint : colors.separator,
                  },
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                ) : (
                  <Text
                    style={[
                      styles.stepNum,
                      { color: active ? '#FFF' : colors.secondaryLabel },
                    ]}
                  >
                    {stepNum}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: active ? colors.tint : colors.secondaryLabel,
                    fontWeight: active ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
              {index < STEPS.length - 1 ? (
                <View
                  style={[
                    styles.stepLine,
                    { backgroundColor: done ? colors.tint : colors.separator },
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>

      <Text style={[styles.stepHint, { color: colors.secondaryLabel }]}>
        {STEP_HINTS[currentStep]}
      </Text>
    </View>
  );

  const renderChoiceChips = (
    label: string,
    value: string,
    options: { value: string; label: string }[],
    onChange: (v: string) => void,
    required?: boolean
  ) => (
    <View style={styles.choiceBlock}>
      <Text style={[styles.choiceLabel, typography.sectionHeader, { color: colors.secondaryLabel }]}>
        {label}
      </Text>
      <View style={styles.chipsRow}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.choiceChip,
                {
                  backgroundColor: selected ? colors.tint : colors.tertiaryGroupedBackground,
                  borderColor: selected ? colors.tint : colors.separator,
                },
              ]}
              onPress={() => onChange(opt.value)}
            >
              <Text
                style={[
                  styles.choiceChipText,
                  { color: selected ? '#FFFFFF' : colors.label },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {touched && required && !value ? (
        <Text style={styles.fieldError}>Seleccioná una opción</Text>
      ) : null}
    </View>
  );

  const renderHcToggle = (
    key: keyof HistoriaClinica,
    label: string,
    descKey?: keyof HistoriaClinica,
    isLast?: boolean
  ) => (
    <View>
      <TouchableOpacity
        style={[
          styles.listRow,
          !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
          hc[key] && { backgroundColor: `${colors.tint}08` },
        ]}
        onPress={() => setHc((prev) => ({ ...prev, [key]: !prev[key] }))}
      >
        <Ionicons
          name={hc[key] ? 'checkbox' : 'square-outline'}
          size={22}
          color={hc[key] ? colors.tint : colors.tertiaryLabel}
        />
        <Text style={[styles.listRowText, typography.body, { color: colors.label }]}>{label}</Text>
      </TouchableOpacity>
      {descKey && hc[key] ? (
        <View style={[styles.hcDetail, { borderBottomColor: colors.separator }]}>
          <Input
            label="Detalle"
            value={(hc[descKey] as string) ?? ''}
            onChangeText={(t) => setHc((prev) => ({ ...prev, [descKey]: t }))}
            multiline
          />
        </View>
      ) : null}
    </View>
  );

  if (loadingMeta) {
    return <Loader fullscreen message="Preparando formulario..." />;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.groupedBackground }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {renderStepIndicator()}

      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 1 && (
          <>
            <GroupedSection title="Identificación">
              <View style={styles.sectionBody}>
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
              </View>
            </GroupedSection>

            {isAdminUser ? (
              <GroupedSection title="Rol *">
                <View style={styles.roleList}>
                  {roles.map((r, index) => {
                    const selected = idRol === r.id_rol;
                    return (
                      <TouchableOpacity
                        key={r.id_rol}
                        style={[
                          styles.listRow,
                          index < roles.length - 1 && {
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderBottomColor: colors.separator,
                          },
                          selected && { backgroundColor: `${colors.tint}10` },
                        ]}
                        onPress={() => setIdRol(r.id_rol)}
                      >
                        <Ionicons
                          name={selected ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={selected ? colors.tint : colors.tertiaryLabel}
                        />
                        <Text style={[styles.listRowText, typography.body, { color: colors.label }]}>
                          {r.nombre_rol}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </GroupedSection>
            ) : (
              <GroupedSection title="Rol">
                <View style={styles.sectionBody}>
                  <Input label="Rol asignado" value="Socio / Entrenado" editable={false} icon="shield-account" />
                </View>
              </GroupedSection>
            )}

            <GroupedSection title="Datos personales">
              <View style={styles.sectionBody}>
                <Input label="Nombre *" value={nombre} onChangeText={setNombre} icon="account" />
                <Input label="Apellido *" value={apellido} onChangeText={setApellido} icon="account" />
                {renderChoiceChips(
                  'Género *',
                  genero,
                  [
                    { value: 'M', label: 'Masculino' },
                    { value: 'F', label: 'Femenino' },
                    { value: 'O', label: 'Otro' },
                  ],
                  setGenero,
                  true
                )}
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
            </GroupedSection>
          </>
        )}

        {currentStep === 2 && (
          <>
            <GroupedSection
              title="Contacto"
              footer="El correo debe ser @gmail.com, @hotmail.com, @yahoo.com o @icloud.com"
            >
              <View style={styles.sectionBody}>
                <Input
                  label="Correo *"
                  value={mail}
                  onChangeText={setMail}
                  icon="email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Input
                  label="Celular / WhatsApp *"
                  value={celular}
                  onChangeText={setCelular}
                  icon="phone"
                  keyboardType="phone-pad"
                />
              </View>
            </GroupedSection>

            <GroupedSection title="Domicilio">
              <View style={styles.sectionBody}>
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
              </View>
            </GroupedSection>

            <GroupedSection title="Obra social">
              <TouchableOpacity
                style={[
                  styles.listRow,
                  tieneOS && { backgroundColor: `${colors.tint}08` },
                ]}
                onPress={() => setTieneOS((v) => !v)}
              >
                <Ionicons
                  name={tieneOS ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={tieneOS ? colors.tint : colors.tertiaryLabel}
                />
                <Text style={[styles.listRowText, typography.body, { color: colors.label }]}>
                  ¿Posee obra social?
                </Text>
              </TouchableOpacity>
              {tieneOS ? (
                <View style={[styles.sectionBody, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }]}>
                  <Input
                    label="Obra social / prepaga"
                    value={obraSocial}
                    onChangeText={setObraSocial}
                    icon="hospital-box"
                  />
                </View>
              ) : null}
            </GroupedSection>
          </>
        )}

        {currentStep === 3 && (
          <GroupedSection
            title="Historia clínica"
            footer="Esta información ayuda al profesional a adaptar el plan de entrenamiento."
          >
            {renderHcToggle('antecedentes', 'Antecedentes de lesiones', 'antecedentes_desc')}
            {renderHcToggle('cirugias', 'Cirugías previas', 'cirugias_desc')}
            {renderHcToggle('tratamiento', 'Tratamiento médico actual', 'tratamiento_desc')}
            {renderHcToggle('patologiaBase', 'Patología de base', 'patologiaBase_desc', true)}
          </GroupedSection>
        )}

        {currentStep === 4 && (
          <>
            <GroupedSection title="Objetivos">
              <View style={styles.sectionBody}>
                {renderChoiceChips(
                  'Objetivo principal',
                  objetivo,
                  [
                    { value: 'Salud', label: 'Salud' },
                    { value: 'Estética', label: 'Estética' },
                    { value: 'Rendimiento', label: 'Rendimiento' },
                  ],
                  setObjetivo
                )}
                {renderChoiceChips(
                  'Área de interés',
                  areaInteres,
                  [
                    { value: 'Kinesiologia', label: 'Kinesiología' },
                    { value: 'Readaptacion', label: 'Readaptación' },
                    { value: 'Entrenamiento', label: 'Entrenamiento' },
                  ],
                  setAreaInteres
                )}
              </View>
            </GroupedSection>

            <GroupedSection title="Expectativas">
              <View style={styles.sectionBody}>
                <Input
                  label="Objetivos y expectativas"
                  value={obs}
                  onChangeText={setObs}
                  multiline
                  icon="note-text"
                />
              </View>
            </GroupedSection>
          </>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.secondaryGroupedBackground,
            borderTopColor: colors.separator,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <TouchableOpacity style={styles.footerBack} onPress={handleBack} disabled={loading}>
          {currentStep > 1 ? (
            <>
              <Ionicons name="chevron-back" size={18} color={colors.secondaryLabel} />
              <Text style={[styles.footerBackText, { color: colors.secondaryLabel }]}>Anterior</Text>
            </>
          ) : (
            <Text style={[styles.footerBackText, { color: colors.secondaryLabel }]}>Cancelar</Text>
          )}
        </TouchableOpacity>

        {currentStep < 4 ? (
          <TouchableOpacity
            style={[styles.footerPrimary, { backgroundColor: colors.tint }]}
            onPress={handleNext}
          >
            <Text style={styles.footerPrimaryText}>Siguiente</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.footerPrimary, { backgroundColor: colors.tint }, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                <Text style={styles.footerPrimaryText}>Finalizar</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stepHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: { fontSize: 13, fontWeight: '600' },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: { height: '100%', borderRadius: 2 },
  stepsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  stepItem: { flex: 1, alignItems: 'center', position: 'relative' },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepNum: { fontSize: 12, fontWeight: '700' },
  stepLabel: { fontSize: 10, textAlign: 'center' },
  stepLine: {
    position: 'absolute',
    top: 14,
    left: '58%',
    width: '84%',
    height: 2,
    zIndex: -1,
  },
  stepHint: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  form: { padding: 16, paddingBottom: 24 },
  sectionBody: { padding: 12, gap: 4 },
  choiceBlock: { marginBottom: 8 },
  choiceLabel: { marginBottom: 8, marginLeft: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceChip: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  choiceChipText: { fontSize: 14, fontWeight: '600' },
  roleList: {},
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  listRowText: { flex: 1 },
  hcDetail: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowInputs: { flexDirection: 'row', gap: 10 },
  fieldError: { color: palette.error, fontSize: 12, marginBottom: 4, marginLeft: 4 },
  errorText: { color: palette.error, fontSize: 13, marginTop: 8, textAlign: 'center' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 4,
    minWidth: 90,
  },
  footerBackText: { fontSize: 16, fontWeight: '600' },
  footerPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    minHeight: 48,
  },
  footerPrimaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
