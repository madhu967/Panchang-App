import React from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Switch } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Typography } from '../components/Typography';
import { PremiumCard } from '../components/PremiumCard';
import { AppHeader } from '../components/AppHeader';
import { Moon, Compass, Sun, Globe, Bell, MapPin, Sparkles, ChevronRight, HelpCircle, Shield, Info, Smartphone, Check } from 'lucide-react-native';

export const MenuScreen = ({ navigation }: any) => {
  const { colors, isDark, themeMode, setThemeMode, userOverride, setSystemDefault } = useTheme();

  const themeOptions: { id: 'light' | 'dark' | 'crimsonLight'; name: string; desc: string; primaryColor: string }[] = [
    { id: 'light', name: 'Gold Light', desc: 'Classic Gold Light Theme', primaryColor: '#D4AF37' },
    { id: 'dark', name: 'Gold Dark', desc: 'High-Contrast OLED Dark Theme', primaryColor: '#D4AF37' },
    { id: 'crimsonLight', name: 'Crimson Gold Light', desc: 'Royal Crimson Red + Gold Light', primaryColor: '#7A1124' },
  ];

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
      <AppHeader 
        title="Menu & Settings" 
        subtitle="Vedic Utilities & Preferences"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Theme Selection Card */}
        <PremiumCard style={styles.themeCard}>
          <Typography variant="body" weight="semibold" style={{ marginBottom: 4 }}>
            App Theme & Color Palette
          </Typography>
          <Typography variant="caption" color="muted" style={{ marginBottom: 14 }}>
            Select your preferred primary color theme
          </Typography>

          <View style={styles.themeGrid}>
            {themeOptions.map((t) => {
              const isActive = themeMode === t.id && userOverride !== null;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.themeChip,
                    { borderColor: isActive ? colors.primary : colors.border },
                    isActive && { backgroundColor: colors.primary + '18' }
                  ]}
                  onPress={() => setThemeMode(t.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.colorDot, { backgroundColor: t.primaryColor }]} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Typography variant="caption" weight={isActive ? "bold" : "semibold"}>
                      {t.name}
                    </Typography>
                    <Typography variant="caption" color="muted" style={{ fontSize: 10 }}>
                      {t.desc}
                    </Typography>
                  </View>
                  {isActive && <Check color={colors.primary} size={16} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.sysDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.sysRow} onPress={setSystemDefault} activeOpacity={0.7}>
            <Smartphone color={colors.primary} size={20} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Typography variant="body" weight="medium">Use System Default Theme</Typography>
              <Typography variant="caption" color="muted">Sync automatically with device OS dark/light mode</Typography>
            </View>
            {userOverride === null && (
              <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                <Check color={colors.onPrimary || "#000000"} size={14} />
              </View>
            )}
          </TouchableOpacity>
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
  themeGrid: {
    gap: 10,
    marginBottom: 6,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  sysDivider: {
    height: 1,
    marginVertical: 14,
  },
  sysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
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
