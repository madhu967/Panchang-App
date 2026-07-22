import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  ActivityIndicator, 
  Dimensions, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Typography } from '../components/Typography';
import { PremiumCard } from '../components/PremiumCard';
import { AppHeader } from '../components/AppHeader';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Heart, 
  MapPin, 
  Calendar as CalendarIcon, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  X, 
  Search, 
  ArrowLeft, 
  AlertCircle, 
  Info,
  Sliders,
  User,
  Compass
} from 'lucide-react-native';
import { searchLocationSuggestions, LocationItem } from '../services/locationService';
import { getMatchReport, MatchReportRequest } from '../services/vedAstroApi';

const { width } = Dimensions.get('window');

const AYANAMSA_OPTIONS = [
  { label: 'Raman', value: 'RAMAN' },
  { label: 'Lahiri', value: 'LAHIRI' },
  { label: 'KP', value: 'KP' },
  { label: 'Yukteshwar', value: 'YUKTESHWAR' },
  { label: 'Sayana', value: 'SAYANA' }
];

/* =========================================================================
                          CUSTOM DATE PICKER MODAL
   ========================================================================= */
const CustomDatePickerModal = ({ visible, onClose, onSelect, value }: any) => {
  const { colors } = useTheme();
  
  const [day, setDay] = useState(15);
  const [month, setMonth] = useState(6);
  const [year, setYear] = useState(1990);

  useEffect(() => {
    if (value && visible) {
      const parts = value.split('/');
      if (parts.length === 3) {
        setDay(parseInt(parts[0], 10) || 15);
        setMonth(parseInt(parts[1], 10) || 6);
        setYear(parseInt(parts[2], 10) || 1990);
      }
    }
  }, [value, visible]);

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const years = Array.from({ length: 80 }, (_, i) => 2026 - i); // 2026 down to 1947

  const handleConfirm = () => {
    const formattedDay = String(day).padStart(2, '0');
    const formattedMonth = String(month).padStart(2, '0');
    onSelect(`${formattedDay}/${formattedMonth}/${year}`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.pickerModalContent, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
          <Typography variant="subtitle" weight="bold" style={{ marginBottom: 16, textAlign: 'center' }}>
            Select Birth Date
          </Typography>

          <View style={styles.pickerColumnsRow}>
            {/* Day Column */}
            <View style={styles.pickerColumn}>
              <Typography variant="caption" color="muted" weight="bold" style={styles.pickerColHeader}>Day</Typography>
              <ScrollView style={styles.pickerScrollView} showsVerticalScrollIndicator={false}>
                {days.map((d) => {
                  const isSelected = day === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setDay(d)}
                      style={[
                        styles.pickerItem,
                        isSelected && { backgroundColor: colors.primary }
                      ]}
                    >
                      <Typography variant="body" weight={isSelected ? "bold" : "regular"} style={{ color: isSelected ? '#FFF' : colors.text }}>
                        {d}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Month Column */}
            <View style={[styles.pickerColumn, { flex: 1.5 }]}>
              <Typography variant="caption" color="muted" weight="bold" style={styles.pickerColHeader}>Month</Typography>
              <ScrollView style={styles.pickerScrollView} showsVerticalScrollIndicator={false}>
                {months.map((m, idx) => {
                  const isSelected = month === idx + 1;
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setMonth(idx + 1)}
                      style={[
                        styles.pickerItem,
                        isSelected && { backgroundColor: colors.primary }
                      ]}
                    >
                      <Typography variant="body" weight={isSelected ? "bold" : "regular"} style={{ color: isSelected ? '#FFF' : colors.text, fontSize: 13 }}>
                        {m}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Year Column */}
            <View style={styles.pickerColumn}>
              <Typography variant="caption" color="muted" weight="bold" style={styles.pickerColHeader}>Year</Typography>
              <ScrollView style={styles.pickerScrollView} showsVerticalScrollIndicator={false}>
                {years.map((y) => {
                  const isSelected = year === y;
                  return (
                    <TouchableOpacity
                      key={y}
                      onPress={() => setYear(y)}
                      style={[
                        styles.pickerItem,
                        isSelected && { backgroundColor: colors.primary }
                      ]}
                    >
                      <Typography variant="body" weight={isSelected ? "bold" : "regular"} style={{ color: isSelected ? '#FFF' : colors.text }}>
                        {y}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          <View style={styles.pickerActionRow}>
            <TouchableOpacity onPress={onClose} style={[styles.pickerCancelBtn, { borderColor: colors.border, borderWidth: 1 }]}>
              <Typography variant="body" weight="semibold">Cancel</Typography>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleConfirm} style={styles.pickerConfirmBtn}>
              <LinearGradient
                colors={['#7A1124', '#D4AF37']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pickerBtnGradient}
              >
                <Typography variant="body" weight="bold" style={{ color: '#FFF' }}>Confirm</Typography>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/* =========================================================================
                          CUSTOM TIME PICKER MODAL
   ========================================================================= */
const CustomTimePickerModal = ({ visible, onClose, onSelect, value }: any) => {
  const { colors } = useTheme();
  
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [isPm, setIsPm] = useState(false);

  useEffect(() => {
    if (value && visible) {
      const parts = value.split(':');
      if (parts.length === 2) {
        let h = parseInt(parts[0], 10) || 12;
        const m = parseInt(parts[1], 10) || 0;
        
        if (h >= 12) {
          setIsPm(true);
          if (h > 12) h -= 12;
        } else {
          setIsPm(false);
          if (h === 0) h = 12;
        }
        setHour(h);
        setMinute(m);
      }
    }
  }, [value, visible]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleConfirm = () => {
    let h24 = hour;
    if (isPm) {
      if (hour !== 12) h24 += 12;
    } else {
      if (hour === 12) h24 = 0;
    }
    
    const formattedHour = String(h24).padStart(2, '0');
    const formattedMinute = String(minute).padStart(2, '0');
    onSelect(`${formattedHour}:${formattedMinute}`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.pickerModalContent, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
          <Typography variant="subtitle" weight="bold" style={{ marginBottom: 16, textAlign: 'center' }}>
            Select Birth Time
          </Typography>

          <View style={styles.pickerColumnsRow}>
            {/* Hour Column */}
            <View style={styles.pickerColumn}>
              <Typography variant="caption" color="muted" weight="bold" style={styles.pickerColHeader}>Hour</Typography>
              <ScrollView style={styles.pickerScrollView} showsVerticalScrollIndicator={false}>
                {hours.map((h) => {
                  const isSelected = hour === h;
                  return (
                    <TouchableOpacity
                      key={h}
                      onPress={() => setHour(h)}
                      style={[
                        styles.pickerItem,
                        isSelected && { backgroundColor: colors.primary }
                      ]}
                    >
                      <Typography variant="body" weight={isSelected ? "bold" : "regular"} style={{ color: isSelected ? '#FFF' : colors.text }}>
                        {h}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Minute Column */}
            <View style={styles.pickerColumn}>
              <Typography variant="caption" color="muted" weight="bold" style={styles.pickerColHeader}>Minute</Typography>
              <ScrollView style={styles.pickerScrollView} showsVerticalScrollIndicator={false}>
                {minutes.map((m) => {
                  const isSelected = minute === m;
                  const mStr = String(m).padStart(2, '0');
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setMinute(m)}
                      style={[
                        styles.pickerItem,
                        isSelected && { backgroundColor: colors.primary }
                      ]}
                    >
                      <Typography variant="body" weight={isSelected ? "bold" : "regular"} style={{ color: isSelected ? '#FFF' : colors.text }}>
                        {mStr}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* AM/PM Column */}
            <View style={styles.pickerColumn}>
              <Typography variant="caption" color="muted" weight="bold" style={styles.pickerColHeader}>AM/PM</Typography>
              <View style={{ flex: 1, justifyContent: 'center', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setIsPm(false)}
                  style={[
                    styles.pickerItem,
                    { height: 44 },
                    !isPm && { backgroundColor: colors.primary }
                  ]}
                >
                  <Typography variant="body" weight={!isPm ? "bold" : "regular"} style={{ color: !isPm ? '#FFF' : colors.text }}>
                    AM
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsPm(true)}
                  style={[
                    styles.pickerItem,
                    { height: 44 },
                    isPm && { backgroundColor: colors.primary }
                  ]}
                >
                  <Typography variant="body" weight={isPm ? "bold" : "regular"} style={{ color: isPm ? '#FFF' : colors.text }}>
                    PM
                  </Typography>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.pickerActionRow}>
            <TouchableOpacity onPress={onClose} style={[styles.pickerCancelBtn, { borderColor: colors.border, borderWidth: 1 }]}>
              <Typography variant="body" weight="semibold">Cancel</Typography>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleConfirm} style={styles.pickerConfirmBtn}>
              <LinearGradient
                colors={['#7A1124', '#D4AF37']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pickerBtnGradient}
              >
                <Typography variant="body" weight="bold" style={{ color: '#FFF' }}>Confirm</Typography>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/* =========================================================================
                          MAIN MATCH CHECKER SCREEN
   ========================================================================= */
export const MatchCheckerScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();

  // Mode: 'input' or 'result'
  const [screenMode, setScreenMode] = useState<'input' | 'result'>('input');

  // Input states (Pre-filled with user's example values)
  const [maleName, setMaleName] = useState('Male Chart');
  const [maleDate, setMaleDate] = useState('15/06/1990');
  const [maleTime, setMaleTime] = useState('12:00');
  const [maleLocation, setMaleLocation] = useState('Bhimavaram, Andhra Pradesh, India');
  const [maleLat, setMaleLat] = useState(16.561);
  const [maleLng, setMaleLng] = useState(81.52);

  const [femaleName, setFemaleName] = useState('Female Chart');
  const [femaleDate, setFemaleDate] = useState('15/06/1990');
  const [femaleTime, setFemaleTime] = useState('12:00');
  const [femaleLocation, setFemaleLocation] = useState('Bhimavaram, Andhra Pradesh, India');
  const [femaleLat, setFemaleLat] = useState(16.561);
  const [femaleLng, setFemaleLng] = useState(81.52);

  const [ayanamsa, setAyanamsa] = useState('RAMAN');

  // Custom picker modals visibility
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'male' | 'female'>('male');
  
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<'male' | 'female'>('male');

  // Modal location search states
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationModalTarget, setLocationModalTarget] = useState<'male' | 'female'>('male');
  const [locationInput, setLocationInput] = useState('');
  const [suggestions, setSuggestions] = useState<LocationItem[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // API Call state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<any>(null);

  // Result display states
  const [expandedPredictions, setExpandedPredictions] = useState<{ [key: string]: boolean }>({});
  const [natureFilter, setNatureFilter] = useState<'All' | 'Good' | 'Neutral' | 'Bad'>('All');

  // Debounced location autocomplete search
  useEffect(() => {
    if (!locationInput || locationInput.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const results = await searchLocationSuggestions(locationInput);
        setSuggestions(results);
      } catch (err) {
        console.warn('Location lookup failed:', err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [locationInput]);

  // Open location search
  const openLocationPicker = (target: 'male' | 'female') => {
    setLocationModalTarget(target);
    setLocationInput(target === 'male' ? maleLocation : femaleLocation);
    setLocationModalVisible(true);
  };

  // Select location item
  const handleSelectLocation = (item: LocationItem) => {
    if (locationModalTarget === 'male') {
      setMaleLocation(item.name);
      setMaleLat(item.latitude);
      setMaleLng(item.longitude);
    } else {
      setFemaleLocation(item.name);
      setFemaleLat(item.latitude);
      setFemaleLng(item.longitude);
    }
    setLocationModalVisible(false);
    setSuggestions([]);
  };

  // Open picker actions
  const openDatePicker = (target: 'male' | 'female') => {
    setDatePickerTarget(target);
    setDatePickerVisible(true);
  };

  const openTimePicker = (target: 'male' | 'female') => {
    setTimePickerTarget(target);
    setTimePickerVisible(true);
  };

  // Validate inputs and call API
  const handleCalculateMatch = async () => {
    setErrorMsg(null);
    setIsLoading(true);

    const maleStdTime = `${maleTime} ${maleDate} +05:30`;
    const femaleStdTime = `${femaleTime} ${femaleDate} +05:30`;

    const requestPayload: MatchReportRequest = {
      MaleBirthTime: {
        StdTime: maleStdTime,
        Location: {
          Name: maleLocation,
          Latitude: maleLat,
          Longitude: maleLng
        }
      },
      FemaleBirthTime: {
        StdTime: femaleStdTime,
        Location: {
          Name: femaleLocation,
          Latitude: femaleLat,
          Longitude: femaleLng
        }
      },
      Ayanamsa: ayanamsa
    };

    try {
      const response = await getMatchReport(requestPayload);
      if (response?.Status === 'Pass' || response?.Payload?.MatchReport) {
        setMatchData(response.Payload?.MatchReport || response.MatchReport);
        setScreenMode('result');
      } else {
        setErrorMsg('Failed to fetch compatibility report. Please check API status.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'API request failed. Please check network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle prediction accordion item
  const togglePrediction = (name: string) => {
    setExpandedPredictions(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  // Filtered prediction list
  const filteredPredictions = useMemo(() => {
    if (!matchData?.PredictionList) return [];
    
    return matchData.PredictionList.filter((item: any) => {
      if (!item.Name || item.Name === 'Empty' || item.Nature === 'Empty') return false;
      
      if (natureFilter === 'All') return true;
      return item.Nature === natureFilter;
    });
  }, [matchData, natureFilter]);

  // Color mapping based on compatibility nature
  const getNatureColor = (nature: string) => {
    switch (nature?.toLowerCase()) {
      case 'good': return '#10B981'; // green
      case 'bad': return '#EF4444'; // red
      case 'neutral': return '#F59E0B'; // amber
      default: return colors.textSecondary;
    }
  };

  const getNatureBgColor = (nature: string) => {
    switch (nature?.toLowerCase()) {
      case 'good': return isDark ? 'rgba(16, 185, 129, 0.08)' : '#EAFCEF';
      case 'bad': return isDark ? 'rgba(239, 68, 68, 0.08)' : '#FDECEB';
      case 'neutral': return isDark ? 'rgba(245, 158, 11, 0.08)' : '#FEF8EA';
      default: return isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9';
    }
  };

  // Parse Ashtakoota details from embeddings and predictionList
  const ashtakootaTable = useMemo(() => {
    if (!matchData) return [];
    
    const embeddings = matchData.Embeddings || [];
    
    const kootaSpecs = [
      { name: 'Varna', max: 1, embeddingIndex: 6, queries: ['varna'], desc: 'Work / Natural Refinement' },
      { name: 'Vashya', max: 2, embeddingIndex: 7, queries: ['vasya kuta', 'vashya'], desc: 'Attraction / Magnetism' },
      { name: 'Swati / Dina (Tara)', max: 3, embeddingIndex: 5, queries: ['dina kuta', 'tara', 'dina'], desc: 'Comfort - Prosperity - Health' },
      { name: 'Yoni', max: 4, embeddingIndex: 3, queries: ['yoni kuta', 'yoni'], desc: 'Intimate Physical Alignment' },
      { name: 'Maitri', max: 5, embeddingIndex: 4, queries: ['graha maitram', 'maitri'], desc: 'Friendship & Planetary Lords' },
      { name: 'Gan', max: 6, embeddingIndex: 1, queries: ['guna kuta', 'gana', 'guna'], desc: 'Temperament compatibility' },
      { name: 'Bhakut', max: 7, embeddingIndex: 2, queries: ['rasi kuta', 'bhakut'], desc: 'Constructive Ability / Rasi' },
      { name: 'Nadi', max: 8, embeddingIndex: 0, queries: ['nadi kuta', 'nadi'], desc: 'Progeny / Biological Energy' },
    ];
    
    const findPrediction = (queries: string[]) => {
      if (!matchData.PredictionList) return null;
      return matchData.PredictionList.find((p: any) => 
        queries.some(q => p.Name?.toLowerCase().includes(q))
      );
    };

    const cleanAttrValue = (val: string) => {
      if (!val) return '-';
      return val.split(' ')[0].replace('Human', '').trim();
    };

    return kootaSpecs.map(k => {
      const pred = findPrediction(k.queries);
      const score = typeof embeddings[k.embeddingIndex] === 'number' 
        ? embeddings[k.embeddingIndex] 
        : (pred?.Score || 0);

      return {
        name: k.name,
        desc: k.desc,
        male: pred ? cleanAttrValue(pred.MaleInfo) : '-',
        female: pred ? cleanAttrValue(pred.FemaleInfo) : '-',
        max: k.max,
        received: score
      };
    });
  }, [matchData]);

  const ashtakootaTotal = useMemo(() => {
    return ashtakootaTable.reduce((sum, item) => sum + item.received, 0);
  }, [ashtakootaTable]);

  const matchVerdict = useMemo(() => {
    if (ashtakootaTotal >= 28) {
      return { status: 'EXCELLENT', color: '#10B981', summary: 'Excellent compatibility, highly auspicious match!' };
    }
    if (ashtakootaTotal >= 18) {
      return { status: 'PASS / GOOD', color: '#F59E0B', summary: 'Favourable compatibility, recommended to proceed.' };
    }
    return { status: 'FAIL / POOR', color: '#EF4444', summary: 'Critical mismatches in key areas (e.g. Nadi or Bhakut).' };
  }, [ashtakootaTotal]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader 
        title="Kundali Match Checker" 
        subtitle="Vedic Horoscope Matching (Guna Milan)"
        onMenuPress={() => navigation?.navigate('Menu')}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {screenMode === 'input' ? (
            /* =========================================================================
                                     INPUT VIEW: BIRTH FORMS
               ========================================================================= */
            <View>
              {errorMsg && (
                <PremiumCard style={styles.errorCard}>
                  <AlertCircle color="#EF4444" size={20} />
                  <Typography variant="body" weight="medium" style={{ color: '#EF4444', marginLeft: 10, flex: 1 }}>
                    {errorMsg}
                  </Typography>
                </PremiumCard>
              )}

              {/* MALE CARD */}
              <PremiumCard style={styles.personCard}>
                <View style={styles.personHeader}>
                  <View style={[styles.genderBadge, { backgroundColor: isDark ? 'rgba(3,105,161,0.2)' : '#E0F2FE' }]}>
                    <Typography variant="caption" weight="bold" style={{ color: '#0369A1' }}>MALE</Typography>
                  </View>
                  <Typography variant="subtitle" weight="bold" style={{ marginLeft: 12 }}>Male Birth Details</Typography>
                </View>

                {/* Name Input */}
                <View style={styles.fieldContainer}>
                  <Typography variant="caption" color="muted" weight="semibold" style={styles.fieldLabel}>Name (Optional)</Typography>
                  <TextInput
                    value={maleName}
                    onChangeText={setMaleName}
                    placeholder="Enter name"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                  />
                </View>

                {/* Date & Time Row */}
                <View style={styles.row}>
                  <View style={[styles.fieldContainer, { flex: 1, marginRight: 10 }]}>
                    <Typography variant="caption" color="muted" weight="semibold" style={styles.fieldLabel}>Birth Date</Typography>
                    <TouchableOpacity 
                      style={[styles.inputIconWrapper, { borderColor: colors.border }]}
                      onPress={() => openDatePicker('male')}
                      activeOpacity={0.7}
                    >
                      <CalendarIcon color={colors.primary} size={18} style={{ marginRight: 8 }} />
                      <Typography variant="body" style={{ color: colors.text, flex: 1 }}>
                        {maleDate || 'Select Date'}
                      </Typography>
                      <ChevronDown color={colors.textSecondary} size={14} />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.fieldContainer, { flex: 1 }]}>
                    <Typography variant="caption" color="muted" weight="semibold" style={styles.fieldLabel}>Birth Time</Typography>
                    <TouchableOpacity 
                      style={[styles.inputIconWrapper, { borderColor: colors.border }]}
                      onPress={() => openTimePicker('male')}
                      activeOpacity={0.7}
                    >
                      <Clock color={colors.secondary} size={18} style={{ marginRight: 8 }} />
                      <Typography variant="body" style={{ color: colors.text, flex: 1 }}>
                        {maleTime || 'Select Time'}
                      </Typography>
                      <ChevronDown color={colors.textSecondary} size={14} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Location Picker */}
                <View style={styles.fieldContainer}>
                  <Typography variant="caption" color="muted" weight="semibold" style={styles.fieldLabel}>Birth Place</Typography>
                  <TouchableOpacity 
                    style={[styles.inputIconWrapper, { borderColor: colors.border }]}
                    onPress={() => openLocationPicker('male')}
                    activeOpacity={0.7}
                  >
                    <MapPin color={colors.primary} size={18} style={{ marginRight: 8 }} />
                    <Typography variant="body" style={{ flex: 1, color: maleLocation ? colors.text : colors.textSecondary }} numberOfLines={1}>
                      {maleLocation || 'Select location'}
                    </Typography>
                    <ChevronRight color={colors.textSecondary} size={18} />
                  </TouchableOpacity>
                </View>
              </PremiumCard>

              {/* FEMALE CARD */}
              <PremiumCard style={styles.personCard}>
                <View style={styles.personHeader}>
                  <View style={[styles.genderBadge, { backgroundColor: isDark ? 'rgba(190,24,93,0.2)' : '#FCE7F3' }]}>
                    <Typography variant="caption" weight="bold" style={{ color: '#BE185D' }}>FEMALE</Typography>
                  </View>
                  <Typography variant="subtitle" weight="bold" style={{ marginLeft: 12 }}>Female Birth Details</Typography>
                </View>

                {/* Name Input */}
                <View style={styles.fieldContainer}>
                  <Typography variant="caption" color="muted" weight="semibold" style={styles.fieldLabel}>Name (Optional)</Typography>
                  <TextInput
                    value={femaleName}
                    onChangeText={setFemaleName}
                    placeholder="Enter name"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                  />
                </View>

                {/* Date & Time Row */}
                <View style={styles.row}>
                  <View style={[styles.fieldContainer, { flex: 1, marginRight: 10 }]}>
                    <Typography variant="caption" color="muted" weight="semibold" style={styles.fieldLabel}>Birth Date</Typography>
                    <TouchableOpacity 
                      style={[styles.inputIconWrapper, { borderColor: colors.border }]}
                      onPress={() => openDatePicker('female')}
                      activeOpacity={0.7}
                    >
                      <CalendarIcon color={colors.primary} size={18} style={{ marginRight: 8 }} />
                      <Typography variant="body" style={{ color: colors.text, flex: 1 }}>
                        {femaleDate || 'Select Date'}
                      </Typography>
                      <ChevronDown color={colors.textSecondary} size={14} />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.fieldContainer, { flex: 1 }]}>
                    <Typography variant="caption" color="muted" weight="semibold" style={styles.fieldLabel}>Birth Time</Typography>
                    <TouchableOpacity 
                      style={[styles.inputIconWrapper, { borderColor: colors.border }]}
                      onPress={() => openTimePicker('female')}
                      activeOpacity={0.7}
                    >
                      <Clock color={colors.secondary} size={18} style={{ marginRight: 8 }} />
                      <Typography variant="body" style={{ color: colors.text, flex: 1 }}>
                        {femaleTime || 'Select Time'}
                      </Typography>
                      <ChevronDown color={colors.textSecondary} size={14} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Location Picker */}
                <View style={styles.fieldContainer}>
                  <Typography variant="caption" color="muted" weight="semibold" style={styles.fieldLabel}>Birth Place</Typography>
                  <TouchableOpacity 
                    style={[styles.inputIconWrapper, { borderColor: colors.border }]}
                    onPress={() => openLocationPicker('female')}
                    activeOpacity={0.7}
                  >
                    <MapPin color={colors.primary} size={18} style={{ marginRight: 8 }} />
                    <Typography variant="body" style={{ flex: 1, color: femaleLocation ? colors.text : colors.textSecondary }} numberOfLines={1}>
                      {femaleLocation || 'Select location'}
                    </Typography>
                    <ChevronRight color={colors.textSecondary} size={18} />
                  </TouchableOpacity>
                </View>
              </PremiumCard>

              {/* AYANAMSA SELECTOR */}
              <PremiumCard style={styles.ayanamsaCard}>
                <View style={styles.ayanamsaHeader}>
                  <Sliders color={colors.primary} size={18} />
                  <Typography variant="body" weight="bold" style={{ marginLeft: 10 }}>Astrological Settings (Ayanamsa)</Typography>
                </View>
                
                <View style={styles.ayanamsaGrid}>
                  {AYANAMSA_OPTIONS.map((opt) => {
                    const isSelected = ayanamsa === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setAyanamsa(opt.value)}
                        style={[
                          styles.ayanamsaChip,
                          {
                            borderColor: isSelected ? colors.primary : colors.border,
                            backgroundColor: isSelected ? colors.primary + '15' : 'transparent'
                          }
                        ]}
                      >
                        <Typography 
                          variant="caption" 
                          weight="semibold" 
                          style={{ color: isSelected ? colors.primary : colors.textSecondary }}
                        >
                          {opt.label}
                        </Typography>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </PremiumCard>

              {/* CALCULATE BUTTON */}
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Typography variant="body" weight="bold" style={{ marginTop: 14 }}>
                    Analyzing Compatibility...
                  </Typography>
                  <Typography variant="caption" color="muted" style={{ marginTop: 4, textAlign: 'center' }}>
                    Fetching Guna Milan, Dosha Balances & planetary indicators.
                  </Typography>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleCalculateMatch}
                  style={styles.calculateBtn}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#7A1124', '#D4AF37']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.btnGradient}
                  >
                    <Heart color="#FFF" size={20} style={{ marginRight: 8 }} />
                    <Typography variant="body" weight="bold" style={{ color: '#FFF' }}>
                      Calculate Compatibility
                    </Typography>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* =========================================================================
                                     RESULT VIEW: REPORT SCREEN
               ========================================================================= */
            <View>
              {/* BACK BUTTON TO EDIT */}
              <TouchableOpacity 
                onPress={() => setScreenMode('input')}
                style={styles.backButton}
              >
                <ArrowLeft color={colors.primary} size={18} />
                <Typography variant="body" weight="semibold" style={{ color: colors.primary, marginLeft: 8 }}>
                  Change Birth Details
                </Typography>
              </TouchableOpacity>

              {/* SCORE CARD */}
              <PremiumCard style={styles.scoreCard}>
                <View style={styles.scoreCardRow}>
                  {/* Circular Score display */}
                  <View style={[styles.scoreRing, { borderColor: colors.primary }]}>
                    <LinearGradient
                      colors={['#7A1124', '#D4AF37']}
                      style={styles.scoreRingInner}
                    >
                      <Typography variant="display" style={{ color: '#FFF', fontSize: 32, lineHeight: 32 }}>
                        {ashtakootaTotal}
                      </Typography>
                      <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>
                        OUT OF 36
                      </Typography>
                    </LinearGradient>
                  </View>

                  <View style={styles.scoreDetailColumn}>
                    {/* Status Badge */}
                    <View 
                      style={[
                        styles.statusBadge, 
                        { backgroundColor: matchVerdict.color }
                      ]}
                    >
                      <Typography variant="caption" weight="bold" style={{ color: '#FFF' }}>
                        {matchVerdict.status}
                      </Typography>
                    </View>

                    <Typography variant="subtitle" weight="bold" style={{ marginTop: 8 }}>
                      Guna Milan Score
                    </Typography>
                    <Typography variant="caption" color="muted" style={{ marginTop: 2 }}>
                      {matchVerdict.summary}
                    </Typography>
                  </View>
                </View>

                {/* Male vs Female quick bio info */}
                <View style={[styles.bioDivider, { backgroundColor: colors.border }]} />
                <View style={styles.bioRow}>
                  <View style={{ flex: 1 }}>
                    <Typography variant="caption" weight="bold" color="primary">MALE CHART</Typography>
                    <Typography variant="body" weight="semibold" numberOfLines={1}>{maleName}</Typography>
                    <Typography variant="caption" color="muted" numberOfLines={1}>{maleLocation}</Typography>
                  </View>
                  <View style={styles.bioDividerVertical} />
                  <View style={{ flex: 1, paddingLeft: 16 }}>
                    <Typography variant="caption" weight="bold" color="secondary">FEMALE CHART</Typography>
                    <Typography variant="body" weight="semibold" numberOfLines={1}>{femaleName}</Typography>
                    <Typography variant="caption" color="muted" numberOfLines={1}>{femaleLocation}</Typography>
                  </View>
                </View>
              </PremiumCard>

              {/* TRADITIONAL ASHTAKOOTA TABLE */}
              <PremiumCard style={styles.ashtakootaCard}>
                <View style={styles.ashtakootaHeader}>
                  <Sparkles color={colors.primary} size={18} />
                  <Typography variant="body" weight="bold" style={{ marginLeft: 10 }}>
                    Traditional Ashta Kuta Guna Milan
                  </Typography>
                </View>

                {/* Table Header */}
                <View style={[styles.tableRow, styles.tableHeaderRow, { borderBottomColor: colors.border }]}>
                  <View style={{ flex: 1.5 }}><Typography variant="caption" weight="bold" color="muted">Koota Attribute</Typography></View>
                  <View style={{ flex: 1, alignItems: 'center' }}><Typography variant="caption" weight="bold" color="muted">Male</Typography></View>
                  <View style={{ flex: 1, alignItems: 'center' }}><Typography variant="caption" weight="bold" color="muted">Female</Typography></View>
                  <View style={{ flex: 1.2, alignItems: 'flex-end' }}><Typography variant="caption" weight="bold" color="muted">Points</Typography></View>
                </View>

                {/* Table Rows */}
                {ashtakootaTable.map((item, idx) => (
                  <View key={idx} style={[styles.tableRow, { borderBottomColor: colors.border + '30' }]}>
                    <View style={{ flex: 1.5 }}>
                      <Typography variant="body" weight="semibold" style={{ fontSize: 13 }}>{item.name}</Typography>
                      <Typography variant="caption" color="muted" style={{ fontSize: 10, marginTop: 1 }}>{item.desc}</Typography>
                    </View>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Typography variant="caption" weight="semibold" style={{ color: colors.text }}>{item.male}</Typography>
                    </View>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Typography variant="caption" weight="semibold" style={{ color: colors.text }}>{item.female}</Typography>
                    </View>
                    <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                      <Typography variant="body" weight="bold" color={item.received > 0 ? "primary" : "muted"} style={{ fontSize: 13 }}>
                        {item.received} / {item.max}
                      </Typography>
                    </View>
                  </View>
                ))}

                {/* Table Footer */}
                <View style={[styles.tableTotalRow, { backgroundColor: colors.primary + '0a', borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Typography variant="body" weight="bold">Total Milan Score</Typography>
                    <Typography variant="caption" color="muted" style={{ fontSize: 10 }}>
                      Minimum Required: 18 / 36
                    </Typography>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Typography variant="body" weight="bold" color={ashtakootaTotal >= 18 ? "primary" : "secondary"}>
                      {ashtakootaTotal} / 36 Points
                    </Typography>
                    <View style={[
                      styles.minPassBadge, 
                      { backgroundColor: ashtakootaTotal >= 18 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }
                    ]}>
                      <Typography variant="caption" weight="bold" style={{ 
                        color: ashtakootaTotal >= 18 ? '#10B981' : '#EF4444', 
                        fontSize: 9,
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                      }}>
                        {ashtakootaTotal >= 18 ? 'FAVOURABLE MATCH' : 'UNFAVOURABLE MATCH'}
                      </Typography>
                    </View>
                  </View>
                </View>

                {/* Conclusion Text */}
                <View style={styles.conclusionBox}>
                  <Typography variant="caption" color="muted" weight="bold">CONCLUSION REPORT</Typography>
                  <Typography variant="body" style={{ marginTop: 4, fontSize: 13, lineHeight: 18 }}>
                    {ashtakootaTotal >= 18 
                      ? `The match has scored ${ashtakootaTotal} points out of 36 points. This is a favourable Ashtakoota match exceeding the traditional minimum score of 18 points. Relationship compatibility and mutual understanding are recommended to proceed.` 
                      : `The match has scored ${ashtakootaTotal} points out of 36 points. This is below the traditional recommended minimum score of 18 points. It is advised to review specific Nadi or Bhakut dosha cancellations.`
                    }
                  </Typography>
                </View>
              </PremiumCard>

              {/* FILTER CHIPS */}
              <View style={styles.filterSection}>
                <Typography variant="subtitle" weight="bold" style={{ marginBottom: 12 }}>
                  Compatibility Parameters
                </Typography>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
                  {(['All', 'Good', 'Neutral', 'Bad'] as const).map((filter) => {
                    const isSelected = natureFilter === filter;
                    return (
                      <TouchableOpacity
                        key={filter}
                        onPress={() => setNatureFilter(filter)}
                        style={[
                          styles.filterChip,
                          {
                            borderColor: isSelected ? colors.primary : colors.border,
                            backgroundColor: isSelected ? colors.primary + '18' : 'transparent'
                          }
                        ]}
                      >
                        <Typography 
                          variant="caption" 
                          weight="semibold"
                          style={{ color: isSelected ? colors.primary : colors.textSecondary }}
                        >
                          {filter}
                        </Typography>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* DETAILED CARDS ACCORDION */}
              {filteredPredictions.length === 0 ? (
                <PremiumCard style={styles.noResultsCard}>
                  <Info color={colors.textSecondary} size={24} />
                  <Typography variant="body" color="muted" style={{ marginTop: 10, textAlign: 'center' }}>
                    No compatibility parameters found matching filter "{natureFilter}".
                  </Typography>
                </PremiumCard>
              ) : (
                filteredPredictions.map((item: any, idx: number) => {
                  const isExpanded = !!expandedPredictions[item.Name];
                  const borderLeftColor = getNatureColor(item.Nature);
                  const statusBg = getNatureBgColor(item.Nature);
                  const statusText = item.Nature || 'Neutral';

                  return (
                    <PremiumCard 
                      key={idx} 
                      style={[
                        styles.predictionCard, 
                        { 
                          borderLeftWidth: 4, 
                          borderLeftColor,
                          backgroundColor: statusBg
                        }
                      ]}
                      noPadding
                    >
                      <TouchableOpacity
                        onPress={() => togglePrediction(item.Name)}
                        activeOpacity={0.7}
                        style={styles.predictionTrigger}
                      >
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <View style={styles.predictionTitleRow}>
                            <Typography variant="body" weight="bold">{item.Name}</Typography>
                            
                            {/* Score info badge if available */}
                            {typeof item.Score === 'number' && (
                              <View style={[styles.scorePointBadge, { backgroundColor: colors.primary + '15' }]}>
                                <Typography variant="caption" weight="bold" style={{ color: colors.primary, fontSize: 10 }}>
                                  {item.Score} Pts
                                </Typography>
                              </View>
                            )}
                          </View>
                          
                          <Typography variant="caption" color="muted" style={{ marginTop: 4 }} numberOfLines={1}>
                            {item.Description}
                          </Typography>
                        </View>

                        <View style={styles.predictionRightRow}>
                          <View style={[styles.naturePill, { backgroundColor: colors.surface }]}>
                            <Typography variant="caption" weight="bold" style={{ color: borderLeftColor, fontSize: 10 }}>
                              {statusText}
                            </Typography>
                          </View>
                          {isExpanded ? (
                            <ChevronDown color={colors.textSecondary} size={18} />
                          ) : (
                            <ChevronRight color={colors.textSecondary} size={18} />
                          )}
                        </View>
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={[styles.predictionContent, { borderTopWidth: 1, borderTopColor: colors.border + '30', backgroundColor: colors.surface }]}>
                          
                          {/* Side-by-side or stacked Chart info comparison */}
                          <View style={styles.genderComparisonRow}>
                            {item.MaleInfo ? (
                              <View style={[styles.genderInfoBox, { borderColor: colors.border + '30', backgroundColor: colors.background + '40' }]}>
                                <View style={styles.genderBoxHeader}>
                                  <User color="#0369A1" size={14} />
                                  <Typography variant="caption" weight="bold" style={{ color: '#0369A1', marginLeft: 6 }}>Male Chart</Typography>
                                </View>
                                <Typography variant="caption" style={{ marginTop: 4, lineHeight: 16 }}>
                                  {item.MaleInfo}
                                </Typography>
                              </View>
                            ) : null}

                            {item.FemaleInfo ? (
                              <View style={[styles.genderInfoBox, { borderColor: colors.border + '30', backgroundColor: colors.background + '40' }]}>
                                <View style={styles.genderBoxHeader}>
                                  <User color="#BE185D" size={14} />
                                  <Typography variant="caption" weight="bold" style={{ color: '#BE185D', marginLeft: 6 }}>Female Chart</Typography>
                                </View>
                                <Typography variant="caption" style={{ marginTop: 4, lineHeight: 16 }}>
                                  {item.FemaleInfo}
                                </Typography>
                              </View>
                            ) : null}
                          </View>

                          {/* Verdict Box */}
                          {item.Info ? (
                            <View style={[styles.verdictDetailBox, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '20' }]}>
                              <View style={styles.verdictHeaderRow}>
                                <Sparkles color={colors.primary} size={14} />
                                <Typography variant="caption" weight="bold" color="primary" style={{ marginLeft: 6 }}>Vedic Verdict</Typography>
                              </View>
                              <Typography variant="body" style={{ marginTop: 4, fontSize: 13, lineHeight: 18 }}>{item.Info}</Typography>
                            </View>
                          ) : null}
                        </View>
                      )}
                    </PremiumCard>
                  );
                })
              )}
            </View>
          )}

          <View style={{ height: 110 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* DATE PICKER MODAL */}
      <CustomDatePickerModal 
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        value={datePickerTarget === 'male' ? maleDate : femaleDate}
        onSelect={(dateStr: string) => {
          if (datePickerTarget === 'male') {
            setMaleDate(dateStr);
          } else {
            setFemaleDate(dateStr);
          }
        }}
      />

      {/* TIME PICKER MODAL */}
      <CustomTimePickerModal 
        visible={timePickerVisible}
        onClose={() => setTimePickerVisible(false)}
        value={timePickerTarget === 'male' ? maleTime : femaleTime}
        onSelect={(timeStr: string) => {
          if (timePickerTarget === 'male') {
            setMaleTime(timeStr);
          } else {
            setFemaleTime(timeStr);
          }
        }}
      />

      {/* LOCATION PICKER SEARCH MODAL */}
      <Modal visible={locationModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.modalHeader}>
              <Typography variant="subtitle" weight="bold">
                {locationModalTarget === 'male' ? "Male Birth Place" : "Female Birth Place"}
              </Typography>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchBox, { backgroundColor: isDark ? '#1E1E26' : '#F1F5F9', borderColor: colors.border, borderWidth: 1 }]}>
              <Search color={colors.textSecondary} size={18} />
              <TextInput
                value={locationInput}
                onChangeText={setLocationInput}
                placeholder="Search city (e.g. Bhimavaram, Delhi)..."
                placeholderTextColor={colors.textSecondary}
                style={[styles.modalInput, { color: colors.text }]}
                autoFocus
              />
              {isSearchingLocation && (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
              )}
              {locationInput.length > 0 && !isSearchingLocation && (
                <TouchableOpacity onPress={() => { setLocationInput(''); setSuggestions([]); }}>
                  <X color={colors.textSecondary} size={16} />
                </TouchableOpacity>
              )}
            </View>

            <Typography variant="caption" color="muted" weight="bold" style={{ marginTop: 16, marginBottom: 8 }}>
              {suggestions.length > 0 ? 'Search Results' : 'Type to search...'}
            </Typography>

            <ScrollView style={{ maxHeight: 280 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {suggestions.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.quickLocItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleSelectLocation(item)}
                >
                  <MapPin color={colors.primary} size={18} style={{ marginTop: 2 }} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Typography variant="body" weight="bold">{item.name}</Typography>
                    {item.fullName ? (
                      <Typography variant="caption" color="muted" numberOfLines={1}>
                        {item.fullName}
                      </Typography>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    marginBottom: 20,
    padding: 16,
  },
  personCard: {
    marginBottom: 20,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
    paddingBottom: 10,
  },
  genderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldContainer: {
    marginBottom: 14,
  },
  fieldLabel: {
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  inputIconWrapper: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  ayanamsaCard: {
    marginBottom: 24,
  },
  ayanamsaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  ayanamsaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ayanamsaChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  calculateBtn: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  btnGradient: {
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 18,
    paddingVertical: 4,
  },
  scoreCard: {
    marginBottom: 24,
  },
  scoreCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2.5,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreRingInner: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreDetailColumn: {
    flex: 1,
    marginLeft: 20,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bioDivider: {
    height: 1,
    marginVertical: 16,
  },
  bioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bioDividerVertical: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(150,150,150,0.2)',
  },
  filterSection: {
    marginBottom: 18,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    marginRight: 8,
  },
  predictionCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.15)',
  },
  predictionTrigger: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  predictionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scorePointBadge: {
    marginLeft: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  predictionRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  naturePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.15)',
  },
  predictionContent: {
    padding: 16,
    gap: 14,
  },
  noResultsCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '80%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 23,
  },
  modalInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  quickLocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  ashtakootaCard: {
    marginBottom: 24,
    padding: 16,
  },
  ashtakootaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
    paddingBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tableHeaderRow: {
    paddingBottom: 6,
    borderBottomWidth: 1.5,
    marginBottom: 4,
  },
  tableTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 14,
  },
  minPassBadge: {
    alignSelf: 'flex-end',
    borderRadius: 6,
    marginTop: 4,
  },
  conclusionBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(150,150,150,0.05)',
    borderRadius: 16,
  },

  /* Scroll Pickers Styling */
  pickerModalContent: {
    borderRadius: 28,
    padding: 24,
    width: width - 40,
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  pickerColumnsRow: {
    flexDirection: 'row',
    height: 200,
    marginBottom: 20,
    gap: 8,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'stretch',
    borderRadius: 16,
    backgroundColor: 'rgba(150,150,150,0.05)',
    padding: 6,
  },
  pickerColHeader: {
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  pickerScrollView: {
    flex: 1,
  },
  pickerItem: {
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  pickerActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  pickerCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerConfirmBtn: {
    flex: 1.3,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
  },
  pickerBtnGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Parameter Comparison Styling */
  genderComparisonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  genderInfoBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  genderBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  verdictDetailBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
  },
  verdictHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  }
});
