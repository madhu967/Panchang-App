import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Typography } from './Typography';
import { Menu, Moon, Sun } from 'lucide-react-native';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onMenuPress?: () => void;
  showThemeToggle?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  onMenuPress,
  showThemeToggle = true,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();

  return (
    <View 
      style={[
        styles.headerContainer,
        {
          paddingTop: Math.max(insets.top, 16) + 10,
          backgroundColor: colors.primary, // Always primary color (Gold) in both light and dark mode as requested
          borderBottomColor: 'rgba(0, 0, 0, 0.1)',
        }
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.titleContainer}>
          <Typography 
            variant="display" 
            style={styles.titleText}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography 
              variant="caption" 
              style={styles.subtitleText}
            >
              {subtitle}
            </Typography>
          )}
        </View>

        <View style={styles.actionRow}>
          {showThemeToggle && (
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              {isDark ? (
                <Moon color="#000000" size={20} />
              ) : (
                <Sun color="#000000" size={20} />
              )}
            </TouchableOpacity>
          )}

          {onMenuPress && (
            <TouchableOpacity 
              style={[styles.iconButton, { marginLeft: 10 }]} 
              onPress={onMenuPress}
              activeOpacity={0.7}
            >
              <Menu color="#000000" size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000', // Crisp black text on gold primary background
  },
  subtitleText: {
    color: 'rgba(0, 0, 0, 0.75)',
    marginTop: 2,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
