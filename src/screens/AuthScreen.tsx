import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Dimensions, 
  Alert 
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Typography } from '../components/Typography';
import { PremiumCard } from '../components/PremiumCard';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, Sparkles, Shield, Flame } from 'lucide-react-native';
import { useAuth } from '../services/AuthContext';
import { AppHeader } from '../components/AppHeader';

const { width } = Dimensions.get('window');

export const AuthScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (!isLogin && !displayName) {
      Alert.alert('Error', 'Please enter your name.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, displayName.trim());
        Alert.alert(
          'Registration Successful',
          'Your account registration request has been submitted. It requires approval by the admin before you can log in.'
        );
      }
    } catch (error: any) {
      console.error(error);
      let errorMsg = 'An error occurred during authentication.';
      if (error.code === 'auth/email-already-in-use') {
        errorMsg = 'This email is already registered.';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMsg = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMsg = 'Invalid email or password.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      Alert.alert('Authentication Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader 
        title="Vedic Panchangam" 
        subtitle="Authentication & Sign In"
        showThemeToggle={true}
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {/* Top Decorative Background */}
          <View style={styles.headerDecorative}>
            <View style={[styles.iconContainer, { borderColor: colors.primary }]}>
              <Flame color={colors.primary} size={36} />
            </View>
            <Typography variant="body" color="muted" style={styles.subtitle}>
              {isLogin ? 'Enter your credentials to access the sacred calendar' : 'Request account access to calculate birth charts and Panchangam'}
            </Typography>
          </View>

        {/* Main Card */}
        <PremiumCard style={styles.card}>
          {/* Tabs */}
          <View style={[styles.tabs, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
            <TouchableOpacity 
              style={[
                styles.tab, 
                isLogin && [styles.activeTab, { backgroundColor: colors.primary }]
              ]} 
              onPress={() => setIsLogin(true)}
            >
              <Typography 
                variant="caption" 
                weight="bold" 
                style={isLogin ? { color: '#000000' } : { color: colors.textSecondary }}
              >
                SIGN IN
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.tab, 
                !isLogin && [styles.activeTab, { backgroundColor: colors.primary }]
              ]} 
              onPress={() => setIsLogin(false)}
            >
              <Typography 
                variant="caption" 
                weight="bold" 
                style={!isLogin ? { color: '#000000' } : { color: colors.textSecondary }}
              >
                CREATE ACCOUNT
              </Typography>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Typography variant="caption" weight="semibold" color="muted" style={styles.label}>
                  FULL NAME
                </Typography>
                <View style={[styles.inputWrapper, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border }]}>
                  <User size={18} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.textSecondary + '80'}
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Typography variant="caption" weight="semibold" color="muted" style={styles.label}>
                EMAIL ADDRESS
              </Typography>
              <View style={[styles.inputWrapper, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border }]}>
                <Mail size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@domain.com"
                  placeholderTextColor={colors.textSecondary + '80'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.input, { color: colors.text }]}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Typography variant="caption" weight="semibold" color="muted" style={styles.label}>
                PASSWORD
              </Typography>
              <View style={[styles.inputWrapper, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border }]}>
                <Lock size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textSecondary + '80'}
                  secureTextEntry
                  style={[styles.input, { color: colors.text }]}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={handleAuth}
              disabled={loading}
            >
              <LinearGradient
                colors={(colors.primaryGradient || ['#D4AF37', '#FF9933']) as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <View style={styles.btnContent}>
                    <Typography variant="body" weight="bold" style={styles.btnText}>
                      {isLogin ? 'Sign In Now' : 'Request Access'}
                    </Typography>
                    <Sparkles size={16} color="#000" style={styles.btnIcon} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </PremiumCard>

        {/* Note about approval */}
        {!isLogin && (
          <View style={styles.infoBox}>
            <Shield size={16} color={colors.primary} style={styles.infoIcon} />
            <Typography variant="caption" color="muted" style={styles.infoText}>
              Note: To maintain the privacy and security of calculations, new accounts require manual approval by an administrator before access is granted.
            </Typography>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  headerDecorative: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 20,
  },
  card: {
    width: '100%',
    padding: 24,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    letterSpacing: 1,
    fontSize: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  actionBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 10,
  },
  gradientBtn: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnText: {
    color: '#000000',
  },
  btnIcon: {
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    lineHeight: 16,
  },
});
