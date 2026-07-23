import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AnimatedSplashScreen } from './src/screens/AnimatedSplashScreen';
import { useFonts } from 'expo-font';
import './src/services/firebase';
import { AuthProvider, useAuth } from './src/services/AuthContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { StatusScreen } from './src/screens/StatusScreen';
import { AdminDashboardScreen } from './src/screens/AdminDashboardScreen';


import { 
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold
} from '@expo-google-fonts/plus-jakarta-sans';
import { 
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold
} from '@expo-google-fonts/dm-sans';

const MainAppContent = () => {
  const [showSplash, setShowSplash] = useState(true);
  const { colors, isDark } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppNavigator />

      {/* Splash Screen overlay matching active theme */}
      {showSplash && (
        <AnimatedSplashScreen onComplete={() => setShowSplash(false)} />
      )}

      <StatusBar style={isDark ? "light" : "dark"} />
    </View>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <MainAppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
