import React from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Switch } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Typography } from '../components/Typography';
import { PremiumCard } from '../components/PremiumCard';
import { AppHeader } from '../components/AppHeader';
import { Moon, Compass, Sun, Globe, Bell, MapPin, Sparkles, ChevronRight, HelpCircle, Shield, Info, Smartphone } from 'lucide-react-native';

export const MenuScreen = ({ navigation }: any) => {
  const { colors, isDark, toggleTheme } = useTheme();

  const menuSections = [
    {
      title: 'Panchang & Astrology Utilities',
      items: [
        { icon: Compass, label: 'Vastu Compass & Energy', sub: 'Harmonize your home directional energy' },
        { icon: Sparkles, label: 'Janma Kundali & Horoscope', sub: 'Vedic planetary chart & daily predictions' },
        { icon: Sun, label: 'Choghadiya & Hora Timings', sub: 'Day & night auspicious Muhurthas' },
      ]
    },
    {
      title: 'Preferences & Settings',
      items: [
        { icon: MapPin, label: 'Location Settings', sub: 'New Delhi, India (Default)' },
        { icon: Globe, label: 'App Language', sub: 'English / Hindi / Telugu' },
        { icon: Bell, label: 'Festivals & Muhurat Reminders', sub: 'Get push notifications' },
      ]
    },
    {
      title: 'Support & Information',
      items: [
        { icon: HelpCircle, label: 'Panchang Glossary & FAQs', sub: 'Understand Tithi, Nakshatra & Yoga' },
        { icon: Shield, label: 'Privacy Policy', sub: 'Your data security & terms' },
        { icon: Info, label: 'About Vedic Panchang', sub: 'Version 2.4.0' },
      ]
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with safe top gap */}
      <AppHeader 
        title="Menu & Settings" 
        subtitle="Vedic Utilities & Preferences"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Dark Mode Toggle Card */}
        <PremiumCard style={styles.themeCard}>
          <View style={styles.themeRow}>
            <View style={styles.iconCircle}>
              <Moon color={colors.primary} size={22} />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Typography variant="body" weight="semibold">Dark Mode</Typography>
              <Typography variant="caption" color="muted">Pure Black High-Contrast OLED Theme</Typography>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={isDark ? colors.secondary : '#f4f3f4'}
            />
          </View>
        </PremiumCard>

        {/* Menu Sections */}
        {menuSections.map((section, sIdx) => (
          <View key={sIdx} style={styles.sectionContainer}>
            <Typography variant="subtitle" color="primary" style={{ marginBottom: 12 }}>
              {section.title}
            </Typography>

            <PremiumCard style={styles.sectionCard} noPadding>
              {section.items.map((item, iIdx) => {
                const ItemIcon = item.icon;
                const isLast = iIdx === section.items.length - 1;
                return (
                  <TouchableOpacity
                    key={iIdx}
                    style={[
                      styles.menuItem,
                      !isLast && { borderBottomWidth: 1, borderBottomColor: isDark ? '#1E1E26' : '#F0EAD6' }
                    ]}
                  >
                    <View style={styles.itemLeft}>
                      <ItemIcon color={colors.primary} size={20} />
                      <View style={{ marginLeft: 16, flex: 1 }}>
                        <Typography variant="body" weight="semibold">{item.label}</Typography>
                        <Typography variant="caption" color="muted" style={{ marginTop: 2 }}>{item.sub}</Typography>
                      </View>
                    </View>
                    <ChevronRight color={colors.textSecondary} size={18} />
                  </TouchableOpacity>
                );
              })}
            </PremiumCard>
          </View>
        ))}

        <View style={styles.footerBrand}>
          <Typography variant="caption" color="muted" style={{ textAlign: 'center' }}>
            Vedic Panchangam © 2026 • Crafted with Precision
          </Typography>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  themeCard: {
    marginBottom: 28,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionCard: {
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  footerBrand: {
    marginTop: 20,
    marginBottom: 10,
  },
});
