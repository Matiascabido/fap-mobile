import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { storage, STORAGE_KEYS } from '../services/api/storage';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('auto');

  useEffect(() => {
    // Cargar tema guardado
    const loadTheme = async () => {
      try {
        const savedTheme = await storage.get(STORAGE_KEYS.THEME);
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto') {
          setThemeState(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  // Determinar si está en modo oscuro
  const isDark =
    theme === 'dark' || (theme === 'auto' && systemColorScheme === 'dark');

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

  const value: ThemeContextType = {
    theme,
    isDark,
    toggleTheme,
    setTheme,
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
