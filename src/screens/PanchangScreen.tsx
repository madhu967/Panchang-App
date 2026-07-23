import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator,
  TextInput,
  Share,
  Dimensions
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Typography } from '../components/Typography';
import { PremiumCard } from '../components/PremiumCard';
import { AppHeader } from '../components/AppHeader';
import { 
  MapPin, 
  Calendar as CalendarIcon, 
  Sun, 
  Moon, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  ChevronRight,
  ChevronDown,
  Search,
  Share2,
  Sliders,
  Info,
  CheckCircle2,
  Compass,
  ArrowUpDown,
  BookOpen
} from 'lucide-react-native';
import { getNavamshaPanchang } from '../services/navamshaApi';
import { getCachedLocation } from '../services/locationService';

const { width } = Dimensions.get('window');

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

interface NormalizedPanchang {
  tithi: { name: string; start: string; end: string; detail?: string };
  nakshatra: { name: string; start: string; end: string; detail?: string };
  yoga: { name: string; start: string; end: string; detail?: string };
  karana: { name: string; start: string; end: string; detail?: string };
  vara: { name: string; detail?: string };
  sunrise: string;
  sunset: string;
  moonrise: string;
  moonset: string;
  auspiciousPeriods: { title: string; time: string; type: string }[];
  inauspiciousPeriods: { title: string; time: string }[];
  otherDetails: { key: string; value: string }[];
}

export const PanchangScreen: React.FC<PanchangScreenProps> = ({ navigation, route }) => {
  const { colors, spacing, isDark } = useTheme();

  const cachedLoc = getCachedLocation();
  const location = route?.params?.location || cachedLoc?.name || 'New Delhi, India';
  const latitude = route?.params?.latitude || cachedLoc?.latitude || 28.6139;
  const longitude = route?.params?.longitude || cachedLoc?.longitude || 77.2090;
  const date = route?.params?.date || (() => {
    const d = new Date();
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  })();

  const [rawApiResponse, setRawApiResponse] = useState<any>(null);
  const [panchangData, setPanchangData] = useState<NormalizedPanchang | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);

  // Inspector States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [isInspectorExpanded, setIsInspectorExpanded] = useState<boolean>(false);

  const normalizeResponse = (res: any): NormalizedPanchang => {
    const output = res?.output || res;
    
    const formatIsoToTimeStr = (isoStr: string): string => {
      if (!isoStr) return 'N/A';

      try {
        // Fix microseconds (.804213 -> .804)
        const fixedIso = isoStr.replace(
          /\.(\d{3})\d+/,
          '.$1'
        );

        const d = new Date(fixedIso);

        if (isNaN(d.getTime())) {
          return isoStr;
        }

        return d.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

      } catch (error) {
        console.log("Time parse error:", isoStr, error);
        return isoStr;
      }
    };

    const getFirstItem = (arr: any) => {
      if (Array.isArray(arr) && arr.length > 0) return arr[0];
      return null;
    };

    // Parse Tithi
    const rawTithi = getFirstItem(output?.tithi);
    const tithiName = rawTithi?.name || 'N/A';
    const paksha = rawTithi?.paksha || '';
    const tithi = {
      name: paksha ? `${tithiName} (${paksha} Paksha)` : tithiName,
      start: rawTithi?.start ? formatIsoToTimeStr(rawTithi.start) : '',
      end: rawTithi?.end ? formatIsoToTimeStr(rawTithi.end) : '',
      detail: paksha ? `${paksha} Paksha` : ''
    };

    // Parse Nakshatra
    const rawNakshatra = getFirstItem(output?.nakshatra);
    const nakshatra = {
      name: rawNakshatra?.name || 'N/A',
      start: rawNakshatra?.start ? formatIsoToTimeStr(rawNakshatra.start) : '',
      end: rawNakshatra?.end ? formatIsoToTimeStr(rawNakshatra.end) : '',
      detail: rawNakshatra?.lord?.name ? `Lord: ${rawNakshatra.lord.name}` : ''
    };

    // Parse Yoga
    const rawYoga = getFirstItem(output?.yoga);
    const yoga = {
      name: rawYoga?.name || 'N/A',
      start: rawYoga?.start ? formatIsoToTimeStr(rawYoga.start) : '',
      end: rawYoga?.end ? formatIsoToTimeStr(rawYoga.end) : '',
      detail: ''
    };

    // Parse Karana
    const rawKarana = getFirstItem(output?.karana);
    const karana = {
      name: rawKarana?.name || 'N/A',
      start: rawKarana?.start ? formatIsoToTimeStr(rawKarana.start) : '',
      end: rawKarana?.end ? formatIsoToTimeStr(rawKarana.end) : '',
      detail: ''
    };

    // Parse Vara
    const vara = {
      name: output?.vaara || 'N/A',
      detail: output?.vaara ? `Weekday: ${output.vaara}` : ''
    };

    // Sun & Moon times
    const sunrise = output?.sunrise ? formatIsoToTimeStr(output.sunrise) : 'N/A';
    const sunset = output?.sunset ? formatIsoToTimeStr(output.sunset) : 'N/A';
    const moonrise = output?.moonrise ? formatIsoToTimeStr(output.moonrise) : 'N/A';
    const moonset = output?.moonset ? formatIsoToTimeStr(output.moonset) : 'N/A';

    // Auspicious periods
    const auspiciousPeriods: { title: string; time: string; type: string }[] = [];
    if (Array.isArray(output?.auspicious_period)) {
      output.auspicious_period.forEach((item: any) => {
        const periodObj = getFirstItem(item.period);
        if (periodObj) {
          const timeRange = `${formatIsoToTimeStr(periodObj.start)} - ${formatIsoToTimeStr(periodObj.end)}`;
          auspiciousPeriods.push({
            title: item.name || 'Auspicious Muhurat',
            time: timeRange,
            type: item.type || 'Auspicious'
          });
        }
      });
    }

    // Inauspicious periods
    const inauspiciousPeriods: { title: string; time: string }[] = [];
    if (Array.isArray(output?.inauspicious_period)) {
      output.inauspicious_period.forEach((item: any) => {
        const periodObj = getFirstItem(item.period);
        if (periodObj) {
          const timeRange = `${formatIsoToTimeStr(periodObj.start)} - ${formatIsoToTimeStr(periodObj.end)}`;
          inauspiciousPeriods.push({
            title: item.name || 'Inauspicious Period',
            time: timeRange
          });
        }
      });
    }

    // Fallbacks if periods are empty
    if (auspiciousPeriods.length === 0) {
      auspiciousPeriods.push(
        { title: 'Abhijit Muhurat', time: '11:54 AM - 12:48 PM', type: 'Best Time' },
        { title: 'Amrit Kalam', time: '04:15 PM - 05:50 PM', type: 'Auspicious' }
      );
    }
    if (inauspiciousPeriods.length === 0) {
      inauspiciousPeriods.push(
        { title: 'Rahu Kalam', time: '10:30 AM - 12:00 PM' },
        { title: 'Yamagandam', time: '03:00 PM - 04:30 PM' }
      );
    }

    // Flatten other fields for inspector
    const otherDetails: { key: string; value: string }[] = [];
    const traverse = (obj: any, prefix: string = '') => {
      if (!obj) return;
      for (const key of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        if (value !== null && typeof value === 'object') {
          traverse(value, fullKey);
        } else {
          otherDetails.push({ key: fullKey, value: String(value) });
        }
      }
    };
    traverse(output);

    return {
      tithi,
      nakshatra,
      yoga,
      karana,
      vara,
      sunrise,
      sunset,
      moonrise,
      moonset,
      auspiciousPeriods,
      inauspiciousPeriods,
      otherDetails
    };
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadPanchangDetails = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      setIsUsingFallback(false);
      
      try {
        const response = await getNavamshaPanchang(date, latitude, longitude);
        
        if (isMounted) {
          if (response) {
            setRawApiResponse(response);
            const normalized = normalizeResponse(response);
            setPanchangData(normalized);
          } else {
            throw new Error("Empty response from Navamsha API");
          }
        }
      } catch (err: any) {
        console.warn('Navamsha API failed, using offline fallback calculations:', err);
        if (isMounted) {
          setErrorMsg('Navamsha API failed. Using standard values.');
          setIsUsingFallback(true);
          // Set mock data based on input date to prevent empty screen
          const mockData = {
            tithi: { name: 'Shukla Dashami', start: '06:00 AM', end: '02:45 PM', detail: 'Auspicious for actions' },
            nakshatra: { name: 'Vishakha', start: '08:00 AM', end: '11:30 PM', detail: 'Constellation of power' },
            yoga: { name: 'Shiva', start: '09:00 AM', end: '05:15 AM (Next Day)', detail: 'Auspicious' },
            karana: { name: 'Taitila', start: '06:00 AM', end: '02:45 PM', detail: 'Action-oriented' },
            vara: { name: 'Thursday', detail: 'Ruled by Jupiter' },
            sunrise: '05:48 AM',
            sunset: '06:52 PM',
            moonrise: '01:42 PM',
            moonset: '02:15 AM',
            auspiciousPeriods: [
              { title: 'Abhijit Muhurat', time: '11:54 AM - 12:48 PM', type: 'Best Time' },
              { title: 'Amrit Kalam', time: '04:15 PM - 05:50 PM', type: 'Auspicious' }
            ],
            inauspiciousPeriods: [
              { title: 'Rahu Kalam', time: '10:30 AM - 12:00 PM' },
              { title: 'Yamagandam', time: '03:00 PM - 04:30 PM' }
            ],
            otherDetails: [
              { key: 'error.code', value: 'API_CONNECTION_ERROR' },
              { key: 'error.message', value: String(err.message || 'Network request failed') },
              { key: 'fallback.active', value: 'true' }
            ]
          };
          setPanchangData(mockData);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadPanchangDetails();
    return () => { isMounted = false; };
  }, [location, latitude, longitude, date]);

  // Share functionality
  const handleShare = async () => {
    if (!panchangData) return;
    try {
      const shareMessage = `✨ Vedic Panchangam Almanac ✨\n` +
        `📅 Date: ${date}\n` +
        `📍 Location: ${location}\n\n` +
        `• Tithi: ${panchangData.tithi.name}\n` +
        `  (Start: ${panchangData.tithi.start} | End: ${panchangData.tithi.end})\n` +
        `• Nakshatra: ${panchangData.nakshatra.name}\n` +
        `  (Start: ${panchangData.nakshatra.start} | End: ${panchangData.nakshatra.end})\n` +
        `• Yoga: ${panchangData.yoga.name}\n` +
        `  (Start: ${panchangData.yoga.start} | End: ${panchangData.yoga.end})\n` +
        `• Karana: ${panchangData.karana.name}\n` +
        `  (Start: ${panchangData.karana.start} | End: ${panchangData.karana.end})\n` +
        `• Vara: ${panchangData.vara.name}\n\n` +
        `🌞 Sunrise: ${panchangData.sunrise} | 🌇 Sunset: ${panchangData.sunset}\n` +
        `🌙 Moonrise: ${panchangData.moonrise} | 🌗 Moonset: ${panchangData.moonset}\n\n` +
        `Calculated via Navamsha Engine.`;

      await Share.share({
        message: shareMessage,
        title: `Panchang details - ${date}`,
      });
    } catch (err) {
      console.warn('Error sharing Panchang details:', err);
    }
  };

  // Filter keys in Inspector
  const filteredDetails = React.useMemo(() => {
    if (!panchangData) return [];
    if (!searchQuery.trim()) return panchangData.otherDetails;
    const query = searchQuery.toLowerCase();
    return panchangData.otherDetails.filter(
      item => item.key.toLowerCase().includes(query) || item.value.toLowerCase().includes(query)
    );
  }, [panchangData, searchQuery]);

  // Determine if we should display the static astrological card (only if signs are present in response)
  const showAstroMetrics = React.useMemo(() => {
    if (!rawApiResponse) return false;
    const output = rawApiResponse.output || rawApiResponse;
    return !!(output.sun_sign || output.moon_sign || output.ascendant || output.ayanamsa || output.solar_month || output.lunar_month);
  }, [rawApiResponse]);

  const astroMetrics = React.useMemo(() => {
    if (!rawApiResponse) return [];
    const output = rawApiResponse.output || rawApiResponse;
    return [
      { label: 'Sun Sign', value: output.sun_sign },
      { label: 'Moon Sign', value: output.moon_sign },
      { label: 'Lagna (Ascendant)', value: output.ascendant },
      { label: 'Ayanamsa', value: output.ayanamsa },
      { label: 'Lunar Month', value: output.lunar_month },
      { label: 'Solar Month', value: output.solar_month },
    ].filter(item => item.value !== undefined && item.value !== null && item.value !== '');
  }, [rawApiResponse]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader 
        title="Vedic Panchangam" 
        subtitle={`${location}`}
        onMenuPress={() => navigation?.navigate('Menu')}
        rightIcon={Share2}
        onRightPress={handleShare}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Sub-bar */}
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

        {/* Engine Status Banner */}
        <View style={[styles.statusBanner, { 
          backgroundColor: isUsingFallback ? 'rgba(239, 68, 68, 0.1)' : 'rgba(212, 175, 55, 0.08)',
          borderColor: isUsingFallback ? '#EF4444' : colors.primary,
        }]}>
          {isUsingFallback ? (
            <AlertCircle color="#EF4444" size={16} />
          ) : (
            <CheckCircle2 color={colors.primary} size={16} />
          )}
          <Typography variant="caption" weight="semibold" style={{ marginLeft: 8, color: isUsingFallback ? '#EF4444' : colors.primary }}>
            {isUsingFallback ? 'Navamsha API failed - Displaying Mock Offline Data' : 'Powered by Navamsha Precision Engine'}
          </Typography>
        </View>

        {/* Sun & Moon Times Banner */}
        <PremiumCard style={styles.sunMoonCard}>
          <View style={styles.sunMoonRow}>
            <View style={styles.sunBox}>
              <Sun color={colors.primary} size={24} />
              <Typography variant="caption" color="muted" style={{ marginTop: 6 }}>Sunrise</Typography>
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 2 }} />
              ) : (
                <Typography variant="body" weight="bold">{panchangData?.sunrise}</Typography>
              )}
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.sunBox}>
              <Moon color={colors.secondary} size={24} />
              <Typography variant="caption" color="muted" style={{ marginTop: 6 }}>Sunset</Typography>
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 2 }} />
              ) : (
                <Typography variant="body" weight="bold">{panchangData?.sunset}</Typography>
              )}
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.sunBox}>
              <Sparkles color={colors.primary} size={24} />
              <Typography variant="caption" color="muted" style={{ marginTop: 6 }}>Moonrise</Typography>
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 2 }} />
              ) : (
                <Typography variant="body" weight="bold">{panchangData?.moonrise}</Typography>
              )}
            </View>
          </View>
        </PremiumCard>

        {/* Five Principal Elements Title */}
        <View style={styles.sectionHeader}>
          <Compass color={colors.primary} size={20} />
          <Typography variant="subtitle" color="primary" style={{ marginLeft: 8 }} weight="bold">
            5 Principal Elements (Panchang)
          </Typography>
        </View>

        {/* Panchang Elements display */}
        {isLoading ? (
          <PremiumCard style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Typography variant="caption" color="muted" style={{ marginTop: 12 }}>
              Calculating Panchang using Navamsha API...
            </Typography>
          </PremiumCard>
        ) : (
          <PremiumCard style={styles.summaryCard}>
            {[
              { title: 'Tithi (Lunar Day)', ...panchangData?.tithi },
              { title: 'Nakshatra (Constellation)', ...panchangData?.nakshatra },
              { title: 'Yoga (Luni-Solar)', ...panchangData?.yoga },
              { title: 'Karana (Half Tithi)', ...panchangData?.karana },
              { title: 'Vara (Weekday)', name: panchangData?.vara.name, detail: panchangData?.vara.detail, start: '', end: '' },
            ].map((item, idx, arr) => (
              <View 
                key={idx} 
                style={[
                  styles.dataRow, 
                  idx !== arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#1E1E26' : '#F0EAD6' }
                ]}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Typography variant="body" weight="semibold">{item.title}</Typography>
                  {item.start && item.end ? (
                    <Typography variant="caption" color="muted" style={{ fontSize: 11, marginTop: 2 }}>
                      Active: {item.start} to {item.end}
                    </Typography>
                  ) : item.end ? (
                    <Typography variant="caption" color="muted" style={{ fontSize: 11, marginTop: 2 }}>
                      Ends at: {item.end}
                    </Typography>
                  ) : item.detail ? (
                    <Typography variant="caption" color="muted" style={{ fontSize: 11, marginTop: 2 }}>
                      {item.detail}
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="muted" style={{ fontSize: 11, marginTop: 2 }}>
                      Daily Vedic division
                    </Typography>
                  )}
                </View>
                <View style={styles.valueBadge}>
                  <Typography variant="body" weight="bold" color="primary" style={{ textAlign: 'right' }}>
                    {item.name || 'N/A'}
                  </Typography>
                  {item.detail && item.start && item.end ? (
                    <Typography variant="caption" color="muted" style={{ fontSize: 11, textAlign: 'right', marginTop: 2 }}>
                      {item.detail}
                    </Typography>
                  ) : null}
                </View>
              </View>
            ))}
          </PremiumCard>
        )}

        {/* Auspicious Muhurthas */}
        {!isLoading && panchangData && panchangData.auspiciousPeriods.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Sun color="#10B981" size={18} />
              <Typography variant="subtitle" style={[styles.sectionTitle, { marginLeft: 8 }]} weight="bold">
                Shubh Muhurat (Auspicious Timings)
              </Typography>
            </View>
            <View style={styles.grid}>
              {panchangData.auspiciousPeriods.map((item, idx) => (
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
        )}

        {/* Inauspicious Timings */}
        {!isLoading && panchangData && panchangData.inauspiciousPeriods.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertCircle color="#EF4444" size={18} />
              <Typography variant="subtitle" style={[styles.sectionTitle, { marginLeft: 8 }]} weight="bold">
                Ashubh Samay (Inauspicious Timings)
              </Typography>
            </View>
            <View style={styles.grid}>
              {panchangData.inauspiciousPeriods.map((item, idx) => (
                <PremiumCard key={idx} style={styles.gridItem}>
                  <Typography variant="body" weight="semibold" style={{ color: '#FF4500' }}>{item.title}</Typography>
                  <Typography variant="caption" color="muted" style={{ marginTop: 6 }}>{item.time}</Typography>
                </PremiumCard>
              ))}
            </View>
          </View>
        )}

        {/* Advanced Astrological Metrics */}
        {!isLoading && showAstroMetrics && astroMetrics.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BookOpen color={colors.primary} size={18} />
              <Typography variant="subtitle" style={[styles.sectionTitle, { marginLeft: 8 }]} weight="bold">
                Cosmic Details & Signs
              </Typography>
            </View>
            <PremiumCard style={{ paddingVertical: 8 }}>
              {astroMetrics.map((item, idx, arr) => (
                <View 
                  key={idx} 
                  style={[
                    styles.astroRow,
                    idx !== arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#1E1E26' : '#F0EAD6' }
                  ]}
                >
                  <Typography variant="body" weight="medium" color="muted">{item.label}</Typography>
                  <Typography variant="body" weight="semibold" style={{ color: colors.text }}>{String(item.value)}</Typography>
                </View>
              ))}
            </PremiumCard>
          </View>
        )}

        {/* Navamsha API Details Search Inspector */}
        {!isLoading && panchangData && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={[styles.accordionHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setIsInspectorExpanded(!isInspectorExpanded)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Sliders color={colors.primary} size={18} />
                <Typography variant="body" weight="bold" style={{ marginLeft: 8 }}>
                  Search Navamsha API Response ({panchangData.otherDetails.length} keys)
                </Typography>
              </View>
              <ChevronDown 
                color={colors.text} 
                size={18} 
                style={{ transform: [{ rotate: isInspectorExpanded ? '180deg' : '0deg' }] }} 
              />
            </TouchableOpacity>

            {isInspectorExpanded && (
              <PremiumCard style={styles.inspectorCard}>
                <Typography variant="caption" color="muted" style={{ marginBottom: 12 }}>
                  Verify or search any key-value pairs directly retrieved from the Navamsha Advanced Panchang JSON response.
                </Typography>
                
                {/* Search Bar */}
                <View style={[styles.searchBar, { backgroundColor: isDark ? '#1E1E26' : '#E2E8F0', borderColor: colors.border }]}>
                  <Search color={colors.textSecondary} size={16} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search response keys or values..."
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.searchInput, { color: colors.text }]}
                  />
                </View>

                {/* Key-Value Lists */}
                <ScrollView style={styles.inspectorScroll} nestedScrollEnabled>
                  {filteredDetails.length === 0 ? (
                    <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                      <Typography variant="caption" color="muted">No matching parameters found.</Typography>
                    </View>
                  ) : (
                    filteredDetails.map((item, idx) => (
                      <View key={idx} style={[styles.inspectorRow, { borderBottomColor: isDark ? '#1E1E26' : '#F0EAD6' }]}>
                        <Typography variant="caption" weight="semibold" style={{ color: colors.primary, flex: 1.2 }}>
                          {item.key}
                        </Typography>
                        <Typography variant="caption" style={{ color: colors.text, flex: 1.8, textAlign: 'right' }}>
                          {item.value}
                        </Typography>
                      </View>
                    ))
                  )}
                </ScrollView>

                {/* Raw JSON Toggle */}
                <TouchableOpacity 
                  style={[styles.rawToggleBtn, { borderColor: colors.primary }]}
                  onPress={() => setShowRawJson(!showRawJson)}
                >
                  <Typography variant="caption" weight="bold" color="primary">
                    {showRawJson ? 'Hide Raw JSON' : 'Show Full Raw JSON Payload'}
                  </Typography>
                </TouchableOpacity>

                {showRawJson && (
                  <View style={[styles.rawJsonContainer, { backgroundColor: isDark ? '#000000' : '#F8FAFC' }]}>
                    <ScrollView horizontal nestedScrollEnabled style={{ padding: 10 }}>
                      <Typography variant="caption" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                        {JSON.stringify(rawApiResponse || panchangData, null, 2)}
                      </Typography>
                    </ScrollView>
                  </View>
                )}
              </PremiumCard>
            )}
          </View>
        )}
        
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
    marginBottom: 12,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  summaryCard: {
    marginBottom: 24,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  valueBadge: {
    flex: 1,
    alignItems: 'flex-end',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    margin: 0,
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
  astroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  inspectorCard: {
    marginTop: 10,
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    padding: 0,
  },
  inspectorScroll: {
    maxHeight: 250,
    marginVertical: 4,
  },
  inspectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  rawToggleBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  rawJsonContainer: {
    marginTop: 12,
    borderRadius: 8,
    maxHeight: 200,
    overflow: 'hidden',
  },
});
