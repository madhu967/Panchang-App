import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, ThemeColors } from './colors';
import { typography } from './typography';
import { spacing, layout } from './spacing';

const THEME_STORAGE_KEY = '@user_theme_preference';

type Theme = {
  isDark: boolean;
  userOverride: 'dark' | 'light' | null;
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  layout: typeof layout;
  toggleTheme: () => void;
  setSystemDefault: () => void;
};

const getInitialOverride = (): 'dark' | 'light' | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const syncVal = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (syncVal === 'dark' || syncVal === 'light') {
        return syncVal;
      }
    }
  } catch (e) {}
  return null;
};

const defaultTheme: Theme = {
  isDark: true,
  userOverride: null,
  colors: colors.dark,
  typography,
  spacing,
  layout,
  toggleTheme: () => {},
  setSystemDefault: () => {},
};

const ThemeContext = createContext<Theme>(defaultTheme);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [userOverride, setUserOverride] = useState<'dark' | 'light' | null>(getInitialOverride);

  // Hydrate from AsyncStorage on native boot
  useEffect(() => {
    let isMounted = true;
    const loadStoredPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (isMounted && (stored === 'dark' || stored === 'light')) {
          setUserOverride(stored);
        }
      } catch (e) {}
    };
    loadStoredPreference();
  }, []);

  // Compute final isDark state:
  // 1. If user explicitly chose 'dark' or 'light', use userOverride.
  // 2. Otherwise, strictly follow system OS color scheme (systemColorScheme === 'dark' or Appearance === 'dark').
  const isDark = userOverride 
    ? (userOverride === 'dark')
    : (systemColorScheme === 'dark' || Appearance.getColorScheme() === 'dark');

  const toggleTheme = async () => {
    const nextMode: 'dark' | 'light' = isDark ? 'light' : 'dark';
    setUserOverride(nextMode);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextMode);
      }
    } catch (e) {}

    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
    } catch (e) {
      console.warn('Failed to save theme preference:', e);
    }
  };

  const setSystemDefault = async () => {
    setUserOverride(null);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(THEME_STORAGE_KEY);
      }
    } catch (e) {}

    try {
      await AsyncStorage.removeItem(THEME_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to reset theme preference:', e);
    }
  };

  const theme: Theme = {
    isDark,
    userOverride,
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
