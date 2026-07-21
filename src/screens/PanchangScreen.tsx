import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Typography } from '../components/Typography';
import { PremiumCard } from '../components/PremiumCard';
import { AppHeader } from '../components/AppHeader';
import { MapPin, Calendar as CalendarIcon, Sun, Moon, Sparkles, AlertCircle, Clock, ChevronRight } from 'lucide-react-native';
import { getSunriseTime, getSunsetTime } from '../services/vedAstroApi';

interface PanchangScreenProps {
  navigation?: any;
  route?: {
    params?: {
      location?: string;
      latitude?: number;
      longitude?: number;
      date?: string;
    };
  };
}

export const PanchangScreen: React.FC<PanchangScreenProps> = ({ navigation, route }) => {
  const { colors, spacing, isDark } = useTheme();

  const location = route?.params?.location || 'New Delhi, India';
  const latitude = route?.params?.latitude || 28.6139;
  const longitude = route?.params?.longitude || 77.2090;
  const date = route?.params?.date || '20 Jul 2026';

  const [sunriseTime, setSunriseTime] = useState<string>('05:48 AM');
  const [sunsetTime, setSunsetTime] = useState<string>('06:52 PM');
  const [isLoadingSunTimes, setIsLoadingSunTimes] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSunTimes = async () => {
      setIsLoadingSunTimes(true);
      try {
        const [sunrise, sunset] = await Promise.all([
          getSunriseTime(date, latitude, longitude, location),
          getSunsetTime(date, latitude, longitude, location),
        ]);

        if (isMounted) {
          const cleanSunrise = sunrise.split(' ')[0] || sunrise;
          const cleanSunset = sunset.split(' ')[0] || sunset;
          setSunriseTime(cleanSunrise);
          setSunsetTime(cleanSunset);
        }
      } catch (err) {
        console.warn('Failed to fetch sun times on PanchangScreen:', err);
      } finally {
        if (isMounted) setIsLoadingSunTimes(false);
      }
    };

    fetchSunTimes();
    return () => { isMounted = false; };
  }, [location, latitude, longitude, date]);

  const panchangData = [
    { title: 'Tithi', value: 'Shukla Dashami', subValue: 'Ends at 02:45 PM' },
    { title: 'Nakshatra', value: 'Vishakha', subValue: 'Ends at 11:30 PM' },
    { title: 'Yoga', value: 'Shiva', subValue: 'Ends at 05:15 AM (Next Day)' },
    { title: 'Karana', value: 'Taitila', subValue: 'Ends at 02:45 PM' },
    { title: 'Paksha', value: 'Shukla Paksha', subValue: 'Bright Half' },
    { title: 'Rasi (Moon)', value: 'Tula (Libra)', subValue: 'Up to 05:20 PM' },
    { title: 'Rasi (Sun)', value: 'Karka (Cancer)', subValue: 'Dakshinayana' },
  ];

  const auspiciousTimings = [
    { title: 'Abhijit Muhurat', time: '11:54 AM - 12:48 PM', type: 'Best Time' },
    { title: 'Amrit Kalam', time: '04:15 PM - 05:50 PM', type: 'Auspicious' },
    { title: 'Brahma Muhurat', time: '04:12 AM - 05:00 AM', type: 'Spiritual' },
    { title: 'Vijaya Muhurat', time: '02:35 PM - 03:28 PM', type: 'Success' },
  ];

  const inauspiciousTimings = [
    { title: 'Rahu Kalam', time: '10:30 AM - 12:00 PM' },
    { title: 'Yamagandam', time: '03:00 PM - 04:30 PM' },
    { title: 'Gulika Kalam', time: '07:30 AM - 09:00 AM' },
    { title: 'Dur Muhurat', time: '08:24 AM - 09:18 AM' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with safe top gap */}
      <AppHeader 
        title="Panchangam Details" 
        subtitle={`${location} • ${date}`}
        onMenuPress={() => navigation?.navigate('Menu')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Location & Date Sub-bar */}
        <View style={styles.headerInfoRow}>
          <MapPin color={colors.primary} size={14} />
          <Typography variant="caption" color="muted" style={{ marginLeft: 4, marginRight: 12 }}>
            {location}
          </Typography>
          <CalendarIcon color={colors.secondary} size={14} />
          <Typography variant="caption" color="muted" style={{ marginLeft: 4 }}>
            {date}
          </Typography>
        </View>

        {/* Sun & Moon Times Banner */}
        <PremiumCard style={styles.sunMoonCard}>
          <View style={styles.sunMoonRow}>
            <View style={styles.sunBox}>
              <Sun color={colors.primary} size={24} />
              <Typography variant="caption" color="muted" style={{ marginTop: 6 }}>Sunrise</Typography>
              {isLoadingSunTimes ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 2 }} />
              ) : (
                <Typography variant="body" weight="bold">{sunriseTime}</Typography>
              )}
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.sunBox}>
              <Moon color={colors.secondary} size={24} />
              <Typography variant="caption" color="muted" style={{ marginTop: 6 }}>Sunset</Typography>
              {isLoadingSunTimes ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 2 }} />
              ) : (
                <Typography variant="body" weight="bold">{sunsetTime}</Typography>
              )}
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.sunBox}>
              <Sparkles color={colors.primary} size={24} />
              <Typography variant="caption" color="muted" style={{ marginTop: 6 }}>Moonrise</Typography>
              <Typography variant="body" weight="bold">01:42 PM</Typography>
            </View>
          </View>
        </PremiumCard>

        {/* Five Principal Elements */}
        <Typography variant="subtitle" color="primary" style={{ marginBottom: 12 }}>
          5 Principal Elements (Panchang)
        </Typography>

        <PremiumCard style={styles.summaryCard}>
          {panchangData.map((item, idx) => (
            <View 
              key={idx} 
              style={[
                styles.dataRow, 
                idx !== panchangData.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#1E1E26' : '#F0EAD6' }
              ]}
            >
              <View style={{ flex: 1 }}>
                <Typography variant="body" weight="semibold">{item.title}</Typography>
                <Typography variant="caption" color="muted">{item.subValue}</Typography>
              </View>
              <Typography variant="body" weight="bold" color="primary">{item.value}</Typography>
            </View>
          ))}
        </PremiumCard>

        {/* Auspicious Muhurthas */}
        <View style={styles.section}>
          <Typography variant="subtitle" style={styles.sectionTitle}>
            Shubh Muhurat (Auspicious Timings)
          </Typography>
          <View style={styles.grid}>
            {auspiciousTimings.map((item, idx) => (
              <PremiumCard key={idx} style={styles.gridItem}>
                <View style={styles.tagBadge}>
                  <Typography variant="caption" weight="bold" style={{ color: '#000', fontSize: 10 }}>
                    {item.type}
                  </Typography>
                </View>
                <Typography variant="body" weight="semibold" style={{ marginTop: 8 }}>{item.title}</Typography>
                <Typography variant="caption" color="muted" style={{ marginTop: 4 }}>{item.time}</Typography>
              </PremiumCard>
            ))}
          </View>
        </View>

        {/* Inauspicious Timings */}
        <View style={styles.section}>
          <Typography variant="subtitle" style={styles.sectionTitle}>
            Ashubh Samay (Inauspicious Timings)
          </Typography>
          <View style={styles.grid}>
            {inauspiciousTimings.map((item, idx) => (
              <PremiumCard key={idx} style={styles.gridItem}>
                <Typography variant="body" weight="semibold" style={{ color: '#FF4500' }}>{item.title}</Typography>
                <Typography variant="caption" color="muted" style={{ marginTop: 6 }}>{item.time}</Typography>
              </PremiumCard>
            ))}
          </View>
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
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sunMoonCard: {
    marginBottom: 24,
  },
  sunMoonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  sunBox: {
    alignItems: 'center',
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(150,150,150,0.2)',
  },
  summaryCard: {
    marginBottom: 28,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: 16,
    padding: 16,
  },
  tagBadge: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
});
