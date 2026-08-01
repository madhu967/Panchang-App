import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Appearance, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { colors, ThemeColors, ThemeMode } from './colors';
import { typography } from './typography';
import { spacing, layout } from './spacing';

const THEME_STORAGE_KEY = '@user_theme_preference';

// Cookies helper methods for sandboxed web client previews
const getCookie = (name: string): string | null => {
  try {
    if (typeof document !== 'undefined') {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        const rawVal = parts.pop()?.split(';').shift() || null;
        return rawVal ? decodeURIComponent(rawVal) : null;
      }
    }
  } catch (e) {}
  return null;
};

const setCookie = (name: string, value: string, days = 365) => {
  try {
    if (typeof document !== 'undefined') {
      const d = new Date();
      d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = "expires=" + d.toUTCString();
      const encodedValue = encodeURIComponent(value);
      document.cookie = `${name}=${encodedValue};${expires};path=/;SameSite=Strict`;
    }
  } catch (e) {}
};

const removeCookie = (name: string) => {
  try {
    if (typeof document !== 'undefined') {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }
  } catch (e) {}
};

// Memory fallback for environments where storage is blocked or broken
const memoryStorage: Record<string, string> = {};

// Platform-agnostic safe storage wrapper to prevent AsyncStorage NativeModule crashes on Web
const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    // 1. Try localStorage first (fast, works on Web, safe fallback)
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch (e) {}

    // 2. Try Cookies (Web fallback for sandboxed/restricted browsers)
    try {
      const val = getCookie(key);
      if (val !== null) return val;
    } catch (e) {}

    // 3. Try SecureStore (Mobile native secure storage)
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      // 4. Try AsyncStorage (fallback for native mobile)
      try {
        return await AsyncStorage.getItem(key);
      } catch (nativeErr) {
        return null;
      }
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    let saved = false;
    // 1. Try localStorage
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
        saved = true;
      }
    } catch (e) {}

    // 2. Try Cookies
    try {
      setCookie(key, value);
      saved = true;
    } catch (e) {}

    // 3. Try SecureStore (Mobile native secure storage)
    try {
      await SecureStore.setItemAsync(key, value);
      saved = true;
    } catch (e) {
      // 4. Try AsyncStorage (fallback for native mobile)
      try {
        await AsyncStorage.setItem(key, value);
        saved = true;
      } catch (nativeErr) {}
    }

    // 5. Fallback to memory storage
    if (!saved) {
      memoryStorage[key] = value;
    }
  },
  removeItem: async (key: string): Promise<void> => {
    // 1. Try localStorage
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (e) {}
    // 2. Try Cookies
    try {
      removeCookie(key);
    } catch (e) {}
    // 3. Try SecureStore (Mobile native secure storage)
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      // 4. Try AsyncStorage (fallback for native mobile)
      try {
        await AsyncStorage.removeItem(key);
      } catch (nativeErr) {}
    }
    delete memoryStorage[key];
  }
};

type UserThemeMode = ThemeMode | 'system';

type Theme = {
  themeMode: ThemeMode;
  isDark: boolean;
  userOverride: UserThemeMode | null;
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  layout: typeof layout;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setSystemDefault: () => void;
};

const getInitialOverride = (): UserThemeMode | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const syncVal = window.localStorage.getItem(THEME_STORAGE_KEY) as UserThemeMode;
      if (syncVal && (syncVal === 'system' || colors[syncVal])) {
        return syncVal;
      }
    }
  } catch (e) {}

  try {
    const cookieVal = getCookie(THEME_STORAGE_KEY) as UserThemeMode;
    if (cookieVal && (cookieVal === 'system' || colors[cookieVal])) {
      return cookieVal;
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
  const [userOverride, setUserOverride] = useState<UserThemeMode | null>(getInitialOverride);

  // Hydrate from storage on native boot
  useEffect(() => {
    let isMounted = true;
    const loadStoredPreference = async () => {
      try {
        const stored = (await safeStorage.getItem(THEME_STORAGE_KEY)) as UserThemeMode;
        if (isMounted && stored && (stored === 'system' || colors[stored])) {
          setUserOverride(stored);
        }
      } catch (e) {}
    };
    loadStoredPreference();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute active themeMode
  const themeMode: ThemeMode = (userOverride && userOverride !== 'system')
    ? userOverride
    : ((systemColorScheme === 'dark' || Appearance.getColorScheme() === 'dark') ? 'dark' : 'light');

  const isDark = themeMode === 'dark';

  const setThemeMode = async (mode: ThemeMode) => {
    setUserOverride(mode);
    await safeStorage.setItem(THEME_STORAGE_KEY, mode);
  };

  const toggleTheme = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'crimsonLight'];
    const currentIndex = modes.indexOf(themeMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setThemeMode(nextMode);
  };

  const setSystemDefault = async () => {
    setUserOverride('system');
    await safeStorage.setItem(THEME_STORAGE_KEY, 'system');
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



