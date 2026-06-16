import { Platform, TextStyle } from 'react-native';
import { palette } from '../constants/colors';
import { AppearancePreferences, DEFAULT_APPEARANCE } from '../types/appearance.types';
import { CLASSIC_DARK, MATTE_BLUE_DARK, withImageBackground } from './appearancePresets';

export interface AppThemeTokens {
  systemBackground: string;
  secondaryGroupedBackground: string;
  tertiaryGroupedBackground: string;
  label: string;
  secondaryLabel: string;
  tertiaryLabel: string;
  separator: string;
  tint: string;
  fill: string;
  groupedBackground: string;
  /** Color sólido detrás de todo el canvas (visible con imagen o sin ella) */
  canvasBackground: string;
  hasBackgroundImage: boolean;
  customBackgroundUri?: string | null;
}

const IOS_LIGHT: AppThemeTokens = {
  systemBackground: '#F2F2F7',
  secondaryGroupedBackground: '#FFFFFF',
  tertiaryGroupedBackground: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C4399',
  tertiaryLabel: '#3C3C434D',
  separator: '#C6C6C8',
  tint: palette.primary,
  fill: '#78788033',
  groupedBackground: '#F2F2F7',
  canvasBackground: '#F2F2F7',
  hasBackgroundImage: false,
};

const IOS_DARK_MATTE: AppThemeTokens = {
  ...MATTE_BLUE_DARK,
  systemBackground: MATTE_BLUE_DARK.groupedBackground,
};

const FALLBACK_LIGHT: AppThemeTokens = {
  systemBackground: palette.lightBg,
  secondaryGroupedBackground: palette.lightCard,
  tertiaryGroupedBackground: palette.slate100,
  label: palette.lightTextPrimary,
  secondaryLabel: palette.lightTextSecondary,
  tertiaryLabel: palette.slate400,
  separator: palette.lightBorder,
  tint: palette.primary,
  fill: palette.slate200,
  groupedBackground: palette.lightBg,
  canvasBackground: palette.lightBg,
  hasBackgroundImage: false,
};

function darkTokens(preset: AppearancePreferences['darkSurfacePreset']): AppThemeTokens {
  if (preset === 'classic') {
    return Platform.OS === 'ios'
      ? {
          ...CLASSIC_DARK,
          systemBackground: '#000000',
          groupedBackground: '#000000',
          canvasBackground: '#000000',
        }
      : CLASSIC_DARK;
  }
  return Platform.OS === 'ios' ? IOS_DARK_MATTE : MATTE_BLUE_DARK;
}

export function getAppTheme(
  isDark: boolean,
  appearance: AppearancePreferences = DEFAULT_APPEARANCE
): AppThemeTokens {
  const base = isDark ? darkTokens(appearance.darkSurfacePreset) : Platform.OS === 'ios' ? IOS_LIGHT : FALLBACK_LIGHT;

  if (
    appearance.backgroundMode === 'image' &&
    appearance.customBackgroundUri &&
    appearance.customBackgroundUri.length > 0
  ) {
    return withImageBackground(base, appearance.customBackgroundUri, isDark);
  }

  return base;
}

export const typography = {
  largeTitle: { fontSize: 34, fontWeight: '700' as TextStyle['fontWeight'], letterSpacing: 0.37 },
  title1: { fontSize: 28, fontWeight: '700' as TextStyle['fontWeight'] },
  title2: { fontSize: 22, fontWeight: '700' as TextStyle['fontWeight'] },
  title3: { fontSize: 20, fontWeight: '600' as TextStyle['fontWeight'] },
  headline: { fontSize: 17, fontWeight: '600' as TextStyle['fontWeight'] },
  body: { fontSize: 17, fontWeight: '400' as TextStyle['fontWeight'] },
  callout: { fontSize: 16, fontWeight: '400' as TextStyle['fontWeight'] },
  subhead: { fontSize: 15, fontWeight: '400' as TextStyle['fontWeight'] },
  footnote: { fontSize: 13, fontWeight: '400' as TextStyle['fontWeight'] },
  caption1: { fontSize: 12, fontWeight: '400' as TextStyle['fontWeight'] },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '400' as TextStyle['fontWeight'],
    textTransform: 'uppercase' as TextStyle['textTransform'],
    letterSpacing: -0.08,
  },
};
