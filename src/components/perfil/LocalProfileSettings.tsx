import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalProfile } from '../../context/LocalProfileContext';
import { MAX_LOCAL_NICKNAME_LENGTH } from '../../types/localProfile.types';
import Input from '../common/Input';

interface LocalProfileSettingsProps {
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
}

export default function LocalProfileSettings({
  textPrimary,
  textSecondary,
}: LocalProfileSettingsProps) {
  const { nickname, setNickname } = useLocalProfile();
  const [nickInput, setNickInput] = useState(nickname);

  useEffect(() => {
    setNickInput(nickname);
  }, [nickname]);

  const handleBlurNickname = () => {
    if (nickInput.trim() !== nickname) {
      void setNickname(nickInput);
    }
  };

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: textPrimary }]}>Tu perfil en la app</Text>
      <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
        Nickname guardado solo en este dispositivo
      </Text>

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
  hint: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: -8,
  },
});
