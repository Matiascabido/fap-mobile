import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export function hapticLight() {
  if (Platform.OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

export function hapticSelection() {
  if (Platform.OS === 'ios') {
    Haptics.selectionAsync().catch(() => {});
  }
}
