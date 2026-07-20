import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, ThemeColors } from './colors';
import { typography } from './typography';
import { spacing, layout } from './spacing';

const THEME_STORAGE_KEY = '@user_theme_preference';

type Theme = {
  isDark: boolean;
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  layout: typeof layout;
  toggleTheme: () => void;
  setSystemDefault: () => void;
};

const defaultTheme: Theme = {
  isDark: false,
  colors: colors.light,
  typography,
  spacing,
  layout,
  toggleTheme: () => {},
  setSystemDefault: () => {},
};

const ThemeContext = createContext<Theme>(defaultTheme);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState<boolean>(systemColorScheme === 'dark');
  const [hasLoadedStoredTheme, setHasLoadedStoredTheme] = useState(false);

  // Load saved theme preference on app launch / reload
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme === 'dark') {
          setIsDark(true);
        } else if (storedTheme === 'light') {
          setIsDark(false);
        } else {
          // If no user preference saved, follow system default
          setIsDark(systemColorScheme === 'dark');
        }
      } catch (e) {
        setIsDark(systemColorScheme === 'dark');
      } finally {
        setHasLoadedStoredTheme(true);
      }
    };

    loadThemePreference();
  }, []);

  // Update theme when user explicitly toggles theme
  const toggleTheme = async () => {
    const nextDarkState = !isDark;
    setIsDark(nextDarkState);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextDarkState ? 'dark' : 'light');
    } catch (e) {
      console.warn('Failed to save theme preference:', e);
    }
  };

  // Reset to system default theme
  const setSystemDefault = async () => {
    setIsDark(systemColorScheme === 'dark');
    try {
      await AsyncStorage.removeItem(THEME_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to reset theme preference:', e);
    }
  };

  const theme: Theme = {
    isDark,
    colors: isDark ? colors.dark : colors.light,
    typography,
    spacing,
    layout,
    toggleTheme,
    setSystemDefault,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
