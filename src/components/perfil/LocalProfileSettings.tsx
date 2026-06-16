import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalProfile } from '../../context/LocalProfileContext';
import { palette } from '../../constants/colors';
import { MAX_LOCAL_NICKNAME_LENGTH } from '../../types/localProfile.types';
import Avatar from '../common/Avatar';
import Input from '../common/Input';

interface LocalProfileSettingsProps {
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
  nombre?: string;
  apellido?: string;
}

export default function LocalProfileSettings({
  textPrimary,
  textSecondary,
  borderColor,
  nombre,
  apellido,
}: LocalProfileSettingsProps) {
  const { nickname, photoUri, pickPhoto, removePhoto, setNickname } = useLocalProfile();
  const [nickInput, setNickInput] = useState(nickname);

  useEffect(() => {
    setNickInput(nickname);
  }, [nickname]);

  const handleBlurNickname = () => {
    if (nickInput.trim() !== nickname) {
      void setNickname(nickInput);
    }
  };

  const handlePickPhoto = () => {
    void pickPhoto();
  };

  const handleRemovePhoto = () => {
    Alert.alert('Quitar foto', '¿Querés volver a las iniciales?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => void removePhoto() },
    ]);
  };

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: textPrimary }]}>Tu perfil en la app</Text>
      <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
        Foto y nickname guardados solo en este dispositivo
      </Text>

      <View style={styles.photoRow}>
        <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.85} accessibilityLabel="Cambiar foto">
          <Avatar nombre={nombre} apellido={apellido} size={72} imageUri={photoUri} />
        </TouchableOpacity>

        <View style={styles.photoActions}>
          <TouchableOpacity
            style={[styles.photoBtn, { borderColor }]}
            onPress={handlePickPhoto}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="camera-outline" size={18} color={palette.primary} />
            <Text style={styles.photoBtnText}>Cambiar foto</Text>
          </TouchableOpacity>
          {photoUri ? (
            <TouchableOpacity
              style={[styles.photoBtn, { borderColor }]}
              onPress={handleRemovePhoto}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="image-off-outline" size={18} color={textSecondary} />
              <Text style={[styles.photoBtnTextMuted, { color: textSecondary }]}>Quitar foto</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <Input
        label="Nickname (solo en la app)"
        placeholder="Cómo querés que te llamemos acá"
        value={nickInput}
        onChangeText={(text) => setNickInput(text.slice(0, MAX_LOCAL_NICKNAME_LENGTH))}
        onBlur={handleBlurNickname}
        maxLength={MAX_LOCAL_NICKNAME_LENGTH}
        autoCapitalize="words"
        autoCorrect={false}
        icon="account-edit-outline"
      />
      <Text style={[styles.hint, { color: textSecondary }]}>
        No se envía al club. Solo cambia cómo te mostramos en la app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  photoActions: {
    flex: 1,
    gap: 8,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  photoBtnText: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  photoBtnTextMuted: {
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: -8,
  },
});
