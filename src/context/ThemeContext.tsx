import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { storage, STORAGE_KEYS } from '../services/api/storage';
import { AppThemeTokens, getAppTheme } from '../theme/iosTheme';
import {
  AppearancePreferences,
  BackgroundMode,
  DarkSurfacePreset,
  DEFAULT_APPEARANCE,
} from '../types/appearance.types';
import {
  loadStoredBackgroundUri,
  pickAndSaveBackgroundImage,
  removeStoredBackgroundImage,
} from '../utils/appearanceImage';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  colors: AppThemeTokens;
  appearance: AppearancePreferences;
  appearanceLoading: boolean;
  toggleTheme: () => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  setDarkSurfacePreset: (preset: DarkSurfacePreset) => Promise<void>;
  setBackgroundMode: (mode: BackgroundMode) => Promise<void>;
  pickCustomBackground: () => Promise<void>;
  clearCustomBackground: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

async function loadAppearancePrefs(): Promise<AppearancePreferences> {
  try {
    const [preset, mode, storedUri] = await Promise.all([
      storage.get(STORAGE_KEYS.APPEARANCE_DARK_PRESET),
      storage.get(STORAGE_KEYS.APPEARANCE_BG_MODE),
      loadStoredBackgroundUri(),
    ]);

    return {
      darkSurfacePreset:
        preset === 'classic' || preset === 'matte_blue' ? preset : DEFAULT_APPEARANCE.darkSurfacePreset,
      backgroundMode: mode === 'image' || mode === 'color' ? mode : DEFAULT_APPEARANCE.backgroundMode,
      customBackgroundUri: storedUri,
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('auto');
  const [appearance, setAppearance] = useState<AppearancePreferences>(DEFAULT_APPEARANCE);
  const [appearanceLoading, setAppearanceLoading] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [savedTheme, savedAppearance] = await Promise.all([
          storage.get(STORAGE_KEYS.THEME),
          loadAppearancePrefs(),
        ]);
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto') {
          setThemeState(savedTheme);
        }
        setAppearance(savedAppearance);
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setPrefsLoaded(true);
      }
    };
    void loadAll();
  }, []);

  const isDark = theme === 'dark' || (theme === 'auto' && systemColorScheme === 'dark');

  const colors = useMemo(
    () => getAppTheme(isDark, appearance),
    [isDark, appearance]
  );

  const persistAppearance = useCallback(async (next: AppearancePreferences) => {
    setAppearance(next);
    await Promise.all([
      storage.set(STORAGE_KEYS.APPEARANCE_DARK_PRESET, next.darkSurfacePreset),
      storage.set(STORAGE_KEYS.APPEARANCE_BG_MODE, next.backgroundMode),
    ]);
  }, []);

  const setTheme = async (newTheme: Theme) => {
    try {
      await storage.set(STORAGE_KEYS.THEME, newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    await setTheme(newTheme);
  };

  const setDarkSurfacePreset = async (preset: DarkSurfacePreset) => {
    await persistAppearance({ ...appearance, darkSurfacePreset: preset });
  };

  const setBackgroundMode = async (mode: BackgroundMode) => {
    const next: AppearancePreferences = {
      ...appearance,
      backgroundMode: mode,
      customBackgroundUri:
        mode === 'image' ? appearance.customBackgroundUri : appearance.customBackgroundUri,
    };
    if (mode === 'color') {
      await persistAppearance(next);
      return;
    }
    if (!next.customBackgroundUri) {
      setAppearanceLoading(true);
      const uri = await pickAndSaveBackgroundImage();
      setAppearanceLoading(false);
      await persistAppearance({ ...next, customBackgroundUri: uri });
      return;
    }
    await persistAppearance(next);
  };

  const pickCustomBackground = async () => {
    setAppearanceLoading(true);
    try {
      const uri = await pickAndSaveBackgroundImage();
      if (uri) {
        await persistAppearance({
          ...appearance,
          backgroundMode: 'image',
          customBackgroundUri: uri,
        });
      }
    } finally {
      setAppearanceLoading(false);
    }
  };

  const clearCustomBackground = async () => {
    await removeStoredBackgroundImage();
    await persistAppearance({
      ...appearance,
      backgroundMode: 'color',
      customBackgroundUri: null,
    });
  };

  const value: ThemeContextType = {
    theme,
    isDark,
    colors: prefsLoaded ? colors : getAppTheme(isDark, DEFAULT_APPEARANCE),
    appearance,
    appearanceLoading,
    toggleTheme,
    setTheme,
    setDarkSurfacePreset,
    setBackgroundMode,
    pickCustomBackground,
    clearCustomBackground,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/** Alias semántico para tokens iOS/HIG */
export const useAppTheme = useTheme;
