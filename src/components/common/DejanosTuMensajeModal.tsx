import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { palette } from '../../constants/colors';
import { mensajeContactoService } from '../../services/api/mensajeContacto.service';
import { tutorialesService } from '../../services/api/tutoriales.service';
import { userStorage } from '../../services/api/storage';
import { buildMensajeContactoPayload } from '../../utils/buildMensajeContactoPayload';
import { readPhoneFromStoredUser, userContactFromAuth } from '../../utils/userContact';
import TelefonoGuardadoReadonly from './TelefonoGuardadoReadonly';
import SugerirEjercicioForm from './SugerirEjercicioForm';

type ConsultaTipo = 'mensaje' | 'sugerir-ejercicio';

const CONSULTAS: {
  id: ConsultaTipo;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  descripcion: string;
}[] = [
  {
    id: 'mensaje',
    label: 'Dejanos tu mensaje',
    icon: 'message-text-outline',
    descripcion: 'Consultas generales y soporte',
  },
  {
    id: 'sugerir-ejercicio',
    label: 'Sugerir ejercicio',
    icon: 'dumbbell',
    descripcion: 'Proponé un ejercicio para el catálogo',
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  initialConsulta?: ConsultaTipo;
}

export default function DejanosTuMensajeModal({
  visible,
  onClose,
  initialConsulta = 'mensaje',
}: Props) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [consulta, setConsulta] = useState<ConsultaTipo>('mensaje');
  const [consultasOpen, setConsultasOpen] = useState(true);
  const [grupos, setGrupos] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [userTelefono, setUserTelefono] = useState('');

  const bgColor = isDark ? palette.darkCard : '#FFFFFF';
  const headerBg = isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(248, 250, 252, 0.95)';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.slate100;
  const inputBg = isDark ? palette.slate800 : '#FFFFFF';
  const inputBorder = isDark ? palette.slate600 : palette.slate200;

  const userNombre = user ? `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim() : '';
  const userEmail = user?.mail ?? '';
  const initial = (userNombre || 'U').charAt(0).toUpperCase();

  const consultaActiva = useMemo(
    () => CONSULTAS.find((c) => c.id === consulta) ?? CONSULTAS[0],
    [consulta]
  );

  const resetForm = useCallback(() => {
    setMensaje('');
    setConsulta('mensaje');
    setConsultasOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    if (enviando) return;
    resetForm();
    onClose();
  }, [enviando, onClose, resetForm]);

  useEffect(() => {
    if (!visible) return;
    void userStorage.getUser().then((raw) => {
      setUserTelefono(readPhoneFromStoredUser(raw));
    });
  }, [visible, user?.id]);

  useEffect(() => {
    let cancelled = false;
    tutorialesService
      .getGrupos()
      .then((data) => {
        if (!cancelled) setGrupos(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmitMensaje = async () => {
    if (enviando) return;
    const mensajeTrim = mensaje.trim();
    if (!mensajeTrim) {
      Alert.alert('Atención', 'Escribí tu mensaje antes de enviar.');
      return;
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
      await mensajeContactoService.enviar(
        buildMensajeContactoPayload({ user: contact, mensaje: mensajeTrim })
      );
      resetForm();
      onClose();
      Alert.alert('¡Gracias!', 'Mensaje enviado. Te responderemos a la brevedad.');
    } catch {
      Alert.alert('Error', 'No se pudo enviar el mensaje. Intentá de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const handleSelectConsulta = (tipo: ConsultaTipo) => {
    setConsulta(tipo);
    setConsultasOpen(false);
  };

  useEffect(() => {
    if (visible) {
      setConsulta(initialConsulta);
      setConsultasOpen(false);
    }
  }, [visible, initialConsulta]);

  const [mounted, setMounted] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [visible, progress]);

  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const panelTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [420, 0],
  });
  const panelOpacity = progress;

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.panel,
            {
              backgroundColor: bgColor,
              paddingBottom: insets.bottom,
              maxHeight: '88%',
              opacity: panelOpacity,
              transform: [{ translateY: panelTranslateY }],
            },
          ]}
        >
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: isDark ? palette.slate600 : palette.slate300 }]} />
          </View>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{consultaActiva.label}</Text>
              <Text style={[styles.headerDesc, { color: textSecondary }]}>
                {consultaActiva.descripcion}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              disabled={enviando}
              hitSlop={8}
              style={[styles.closeBtn, { opacity: enviando ? 0.4 : 1 }]}
            >
              <Ionicons name="close" size={18} color={palette.slate400} />
            </TouchableOpacity>
          </View>

          {/* Selector de consulta */}
          <View style={[styles.consultasSection, { borderBottomColor: borderColor }]}>
            <TouchableOpacity
              style={styles.consultasToggle}
              onPress={() => setConsultasOpen((p) => !p)}
              activeOpacity={0.7}
            >
              <Text style={styles.consultasLabel}>Tipo de consulta</Text>
              <Ionicons
                name={consultasOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={palette.slate400}
              />
            </TouchableOpacity>

            {consultasOpen ? (
              <View style={styles.consultasList}>
                {CONSULTAS.map((item) => {
                  const activa = consulta === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.consultaItem,
                        {
                          borderColor: activa
                            ? `${palette.primary}40`
                            : isDark
                              ? palette.slate700
                              : palette.slate100,
                          backgroundColor: activa
                            ? isDark
                              ? 'rgba(220, 38, 38, 0.15)'
                              : 'rgba(254, 242, 242, 1)'
                            : isDark
                              ? 'rgba(30, 41, 59, 0.4)'
                              : '#FFFFFF',
                        },
                      ]}
                      onPress={() => handleSelectConsulta(item.id)}
                    >
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={16}
                        color={activa ? palette.primary : palette.slate400}
                      />
                      <Text
                        style={[
                          styles.consultaItemText,
                          { color: activa ? palette.primary : textPrimary },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.consultaCollapsed}
                onPress={() => setConsultasOpen(true)}
              >
                <MaterialCommunityIcons
                  name={consultaActiva.icon}
                  size={12}
                  color={palette.primary}
                />
                <Text style={[styles.consultaCollapsedText, { color: textSecondary }]}>
                  {consultaActiva.label}
                </Text>
                <Text style={[styles.consultaChange, { color: palette.primary }]}>Cambiar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Contenido */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {consulta === 'mensaje' ? (
              <View style={styles.mensajeForm}>
                <View
                  style={[
                    styles.userCard,
                    {
                      borderColor: isDark ? palette.slate700 : palette.slate100,
                      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : palette.slate50,
                    },
                  ]}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, { color: textPrimary }]} numberOfLines={1}>
                      {userNombre || 'Usuario'}
                    </Text>
                    {userEmail ? (
                      <Text style={[styles.userEmail, { color: textSecondary }]} numberOfLines={1}>
                        {userEmail}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {userTelefono.trim() ? (
                  <TelefonoGuardadoReadonly telefono={userTelefono} compact />
                ) : null}

                <View>
                  <Text style={styles.fieldLabel}>
                    Mensaje <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.textarea,
                      {
                        backgroundColor: inputBg,
                        borderColor: inputBorder,
                        color: textPrimary,
                      },
                    ]}
                    placeholder="Contanos en qué podemos ayudarte…"
                    placeholderTextColor={textSecondary}
                    value={mensaje}
                    onChangeText={setMensaje}
                    multiline
                    numberOfLines={4}
                    maxLength={1000}
                    editable={!enviando}
                  />
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.cancelBtn, { borderColor: inputBorder, backgroundColor: inputBg }]}
                    onPress={handleClose}
                    disabled={enviando}
                  >
                    <Text style={[styles.cancelText, { color: textPrimary }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      (enviando || !mensaje.trim()) && styles.btnDisabled,
                    ]}
                    onPress={() => void handleSubmitMensaje()}
                    disabled={enviando || !mensaje.trim()}
                  >
                    {enviando ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="send" size={14} color="#FFFFFF" />
                        <Text style={styles.submitText}>Enviar mensaje</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <SugerirEjercicioForm
                compact
                gruposDisponibles={grupos}
                userTelefono={userTelefono}
                onSuccess={() => {
                  resetForm();
                  onClose();
                }}
                onCancel={handleClose}
              />
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  panel: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: { elevation: 16 },
    }),
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.primary,
  },
  headerDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 999,
  },
  consultasSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  consultasToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  consultasLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: palette.slate400,
  },
  consultasList: {
    gap: 6,
    marginTop: 6,
    paddingBottom: 4,
  },
  consultaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  consultaItemText: {
    fontSize: 12,
    fontWeight: '600',
  },
  consultaCollapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingVertical: 2,
  },
  consultaCollapsedText: {
    fontSize: 11,
    fontWeight: '500',
  },
  consultaChange: {
    fontSize: 11,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  mensajeForm: {
    gap: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 11,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: palette.slate400,
    marginBottom: 4,
  },
  required: {
    color: palette.primary,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 96,
    textAlignVertical: 'top',
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
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 10,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
