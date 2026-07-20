export const colors = {
  light: {
    background: '#F1F5F9', // Soft light slate gray background so pure white cards pop
    surface: '#FFFFFF', // Pure White surface for cards
    surfaceVariant: '#E2E8F0', // Crisp slate gray background for chips & inputs
    primary: '#D4AF37', // Signature Gold (Same in Light & Dark Mode)
    primaryGradient: ['#D4AF37', '#FF9933'],
    secondary: '#FF9933', // Signature Saffron
    text: '#0F172A', // Slate-900 ultra dark text
    textSecondary: '#475569', // Slate-600 clear secondary text
    border: '#CBD5E1', // Slate-300 crisp border for cards
    cardShadow: 'rgba(15, 23, 42, 0.12)',
  },
  dark: {
    background: '#000000', // Pure OLED Black
    surface: '#121212', // Dark card background
    surfaceVariant: '#1E1E26',
    primary: '#D4AF37', // Signature Gold
    primaryGradient: ['#D4AF37', '#FF9933'],
    secondary: '#FF9933', // Saffron
    text: '#FFFFFF', // Pure White
    textSecondary: '#9CA3AF', // Muted Gray
    border: '#26262D',
    cardShadow: 'rgba(0,0,0,0.8)',
  },
};

export type ThemeColors = typeof colors.light;
