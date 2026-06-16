/** Preset de superficie en modo oscuro */
export type DarkSurfacePreset = 'matte_blue' | 'classic';

/** Fondo de la app: color del tema o imagen local */
export type BackgroundMode = 'color' | 'image';

export interface AppearancePreferences {
  darkSurfacePreset: DarkSurfacePreset;
  backgroundMode: BackgroundMode;
  /** URI file:// dentro del sandbox de la app */
  customBackgroundUri: string | null;
}

export const DEFAULT_APPEARANCE: AppearancePreferences = {
  darkSurfacePreset: 'matte_blue',
  backgroundMode: 'color',
  customBackgroundUri: null,
};
