import React, { useState, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
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
import { getAdvancedPanchang } from '../services/navamshaApi';
import { getCachedLocation, getCachedDate } from '../services/locationService';

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
  lunarMonth: string;
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
  const isFocused = useIsFocused();

  const cachedLoc = getCachedLocation();
  const cachedDate = getCachedDate();
  const location = route?.params?.location || cachedLoc?.name || 'New Delhi, India';
  const latitude = route?.params?.latitude || cachedLoc?.latitude || 28.6139;
  const longitude = route?.params?.longitude || cachedLoc?.longitude || 77.2090;
  const date = route?.params?.date || cachedDate || (() => {
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
    // If the API returns a wrapper e.g. { statusCode: 200, output: { ... } } or { status: true, data: { ... } }
    const data = res?.output || res?.data || res?.Payload?.PanchangaTable || res?.PanchangaTable || res;

    // Helper to format time values cleanly (e.g. HH:MM:SS or ISO format)
    const formatTime = (timeVal: any): string => {
      if (!timeVal) return 'N/A';
      const timeStr = String(timeVal).trim();
      
      // Check if it matches ISO timestamp: e.g. "2026-08-01T19:25:30.395521+05:30"
      if (timeStr.includes('T')) {
        try {
          const d = new Date(timeStr);
          if (!isNaN(d.getTime())) {
            let hours = d.getHours();
            let minutes = d.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHour = hours % 12 || 12;
            const displayMin = String(minutes).padStart(2, '0');
            return `${String(displayHour).padStart(2, '0')}:${displayMin} ${ampm}`;
          }
        } catch (e) {
          console.warn('Error parsing ISO time:', timeStr, e);
        }
      }

      // Check if it has a pattern like "07:26 31/12/1999 +08:00"
      try {
        const timePart = timeStr.split(/\s+/)[0];
        if (timePart && timePart.includes(':')) {
          const match = timePart.match(/^(\d{1,2}):(\d{2})/);
          if (match) {
            const h = parseInt(match[1], 10);
            const m = match[2];
            const ampm = h >= 12 ? 'PM' : 'AM';
            const displayHour = h % 12 || 12;
            return `${String(displayHour).padStart(2, '0')}:${m} ${ampm}`;
          }
        }
      } catch (e) {
        console.warn('Error formatting time:', timeStr, e);
      }
      return timeStr;
    };

    // Helper to format end time values cleanly
    const getEndTimeString = (item: any): string => {
      if (!item) return '';
      const endVal = item.end_time || item.ends_at || item.end || item.End || '';
      if (!endVal) return '';
      return formatTime(endVal);
    };

    // Parse Tithi (supports array or single object/string)
    let tithi = { name: 'N/A', start: '', end: '', detail: '' };
    let tithiData = data?.tithi || data?.Tithi;
    if (Array.isArray(tithiData)) {
      tithiData = tithiData[0];
    }
    if (tithiData) {
      if (typeof tithiData === 'string') {
        tithi.name = tithiData;
      } else if (typeof tithiData === 'object') {
        tithi.name = tithiData.name || tithiData.tithi_name || tithiData.Name || 'N/A';
        tithi.end = getEndTimeString(tithiData);
        tithi.detail = tithiData.special || tithiData.Phase || (tithiData.paksha ? `Paksha: ${tithiData.paksha}` : '');
        if (tithiData.paksha && !tithi.name.toLowerCase().includes(tithiData.paksha.toLowerCase())) {
          tithi.name = `${tithi.name} (${tithiData.paksha} Paksha)`;
        }
      }
    }

    // Parse Nakshatra (supports array or single object/string)
    let nakshatra = { name: 'N/A', start: '', end: '', detail: '' };
    let nakData = data?.nakshatra || data?.Nakshatra;
    if (Array.isArray(nakData)) {
      nakData = nakData[0];
    }
    if (nakData) {
      if (typeof nakData === 'string') {
        nakshatra.name = nakData;
      } else if (typeof nakData === 'object') {
        nakshatra.name = nakData.name || nakData.nak_name || nakData.nakshatra_name || nakData.Name || 'N/A';
        nakshatra.end = getEndTimeString(nakData);
        
        const lordName = typeof nakData.lord === 'object' ? nakData.lord?.name : nakData.lord;
        const lordVal = nakData.ruler || lordName || nakData.Lord || '';
        nakshatra.detail = lordVal ? `Lord: ${lordVal}` : '';
      }
    }

    // Parse Yoga (supports array or single object/string)
    let yoga = { name: 'N/A', start: '', end: '', detail: '' };
    let yogaData = data?.yoga || data?.Yoga;
    if (Array.isArray(yogaData)) {
      yogaData = yogaData[0];
    }
    if (yogaData) {
      if (typeof yogaData === 'string') {
        yoga.name = yogaData;
      } else if (typeof yogaData === 'object') {
        yoga.name = yogaData.name || yogaData.yoga_name || yogaData.Name || 'N/A';
        yoga.end = getEndTimeString(yogaData);
        yoga.detail = yogaData.description || yogaData.Description || '';
      }
    }

    // Parse Karana (supports array or single object/string)
    let karana = { name: 'N/A', start: '', end: '', detail: '' };
    let karanaData = data?.karana || data?.Karana;
    if (Array.isArray(karanaData)) {
      karanaData = karanaData[0];
    }
    if (karanaData) {
      if (typeof karanaData === 'string') {
        karana.name = karanaData;
      } else if (typeof karanaData === 'object') {
        karana.name = karanaData.name || karanaData.karana_name || karanaData.Name || 'N/A';
        karana.end = getEndTimeString(karanaData);
        karana.detail = karanaData.special || '';
      }
    }

    // Parse Vara (Weekday)
    let vara = { name: 'N/A', detail: '' };
    const varaData = data?.vaara || data?.vara || data?.Vara || data?.weekday || data?.day || data?.Day;
    if (varaData) {
      if (typeof varaData === 'string') {
        vara.name = varaData;
      } else if (typeof varaData === 'object') {
        vara.name = varaData.name || varaData.Name || 'N/A';
        vara.detail = varaData.ruler || varaData.lord || varaData.Lord || '';
      }
    }

    // Parse Lunar Month
    let lunarMonth = 'N/A';
    const lunarMonthData = data?.lunar_month || data?.lunarMonth || data?.LunarMonth;
    if (lunarMonthData) {
      if (typeof lunarMonthData === 'string') {
        lunarMonth = lunarMonthData;
      } else if (typeof lunarMonthData === 'object') {
        lunarMonth = lunarMonthData.amanta || lunarMonthData.purnimanta || lunarMonthData.name || 'N/A';
      }
    }

    // Sunrise, Sunset, Moonrise, Moonset
    const sunrise = formatTime(data?.sunrise || data?.Sunrise?.StdTime || data?.Sunrise);
    const sunset = formatTime(data?.sunset || data?.Sunset?.StdTime || data?.Sunset);
    const moonrise = formatTime(data?.moonrise || data?.Moonrise);
    const moonset = formatTime(data?.moonset || data?.Moonset);

    // Auspicious and Inauspicious periods
    const auspiciousPeriods: { title: string; time: string; type: string }[] = [];
    const inauspiciousPeriods: { title: string; time: string }[] = [];

    // Helper to process common periods like Rahu Kaal, Abhijit, etc.
    const processPeriod = (title: string, periodObj: any, isInauspicious = true) => {
      if (!periodObj) return;
      let timeStr = '';
      if (typeof periodObj === 'string') {
        timeStr = formatTime(periodObj);
      } else if (typeof periodObj === 'object') {
        const start = formatTime(periodObj.start || periodObj.start_time || '');
        const end = formatTime(periodObj.end || periodObj.end_time || '');
        timeStr = start && end ? `${start} - ${end}` : (start || end || '');
      }
      if (timeStr) {
        if (isInauspicious) {
          inauspiciousPeriods.push({ title, time: timeStr });
        } else {
          auspiciousPeriods.push({ title, time: timeStr, type: 'Muhurat' });
        }
      }
    };

    processPeriod('Rahu Kaal', data?.rahukaal || data?.rahu_kaal || data?.RahuKaal || data?.rahu, true);
    processPeriod('Gulika Kaal', data?.gulika || data?.gulik_kaal || data?.gulik_kal || data?.gulik, true);
    processPeriod('Yamaganda', data?.yamaganda || data?.yamagandam || data?.yamaganda_kaal || data?.yamaganda_kal, true);
    processPeriod('Abhijit Muhurta', data?.abhijit_muhurta || data?.abhijit || data?.Abhijit, false);
    processPeriod('Durmuhurta', data?.durmuhurta || data?.durmuhurtham || data?.dur_muhurta, true);
    processPeriod('Varjyam', data?.varjyam || data?.varjya, true);
    processPeriod('Amrit Kaal', data?.amrit_kaal || data?.amrit_kal || data?.amrita_kaal, false);

    // Parse Navamsha specific list structure for auspicious periods
    const navamshaAuspicious = data?.auspicious_period || data?.auspicious_periods;
    if (Array.isArray(navamshaAuspicious)) {
      navamshaAuspicious.forEach((p: any) => {
        let timeStr = '';
        if (p.period && Array.isArray(p.period) && p.period.length > 0) {
          const firstPeriod = p.period[0];
          const start = formatTime(firstPeriod.start);
          const end = formatTime(firstPeriod.end);
          timeStr = `${start} - ${end}`;
        } else if (p.start && p.end) {
          timeStr = `${formatTime(p.start)} - ${formatTime(p.end)}`;
        }
        if (timeStr) {
          auspiciousPeriods.push({
            title: p.name || p.title || 'Auspicious Period',
            time: timeStr,
            type: p.type || 'Auspicious'
          });
        }
      });
    }

    // Parse Navamsha specific list structure for inauspicious periods
    const navamshaInauspicious = data?.inauspicious_period || data?.inauspicious_periods;
    if (Array.isArray(navamshaInauspicious)) {
      navamshaInauspicious.forEach((p: any) => {
        let timeStr = '';
        if (p.period && Array.isArray(p.period) && p.period.length > 0) {
          const firstPeriod = p.period[0];
          const start = formatTime(firstPeriod.start);
          const end = formatTime(firstPeriod.end);
          timeStr = `${start} - ${end}`;
        } else if (p.start && p.end) {
          timeStr = `${formatTime(p.start)} - ${formatTime(p.end)}`;
        }
        if (timeStr) {
          inauspiciousPeriods.push({
            title: p.name || p.title || 'Inauspicious Period',
            time: timeStr
          });
        }
      });
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
    traverse(data);

    return {
      tithi,
      nakshatra,
      yoga,
      karana,
      vara,
      lunarMonth,
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
    if (!isFocused) return;
    let isMounted = true;
    
    const loadPanchangDetails = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      setIsUsingFallback(false);
      
      try {
        const response = await getAdvancedPanchang(date, latitude, longitude);
        
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
          const mockData: NormalizedPanchang = {
            tithi: { name: 'Shukla Dashami', start: '', end: '02:45 PM', detail: 'Auspicious for actions' },
            nakshatra: { name: 'Vishakha', start: '', end: '11:30 PM', detail: 'Constellation of power' },
            yoga: { name: 'Shiva', start: '', end: '05:15 AM (Next Day)', detail: 'Auspicious' },
            karana: { name: 'Taitila', start: '', end: '02:45 PM', detail: 'Action-oriented' },
            vara: { name: 'Thursday', detail: 'Ruled by Jupiter' },
            lunarMonth: 'Aashaadha',
            sunrise: '05:48 AM',
            sunset: '06:52 PM',
            moonrise: 'N/A',
            moonset: 'N/A',
            auspiciousPeriods: [],
            inauspiciousPeriods: [],
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
  }, [location, latitude, longitude, date, isFocused]);

  // Share functionality
  const handleShare = async () => {
    if (!panchangData) return;
    try {
      const formatPeriodShareStr = (item: any) => {
        if (item.start && item.end) {
          return `(Start: ${item.start} | End: ${item.end})`;
        } else if (item.end) {
          return `(Ends at: ${item.end})`;
        }
        return '';
      };

      const shareMessage = `✨ Vedic Panchangam Almanac ✨\n` +
        `📅 Date: ${date}\n` +
        `📍 Location: ${location}\n\n` +
        `• Tithi: ${panchangData.tithi.name} ${formatPeriodShareStr(panchangData.tithi)}\n` +
        `• Nakshatra: ${panchangData.nakshatra.name} ${formatPeriodShareStr(panchangData.nakshatra)}\n` +
        `• Yoga: ${panchangData.yoga.name} ${formatPeriodShareStr(panchangData.yoga)}\n` +
        `• Karana: ${panchangData.karana.name} ${formatPeriodShareStr(panchangData.karana)}\n` +
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
    const data = rawApiResponse?.data || rawApiResponse?.Payload?.PanchangaTable || rawApiResponse?.PanchangaTable || rawApiResponse;
    return !!(data.ayanamsa || data.Ayanamsa || data.LunarMonth || data.lunar_month || data.DishaShool || data.disha_shool || data.HoraLord || data.hora_lord || data.IshtaKaala || data.ishta_kaala || data.ritu || data.season || data.samvat || data.vikram_samvat || data.saka_samvat);
  }, [rawApiResponse]);

  const astroMetrics = React.useMemo(() => {
    if (!rawApiResponse) return [];
    const data = rawApiResponse?.data || rawApiResponse?.Payload?.PanchangaTable || rawApiResponse?.PanchangaTable || rawApiResponse;
    return [
      { label: 'Ayanamsa', value: data.ayanamsa || data.Ayanamsa || data.settings?.ayanamsha },
      { label: 'Lunar Month', value: data.lunar_month || data.LunarMonth },
      { label: 'Ritu / Season', value: data.ritu || data.season },
      { label: 'Vikram Samvat', value: data.vikram_samvat || data.samvat?.vikram || data.samvat },
      { label: 'Saka Samvat', value: data.saka_samvat || data.samvat?.saka },
      { label: 'Disha Shool', value: data.disha_shool || data.DishaShool },
      { label: 'Hora Lord', value: data.hora_lord?.name || data.hora_lord || data.HoraLord?.Name || data.HoraLord },
      { label: 'Ishta Kaala', value: data.ishta_kaala || data.IshtaKaala?.DegreeMinuteSecond || data.IshtaKaala },
      { label: 'Observation Point', value: data.settings?.observation_point },
      { label: 'Node Type', value: data.settings?.node_type },
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
            {isUsingFallback ? 'Navamsha API failed - Displaying Mock Offline Data' : 'Powered by Navamsha Advanced Calculation Engine'}
          </Typography>
        </View>

        {/* Sun & Moon Times Banner */}
        <PremiumCard style={styles.sunMoonCard}>
          <View style={styles.sunMoonRow}>
            {/* Sunrise */}
            <View style={styles.sunBox}>
              <Sun color={colors.primary} size={22} />
              <Typography variant="caption" color="muted" style={{ marginTop: 4 }}>Sunrise</Typography>
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 2 }} />
              ) : (
                <Typography variant="body" weight="bold" style={{ fontSize: 13 }}>{panchangData?.sunrise}</Typography>
              )}
            </View>

            <View style={styles.verticalDivider} />

            {/* Sunset */}
            <View style={styles.sunBox}>
              <Sun color="#EA580C" size={22} />
              <Typography variant="caption" color="muted" style={{ marginTop: 4 }}>Sunset</Typography>
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 2 }} />
              ) : (
                <Typography variant="body" weight="bold" style={{ fontSize: 13 }}>{panchangData?.sunset}</Typography>
              )}
            </View>

            <View style={styles.verticalDivider} />

            {/* Moonrise */}
            <View style={styles.sunBox}>
              <Moon color={colors.secondary} size={22} />
              <Typography variant="caption" color="muted" style={{ marginTop: 4 }}>Moonrise</Typography>
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 2 }} />
              ) : (
                <Typography variant="body" weight="bold" style={{ fontSize: 13 }}>{panchangData?.moonrise}</Typography>
              )}
            </View>

            <View style={styles.verticalDivider} />

            {/* Moonset */}
            <View style={styles.sunBox}>
              <Moon color="#94A3B8" size={22} />
              <Typography variant="caption" color="muted" style={{ marginTop: 4 }}>Moonset</Typography>
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 2 }} />
              ) : (
                <Typography variant="body" weight="bold" style={{ fontSize: 13 }}>{panchangData?.moonset}</Typography>
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
