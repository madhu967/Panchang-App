import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, ThemeColors, ThemeMode } from './colors';
import { typography } from './typography';
import { spacing, layout } from './spacing';

const THEME_STORAGE_KEY = '@user_theme_preference';

type Theme = {
  themeMode: ThemeMode;
  isDark: boolean;
  userOverride: ThemeMode | null;
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  layout: typeof layout;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setSystemDefault: () => void;
};

const getInitialOverride = (): ThemeMode | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const syncVal = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
      if (syncVal && colors[syncVal]) {
        return syncVal;
      }
    }
  } catch (e) {}
  return null;
};

const defaultTheme: Theme = {
  themeMode: 'dark',
  isDark: true,
  userOverride: null,
  colors: colors.dark,
  typography,
  spacing,
  layout,
  toggleTheme: () => {},
  setThemeMode: () => {},
  setSystemDefault: () => {},
};

const ThemeContext = createContext<Theme>(defaultTheme);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [userOverride, setUserOverride] = useState<ThemeMode | null>(getInitialOverride);

  // Hydrate from AsyncStorage on native boot
  useEffect(() => {
    let isMounted = true;
    const loadStoredPreference = async () => {
      try {
        const stored = (await AsyncStorage.getItem(THEME_STORAGE_KEY)) as ThemeMode;
        if (isMounted && stored && colors[stored]) {
          setUserOverride(stored);
        }
      } catch (e) {}
    };
    loadStoredPreference();
  }, []);

  // Compute active themeMode
  const themeMode: ThemeMode = userOverride 
    ? userOverride
    : ((systemColorScheme === 'dark' || Appearance.getColorScheme() === 'dark') ? 'dark' : 'light');

  const isDark = themeMode === 'dark';

  const setThemeMode = async (mode: ThemeMode) => {
    setUserOverride(mode);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(THEME_STORAGE_KEY, mode);
      }
    } catch (e) {}

    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.warn('Failed to save theme preference:', e);
    }
  };

  const toggleTheme = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'crimsonLight'];
    const currentIndex = modes.indexOf(themeMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setThemeMode(nextMode);
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
    themeMode,
    isDark,
    userOverride,
    colors: colors[themeMode] || colors.dark,
    typography,
    spacing,
    layout,
    toggleTheme,
    setThemeMode,
    setSystemDefault,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);



