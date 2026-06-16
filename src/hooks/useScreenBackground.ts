import { useAppTheme } from '../context/ThemeContext';

/** Fondo de pantalla unificado: transparente si hay imagen personalizada */
export function useScreenBackground(): string {
  const { colors } = useAppTheme();
  return colors.hasBackgroundImage ? 'transparent' : colors.groupedBackground;
}
