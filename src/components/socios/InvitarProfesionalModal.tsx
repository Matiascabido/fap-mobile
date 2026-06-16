import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';
import { usersService } from '../../services/api/users.service';
import { openWhatsApp } from '../../utils/whatsappLink';

interface InvitarProfesionalModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function InvitarProfesionalModal({ visible, onClose }: InvitarProfesionalModalProps) {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [dialCode, setDialCode] = useState('54');
  const [generatedLink, setGeneratedLink] = useState('');

  const bgColor = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;
  const textSecondary = isDark ? palette.darkTextSecondary : palette.lightTextSecondary;
  const borderColor = isDark ? palette.darkBorder : palette.lightBorder;
  const inputBg = isDark ? palette.slate800 : palette.slate50;

  useEffect(() => {
    if (!visible) {
      setGeneratedLink('');
      setPhone('');
      return;
    }

    let cancelled = false;
    setLoading(true);
    usersService
      .invitacionProfesional()
      .then((res) => {
        if (!cancelled) setGeneratedLink(res.signup_url);
      })
      .catch(() => {
        if (!cancelled) Alert.alert('Error', 'No se pudo generar el link de invitación.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  const messageText = `Hola, te enviamos el link para darte de alta como profesional en Guía FA: ${generatedLink}`;

  const handleCopy = useCallback(async () => {
    if (!generatedLink) return;
    try {
      await Share.share({ message: generatedLink });
    } catch {
      Alert.alert('Link de invitación', generatedLink);
    }
  }, [generatedLink]);

  const handleWhatsApp = useCallback(async () => {
    if (!phone.trim()) {
      Alert.alert('Teléfono requerido', 'Ingresá un número para enviar por WhatsApp.');
      return;
    }
    if (!generatedLink) return;
    const cleanNumber = phone.replace(/\D/g, '');
    await openWhatsApp(`${dialCode}${cleanNumber}`, messageText);
  }, [phone, dialCode, generatedLink, messageText]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.sheet, { backgroundColor: bgColor }]}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="account-plus" size={32} color={palette.primary} />
          </View>

          <Text style={[styles.title, { color: palette.primary }]}>Invitar profesional</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            Link de registro de único uso (72 hs). Copialo o envialo por WhatsApp.
          </Text>

          {loading ? (
            <ActivityIndicator color={palette.primary} style={{ marginVertical: 24 }} />
          ) : (
            <>
              <TouchableOpacity style={styles.copyBtn} onPress={() => void handleCopy()}>
                <MaterialCommunityIcons name="content-copy" size={20} color={textPrimary} />
                <Text style={[styles.copyBtnText, { color: textPrimary }]}>Compartir link</Text>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
                <Text style={[styles.dividerText, { color: textSecondary }]}>O WhatsApp</Text>
                <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
              </View>

              <View style={styles.phoneRow}>
                <View style={[styles.prefixBox, { backgroundColor: inputBg, borderColor }]}>
                  <Text style={[styles.prefixText, { color: textSecondary }]}>+{dialCode}</Text>
                </View>
                <TextInput
                  style={[
                    styles.phoneInput,
                    { backgroundColor: inputBg, borderColor, color: textPrimary },
                  ]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Ej: 3511234567"
                  placeholderTextColor={textSecondary}
                  keyboardType="phone-pad"
                />
                <TouchableOpacity style={styles.waBtn} onPress={() => void handleWhatsApp()}>
                  <MaterialCommunityIcons name="whatsapp" size={22} color="#FFF" />
                </TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(220,38,38,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(100,116,139,0.12)',
  },
  copyBtnText: { fontSize: 15, fontWeight: '700' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 16,
    gap: 8,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  phoneRow: { flexDirection: 'row', width: '100%', gap: 8, alignItems: 'center' },
  prefixBox: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  prefixText: { fontSize: 15, fontWeight: '700' },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
  },
  waBtn: {
    backgroundColor: '#25D366',
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    marginTop: 20,
    width: '100%',
    backgroundColor: palette.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
