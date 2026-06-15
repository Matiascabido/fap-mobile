import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { palette } from '../../constants/colors';
import { mensajeContactoService } from '../../services/api/mensajeContacto.service';
import { sugerenciaEjercicioService } from '../../services/api/sugerenciaEjercicio.service';
import { tutorialesService } from '../../services/api/tutoriales.service';

// ─── Validación YouTube ─────────────────────────────────────────────────────

function isYouTubeUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url.trim());
}

// ─── Modal: Sugerir Ejercicio ────────────────────────────────────────────────

interface SugerirEjercicioModalProps {
  visible: boolean;
  onClose: () => void;
}

function SugerirEjercicioModal({ visible, onClose }: SugerirEjercicioModalProps) {
  const { isDark } = useTheme();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [grupoSel, setGrupoSel] = useState('');
  const [grupoOtro, setGrupoOtro] = useState('');
  const [urlYoutube, setUrlYoutube] = useState('');
  const [grupos, setGrupos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingGrupos, setLoadingGrupos] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const bgColor = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;
  const inputBg = isDark ? palette.slate800 : palette.slate50;

  React.useEffect(() => {
    if (visible && grupos.length === 0) {
      setLoadingGrupos(true);
      tutorialesService
        .getGrupos()
        .then(setGrupos)
        .catch(() => {})
        .finally(() => setLoadingGrupos(false));
    }
  }, [visible]);

  const reset = () => {
    setNombre('');
    setDescripcion('');
    setGrupoSel('');
    setGrupoOtro('');
    setUrlYoutube('');
    setErrors({});
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!nombre.trim()) errs.nombre = 'El nombre es obligatorio';
    if (!descripcion.trim()) errs.descripcion = 'La descripción es obligatoria';
    if (!grupoSel) errs.grupo = 'Seleccioná un grupo muscular';
    if (grupoSel === 'otro' && !grupoOtro.trim())
      errs.grupoOtro = 'Especificá el grupo muscular';
    if (urlYoutube.trim() && !isYouTubeUrl(urlYoutube))
      errs.url = 'La URL debe ser de YouTube (youtube.com o youtu.be)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await sugerenciaEjercicioService.enviar({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        grupo_muscular: grupoSel === 'otro' ? grupoOtro.trim() : grupoSel,
        grupo_otro: grupoSel === 'otro' ? grupoOtro.trim() : undefined,
        url_youtube: urlYoutube.trim() || undefined,
      });
      Alert.alert('¡Gracias!', 'Tu sugerencia fue enviada correctamente.');
      handleClose();
    } catch {
      Alert.alert('Error', 'No se pudo enviar la sugerencia. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const gruposConOtro = [...grupos, 'otro'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalSheet, { backgroundColor: bgColor }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={styles.modalIconWrap}>
              <MaterialCommunityIcons name="dumbbell" size={22} color={palette.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: textPrimary }]}>
              Sugerir ejercicio
            </Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close" size={24} color={textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalBody}
            keyboardShouldPersistTaps="handled"
          >
            <FieldLabel label="Nombre del ejercicio *" color={textSecondary} />
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, borderColor: errors.nombre ? palette.error : borderColor, color: textPrimary },
              ]}
              placeholder="Ej: Sentadilla búlgara"
              placeholderTextColor={textSecondary}
              value={nombre}
              onChangeText={(t) => { setNombre(t); setErrors((e) => ({ ...e, nombre: '' })); }}
              maxLength={100}
            />
            {errors.nombre ? <FieldError msg={errors.nombre} /> : null}

            <FieldLabel label="Descripción *" color={textSecondary} />
            <TextInput
              style={[
                styles.input,
                styles.textarea,
                { backgroundColor: inputBg, borderColor: errors.descripcion ? palette.error : borderColor, color: textPrimary },
              ]}
              placeholder="Describí cómo se realiza el ejercicio"
              placeholderTextColor={textSecondary}
              value={descripcion}
              onChangeText={(t) => { setDescripcion(t); setErrors((e) => ({ ...e, descripcion: '' })); }}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
            {errors.descripcion ? <FieldError msg={errors.descripcion} /> : null}

            <FieldLabel label="Grupo muscular *" color={textSecondary} />
            {loadingGrupos ? (
              <ActivityIndicator color={palette.primary} style={{ marginVertical: 8 }} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {gruposConOtro.map((g) => {
                  const isActive = grupoSel === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isActive ? palette.primary : inputBg,
                          borderColor: isActive ? palette.primary : borderColor,
                        },
                      ]}
                      onPress={() => { setGrupoSel(g); setErrors((e) => ({ ...e, grupo: '' })); }}
                    >
                      <Text
                        style={[styles.chipText, { color: isActive ? '#FFFFFF' : textSecondary }]}
                      >
                        {g === 'otro' ? 'Otro...' : g}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            {errors.grupo ? <FieldError msg={errors.grupo} /> : null}

            {grupoSel === 'otro' && (
              <>
                <FieldLabel label="Especificá el grupo *" color={textSecondary} />
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: inputBg, borderColor: errors.grupoOtro ? palette.error : borderColor, color: textPrimary },
                  ]}
                  placeholder="Ingresá el grupo muscular"
                  placeholderTextColor={textSecondary}
                  value={grupoOtro}
                  onChangeText={(t) => { setGrupoOtro(t); setErrors((e) => ({ ...e, grupoOtro: '' })); }}
                />
                {errors.grupoOtro ? <FieldError msg={errors.grupoOtro} /> : null}
              </>
            )}

            <FieldLabel label="URL de YouTube (opcional)" color={textSecondary} />
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, borderColor: errors.url ? palette.error : borderColor, color: textPrimary },
              ]}
              placeholder="https://youtube.com/..."
              placeholderTextColor={textSecondary}
              value={urlYoutube}
              onChangeText={(t) => { setUrlYoutube(t); setErrors((e) => ({ ...e, url: '' })); }}
              autoCapitalize="none"
              keyboardType="url"
            />
            {errors.url ? <FieldError msg={errors.url} /> : null}
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: borderColor }]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={loading}>
              <Text style={[styles.cancelBtnText, { color: textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Enviar sugerencia</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Modal: Dejanos tu mensaje ───────────────────────────────────────────────

interface DejanosMensajeModalProps {
  visible: boolean;
  onClose: () => void;
}

function DejanosMensajeModal({ visible, onClose }: DejanosMensajeModalProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [mensaje, setMensaje] = useState('');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const bgColor = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;
  const inputBg = isDark ? palette.slate800 : palette.slate50;

  const nombreCompleto = user ? `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim() : '';
  const email = user?.mail ?? '';

  const reset = () => {
    setMensaje('');
    setTelefono('');
    setErrors({});
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!mensaje.trim()) errs.mensaje = 'El mensaje es obligatorio';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await mensajeContactoService.enviar({
        nombre: nombreCompleto || undefined,
        email: email || undefined,
        telefono: telefono.trim() || undefined,
        mensaje: mensaje.trim(),
      });
      Alert.alert('¡Gracias!', 'Tu mensaje fue enviado correctamente.');
      handleClose();
    } catch {
      Alert.alert('Error', 'No se pudo enviar el mensaje. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalSheet, { backgroundColor: bgColor }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={styles.modalIconWrap}>
              <MaterialCommunityIcons name="message-text" size={22} color={palette.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: textPrimary }]}>
              Dejanos tu mensaje
            </Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close" size={24} color={textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalBody}
            keyboardShouldPersistTaps="handled"
          >
            {nombreCompleto ? (
              <View style={[styles.userInfoRow, { backgroundColor: `${palette.primary}12` }]}>
                <MaterialCommunityIcons name="account" size={16} color={palette.primary} />
                <Text style={[styles.userInfoText, { color: textSecondary }]}>
                  {nombreCompleto}
                  {email ? ` · ${email}` : ''}
                </Text>
              </View>
            ) : null}

            <FieldLabel label="Tu mensaje *" color={textSecondary} />
            <TextInput
              style={[
                styles.input,
                styles.textarea,
                styles.textareaLarge,
                { backgroundColor: inputBg, borderColor: errors.mensaje ? palette.error : borderColor, color: textPrimary },
              ]}
              placeholder="Escribí tu consulta, sugerencia o comentario..."
              placeholderTextColor={textSecondary}
              value={mensaje}
              onChangeText={(t) => { setMensaje(t); setErrors((e) => ({ ...e, mensaje: '' })); }}
              multiline
              numberOfLines={5}
              maxLength={1000}
            />
            {errors.mensaje ? <FieldError msg={errors.mensaje} /> : null}

            <FieldLabel label="Teléfono (opcional)" color={textSecondary} />
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, borderColor, color: textPrimary },
              ]}
              placeholder="+54 11 ..."
              placeholderTextColor={textSecondary}
              value={telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
            />
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: borderColor }]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={loading}>
              <Text style={[styles.cancelBtnText, { color: textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Enviar mensaje</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Componente Principal FABs ───────────────────────────────────────────────

const HIDE_FAB_ROUTES = new Set([
  'Socios',
  'Suscripciones',
  'SociosList',
  'SocioDetail',
  'SocioForm',
  'PlanesList',
  'PlanDetail',
  'PlanForm',
]);

interface FloatingActionButtonsProps {
  activeRoute?: string;
}

export default function FloatingActionButtons({ activeRoute }: FloatingActionButtonsProps) {
  const insets = useSafeAreaInsets();
  const hideFab = activeRoute ? HIDE_FAB_ROUTES.has(activeRoute) : false;
  const [expanded, setExpanded] = useState(false);
  const [showSugerir, setShowSugerir] = useState(false);
  const [showMensaje, setShowMensaje] = useState(false);

  const handleToggle = () => setExpanded((prev) => !prev);

  const handleSugerir = () => {
    setExpanded(false);
    setShowSugerir(true);
  };

  const handleMensaje = () => {
    setExpanded(false);
    setShowMensaje(true);
  };

  return (
    <>
      {!hideFab && (
      <View style={[styles.fabContainer, { bottom: insets.bottom + 24 }]}>
        {expanded && (
          <View style={styles.fabActions}>
            <FabAction
              icon="dumbbell"
              label="Sugerir ejercicio"
              onPress={handleSugerir}
            />
            <FabAction
              icon="message-text"
              label="Dejanos un mensaje"
              onPress={handleMensaje}
            />
          </View>
        )}
        <TouchableOpacity
          style={[styles.fabMain, expanded && styles.fabMainExpanded]}
          onPress={handleToggle}
          activeOpacity={0.9}
        >
          <MaterialCommunityIcons
            name={expanded ? 'close' : 'plus'}
            size={28}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
      )}

      <SugerirEjercicioModal
        visible={showSugerir}
        onClose={() => setShowSugerir(false)}
      />
      <DejanosMensajeModal
        visible={showMensaje}
        onClose={() => setShowMensaje(false)}
      />
    </>
  );
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function FabAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.fabAction} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.fabActionLabel}>
        <Text style={styles.fabActionLabelText}>{label}</Text>
      </View>
      <View style={styles.fabActionIcon}>
        <MaterialCommunityIcons name={icon} size={20} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
}

function FieldLabel({ label, color }: { label: string; color: string }) {
  return <Text style={[styles.fieldLabel, { color }]}>{label}</Text>;
}

function FieldError({ msg }: { msg: string }) {
  return <Text style={styles.fieldError}>{msg}</Text>;
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 20,
    alignItems: 'flex-end',
    zIndex: 999,
  },
  fabMain: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  fabMainExpanded: {
    backgroundColor: palette.slate700,
  },
  fabActions: {
    marginBottom: 12,
    gap: 10,
  },
  fabAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  fabActionLabel: {
    backgroundColor: 'rgba(15,23,42,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  fabActionLabelText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  fabActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(100,116,139,0.3)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(220,38,38,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldError: {
    fontSize: 12,
    color: palette.error,
    marginTop: 4,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textarea: {
    textAlignVertical: 'top',
    minHeight: 80,
    paddingTop: 12,
  },
  textareaLarge: {
    minHeight: 120,
  },
  chipsScroll: {
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 4,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  userInfoText: {
    fontSize: 13,
    flex: 1,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(100,116,139,0.1)',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: palette.primary,
    minHeight: 48,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
