import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import { sugerenciaEjercicioService } from '../../services/api/sugerenciaEjercicio.service';
import { buildSugerenciaEjercicioPayload } from '../../utils/buildSugerenciaEjercicioPayload';
import { getYouTubeVideoId, isYouTubePageUrl } from '../../utils/youtubeEmbed';
import { userContactFromAuth } from '../../utils/userContact';
import { useAuth } from '../../hooks/useAuth';
import TelefonoGuardadoReadonly from './TelefonoGuardadoReadonly';

const GRUPO_OTRO_VALUE = '__otro__';

interface Props {
  gruposDisponibles: string[];
  userTelefono?: string;
  compact?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function SugerirEjercicioForm({
  gruposDisponibles,
  userTelefono = '',
  compact = false,
  onSuccess,
  onCancel,
}: Props) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [grupoSelect, setGrupoSelect] = useState('');
  const [grupoOtro, setGrupoOtro] = useState('');
  const [enlaceYoutube, setEnlaceYoutube] = useState('');
  const [comentarios, setComentarios] = useState('');

  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.slate200;
  const inputBg = isDark ? palette.slate800 : '#FFFFFF';

  const resetForm = () => {
    setNombre('');
    setDescripcion('');
    setGrupoSelect('');
    setGrupoOtro('');
    setEnlaceYoutube('');
    setComentarios('');
  };

  const resolveExerciceGroup = (): string | null => {
    if (!grupoSelect || grupoSelect === GRUPO_OTRO_VALUE) return null;
    return grupoSelect;
  };

  const handleSubmit = useCallback(async () => {
    if (enviando) return;

    const nombreTrim = nombre.trim();
    const descripcionTrim = descripcion.trim();
    if (!nombreTrim) {
      Alert.alert('Atención', 'Completá el nombre del ejercicio.');
      return;
    }
    if (!descripcionTrim) {
      Alert.alert('Atención', 'Completá la descripción.');
      return;
    }
    if (grupoSelect === GRUPO_OTRO_VALUE && !grupoOtro.trim()) {
      Alert.alert('Atención', 'Indicá el grupo muscular o elegí uno del listado.');
      return;
    }

    const ytTrim = enlaceYoutube.trim();
    if (ytTrim) {
      if (!isYouTubePageUrl(ytTrim)) {
        Alert.alert('Atención', 'El enlace debe ser de YouTube (youtube.com o youtu.be).');
        return;
      }
      if (!getYouTubeVideoId(ytTrim)) {
        Alert.alert(
          'Atención',
          'No se pudo leer el ID del video. Probá un enlace watch, shorts o youtu.be.'
        );
        return;
      }
    }

    const contact = userContactFromAuth(user, userTelefono);
    if (!contact.userId) {
      Alert.alert('Error', 'No se pudo identificar tu usuario. Volvé a iniciar sesión.');
      return;
    }
    if (!contact.userMail) {
      Alert.alert('Error', 'Tu perfil no tiene mail configurado.');
      return;
    }

    setEnviando(true);
    try {
      let comentariosFinal = comentarios.trim();
      if (grupoSelect === GRUPO_OTRO_VALUE && grupoOtro.trim()) {
        comentariosFinal = comentariosFinal
          ? `${comentariosFinal}\n\nGrupo muscular: ${grupoOtro.trim()}`
          : `Grupo muscular: ${grupoOtro.trim()}`;
      }

      await sugerenciaEjercicioService.enviar(
        buildSugerenciaEjercicioPayload({
          user: contact,
          nombre: nombreTrim,
          descripcion: descripcionTrim,
          comentarios: comentariosFinal,
          enlaceYoutube: ytTrim,
          exerciceGroup: resolveExerciceGroup(),
        })
      );
      resetForm();
      onSuccess?.();
      Alert.alert('¡Gracias!', 'Sugerencia enviada. Recibirás confirmación por mail.');
    } catch {
      Alert.alert('Error', 'No se pudo enviar la sugerencia. Intentá de nuevo.');
    } finally {
      setEnviando(false);
    }
  }, [
    enviando,
    nombre,
    descripcion,
    grupoSelect,
    grupoOtro,
    enlaceYoutube,
    comentarios,
    user,
    userTelefono,
    onSuccess,
  ]);

  const inputStyle = [
    styles.input,
    compact && styles.inputCompact,
    { backgroundColor: inputBg, borderColor, color: textPrimary },
  ];

  return (
    <View style={[styles.form, compact && styles.formCompact]}>
      {userTelefono.trim() ? (
        <TelefonoGuardadoReadonly telefono={userTelefono} compact={compact} />
      ) : null}

      <Field label="Nombre del ejercicio" required>
        <TextInput
          style={inputStyle}
          placeholder="Ej: Sentadilla búlgara"
          placeholderTextColor={textSecondary}
          value={nombre}
          onChangeText={setNombre}
          editable={!enviando}
        />
      </Field>

      <Field label="Descripción" required>
        <TextInput
          style={[...inputStyle, styles.textarea]}
          placeholder="Objetivo, variantes, músculos trabajados…"
          placeholderTextColor={textSecondary}
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          numberOfLines={compact ? 3 : 4}
          editable={!enviando}
        />
      </Field>

      <Field label="Grupo muscular">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          <TouchableOpacity
            style={[
              styles.chip,
              {
                backgroundColor: !grupoSelect ? palette.primary : inputBg,
                borderColor: !grupoSelect ? palette.primary : borderColor,
              },
            ]}
            onPress={() => setGrupoSelect('')}
            disabled={enviando}
          >
            <Text style={[styles.chipText, { color: !grupoSelect ? '#FFF' : textSecondary }]}>
              Sin especificar
            </Text>
          </TouchableOpacity>
          {gruposDisponibles.map((g) => {
            const active = grupoSelect === g;
            return (
              <TouchableOpacity
                key={g}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? palette.primary : inputBg,
                    borderColor: active ? palette.primary : borderColor,
                  },
                ]}
                onPress={() => setGrupoSelect(g)}
                disabled={enviando}
              >
                <Text style={[styles.chipText, { color: active ? '#FFF' : textSecondary }]}>
                  {g}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[
              styles.chip,
              {
                backgroundColor: grupoSelect === GRUPO_OTRO_VALUE ? palette.primary : inputBg,
                borderColor: grupoSelect === GRUPO_OTRO_VALUE ? palette.primary : borderColor,
              },
            ]}
            onPress={() => setGrupoSelect(GRUPO_OTRO_VALUE)}
            disabled={enviando}
          >
            <Text
              style={[
                styles.chipText,
                { color: grupoSelect === GRUPO_OTRO_VALUE ? '#FFF' : textSecondary },
              ]}
            >
              Otro…
            </Text>
          </TouchableOpacity>
        </ScrollView>
        {grupoSelect === GRUPO_OTRO_VALUE ? (
          <TextInput
            style={[...inputStyle, styles.mt8]}
            placeholder="Nombre del grupo"
            placeholderTextColor={textSecondary}
            value={grupoOtro}
            onChangeText={setGrupoOtro}
            editable={!enviando}
          />
        ) : null}
      </Field>

      <Field label="Enlace YouTube" optional>
        <TextInput
          style={inputStyle}
          placeholder="https://www.youtube.com/watch?v=…"
          placeholderTextColor={textSecondary}
          value={enlaceYoutube}
          onChangeText={setEnlaceYoutube}
          autoCapitalize="none"
          keyboardType="url"
          editable={!enviando}
        />
        {enlaceYoutube.trim() && !isYouTubePageUrl(enlaceYoutube.trim()) ? (
          <Text style={styles.fieldError}>Solo se permiten enlaces de YouTube.</Text>
        ) : null}
      </Field>

      <Field label="Comentarios adicionales">
        <TextInput
          style={[...inputStyle, styles.textareaSmall]}
          placeholder="Notas para el equipo, referencias, etc."
          placeholderTextColor={textSecondary}
          value={comentarios}
          onChangeText={setComentarios}
          multiline
          numberOfLines={2}
          editable={!enviando}
        />
      </Field>

      <View style={styles.actions}>
        {onCancel ? (
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor }]}
            onPress={onCancel}
            disabled={enviando}
          >
            <Text style={[styles.cancelText, { color: textSecondary }]}>Cancelar</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            onCancel ? styles.submitBtnFlex : styles.submitBtnFull,
            enviando && styles.btnDisabled,
          ]}
          onPress={() => void handleSubmit()}
          disabled={enviando}
        >
          {enviando ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="dumbbell" size={14} color="#FFFFFF" />
              <Text style={styles.submitText}>Enviar sugerencia</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Field({
  label,
  required,
  optional,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
        {optional ? <Text style={styles.optional}> (opcional)</Text> : null}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  formCompact: { gap: 12 },
  field: { gap: 4 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: palette.slate400,
  },
  required: { color: palette.primary },
  optional: {
    fontWeight: '500',
    textTransform: 'none',
    letterSpacing: 0,
    color: palette.slate300,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputCompact: {
    fontSize: 14,
    paddingVertical: 8,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textareaSmall: {
    minHeight: 56,
    textAlignVertical: 'top',
  },
  pickerWrap: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  chipsScroll: {
    marginBottom: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  mt8: { marginTop: 8 },
  fieldError: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.error,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnFlex: { flex: 2 },
  submitBtnFull: { flex: 1 },
  submitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  btnDisabled: { opacity: 0.5 },
});
