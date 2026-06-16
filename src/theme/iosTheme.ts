import { Platform, TextStyle } from 'react-native';
import { palette } from '../constants/colors';

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
};

const IOS_DARK: AppThemeTokens = {
  systemBackground: '#000000',
  secondaryGroupedBackground: '#1C1C1E',
  tertiaryGroupedBackground: '#2C2C2E',
  label: '#FFFFFF',
  secondaryLabel: '#EBEBF599',
  tertiaryLabel: '#EBEBF54D',
  separator: '#54545899',
  tint: palette.primary,
  fill: '#7878805C',
  groupedBackground: '#000000',
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
};

const FALLBACK_DARK: AppThemeTokens = {
  systemBackground: palette.darkBg,
  secondaryGroupedBackground: palette.darkCard,
  tertiaryGroupedBackground: palette.slate800,
  label: palette.darkTextPrimary,
  secondaryLabel: palette.darkTextSecondary,
  tertiaryLabel: palette.slate500,
  separator: palette.darkBorder,
  tint: palette.primary,
  fill: palette.slate700,
  groupedBackground: palette.darkBg,
};

export function getAppTheme(isDark: boolean): AppThemeTokens {
  if (Platform.OS === 'ios') {
    return isDark ? IOS_DARK : IOS_LIGHT;
  }
  return isDark ? FALLBACK_DARK : FALLBACK_LIGHT;
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
