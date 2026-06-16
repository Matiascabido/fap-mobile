import { AppThemeTokens } from './iosTheme';
import { palette } from '../constants/colors';

/** Azul oscuro mate — reemplaza el negro puro */
export const MATTE_BLUE_DARK: AppThemeTokens = {
  systemBackground: '#152433',
  groupedBackground: '#1B2838',
  secondaryGroupedBackground: '#243447',
  tertiaryGroupedBackground: '#2D3F54',
  label: '#F0F4F8',
  secondaryLabel: 'rgba(203, 213, 225, 0.72)',
  tertiaryLabel: 'rgba(148, 163, 184, 0.55)',
  separator: 'rgba(100, 116, 139, 0.45)',
  tint: palette.primary,
  fill: 'rgba(100, 116, 139, 0.35)',
  canvasBackground: '#152433',
  hasBackgroundImage: false,
};

export const CLASSIC_DARK: AppThemeTokens = {
  systemBackground: '#0F172A',
  groupedBackground: '#0F172A',
  secondaryGroupedBackground: '#1E293B',
  tertiaryGroupedBackground: palette.slate800,
  label: palette.darkTextPrimary,
  secondaryLabel: palette.darkTextSecondary,
  tertiaryLabel: palette.slate500,
  separator: palette.darkBorder,
  tint: palette.primary,
  fill: palette.slate700,
  canvasBackground: '#0F172A',
  hasBackgroundImage: false,
};

function withImageBackground(base: AppThemeTokens, imageUri: string, isDark: boolean): AppThemeTokens {
  return {
    ...base,
    systemBackground: 'transparent',
    groupedBackground: 'transparent',
    hasBackgroundImage: true,
    customBackgroundUri: imageUri,
    canvasBackground: base.canvasBackground,
    secondaryGroupedBackground: isDark
      ? 'rgba(36, 52, 71, 0.93)'
      : 'rgba(255, 255, 255, 0.93)',
    tertiaryGroupedBackground: isDark
      ? 'rgba(45, 63, 84, 0.88)'
      : 'rgba(242, 242, 247, 0.88)',
  };
}

export { withImageBackground };
