import axios from './axios';

const VEDASTRO_BASE_URL = 'https://api.vedastro.org/api/Calculate';

export interface VedAstroLocation {
  Name: string;
  Latitude: number;
  Longitude: number;
}

export interface VedAstroTime {
  StdTime: string;
  Location: VedAstroLocation;
}

export interface VedAstroPayload {
  Time: VedAstroTime;
  Ayanamsa: string;
}

/**
 * Format date or date string to "HH:mm DD/MM/YYYY +05:30"
 */
export const formatStdTime = (dateInput?: Date | string): string => {
  if (typeof dateInput === 'string' && dateInput.includes('/')) {
    return dateInput;
  }

  let d: Date;
  if (!dateInput) {
    d = new Date();
  } else if (dateInput instanceof Date) {
    d = dateInput;
  } else {
    const parsed = new Date(dateInput);
    d = isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  const hours = String(d.getHours() || 6).padStart(2, '0');
  const minutes = String(d.getMinutes() || 0).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${hours}:${minutes} ${day}/${month}/${year} +05:30`;
};

/**
 * Reusable service function to calculate Sunrise Time from VedAstro API
 */
export const getSunriseTime = async (
  date: Date | string,
  latitude: number,
  longitude: number,
  locationName: string
): Promise<string> => {
  const stdTimeStr = formatStdTime(date);

  const payload: VedAstroPayload = {
    Time: {
      StdTime: stdTimeStr,
      Location: {
        Name: locationName || 'New Delhi, India',
        Latitude: latitude || 28.6139,
        Longitude: longitude || 77.2090,
      },
    },
    Ayanamsa: 'RAMAN',
  };

  try {
    const response = await axios.post(`${VEDASTRO_BASE_URL}/SunriseTime`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    const data = response.data;

    // Handle nested response fields dynamically
    const resultTime =
      data?.Payload?.SunriseTime?.StdTime ||
      data?.SunriseTime?.StdTime ||
      data?.Payload?.StdTime ||
      (typeof data === 'string' ? data : null);

    if (resultTime) {
      return resultTime;
    }

    throw new Error('SunriseTime.StdTime not found in API response');
  } catch (error: any) {
    console.error('VedAstro getSunriseTime Error:', error?.response?.data || error.message || error);
    throw error;
  }
};

/**
 * Reusable service function to calculate Sunset Time from VedAstro API
 */
export const getSunsetTime = async (
  date: Date | string,
  latitude: number,
  longitude: number,
  locationName: string
): Promise<string> => {
  const stdTimeStr = formatStdTime(date);

  const payload: VedAstroPayload = {
    Time: {
      StdTime: stdTimeStr,
      Location: {
        Name: locationName || 'New Delhi, India',
        Latitude: latitude || 28.6139,
        Longitude: longitude || 77.2090,
      },
    },
    Ayanamsa: 'RAMAN',
  };

  try {
    const response = await axios.post(`${VEDASTRO_BASE_URL}/SunsetTime`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    const data = response.data;

    // Handle nested response fields dynamically
    const resultTime =
      data?.Payload?.SunsetTime?.StdTime ||
      data?.SunsetTime?.StdTime ||
      data?.Payload?.StdTime ||
      (typeof data === 'string' ? data : null);

    if (resultTime) {
      return resultTime;
    }

    throw new Error('SunsetTime.StdTime not found in API response');
  } catch (error: any) {
    console.error('VedAstro getSunsetTime Error:', error?.response?.data || error.message || error);
    throw error;
  }
};

export interface MatchReportRequest {
  MaleBirthTime: VedAstroTime;
  FemaleBirthTime: VedAstroTime;
  Ayanamsa: string;
}

/**
 * Call the VedAstro MatchReport API
 */
export const getMatchReport = async (payload: MatchReportRequest): Promise<any> => {
  try {
    const response = await axios.post(`${VEDASTRO_BASE_URL}/MatchReport`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    });
    return response.data;
  } catch (error: any) {
    console.error('VedAstro getMatchReport Error:', error?.response?.data || error.message || error);
    throw error;
  }
};

export interface HoroscopePredictionsRequest {
  BirthTime: VedAstroTime;
  FilterTags: string;
  SortByWeight: string;
  Ayanamsa: string;
}

/**
 * Call the VedAstro HoroscopePredictions API
 */
export const getHoroscopePredictions = async (payload: HoroscopePredictionsRequest): Promise<any> => {
  try {
    const response = await axios.post(`${VEDASTRO_BASE_URL}/HoroscopePredictions`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 25000,
    });
    return response.data;
  } catch (error: any) {
    console.error('VedAstro getHoroscopePredictions Error:', error?.response?.data || error.message || error);
    throw error;
  }
};

/**
 * Call the VedAstro PanchangaTable API
 */
const formatDateToDDMMYYYY = (dateStr: any): string => {
  if (!dateStr) {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${d.getFullYear()}`;
  }

  if (dateStr instanceof Date) {
    const day = String(dateStr.getDate()).padStart(2, '0');
    const month = String(dateStr.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${dateStr.getFullYear()}`;
  }

  const cleanStr = String(dateStr).trim();

  // Case 1: Already has DD-MM-YYYY format
  if (/^\d{2}-\d{2}-\d{4}$/.test(cleanStr)) {
    return cleanStr;
  }

  // Case 2: Slash separated DD/MM/YYYY (common in India)
  const slashParts = cleanStr.split('/');
  if (slashParts.length === 3) {
    let day = slashParts[0].trim().padStart(2, '0');
    let month = slashParts[1].trim().padStart(2, '0');
    let year = slashParts[2].trim();
    // Validate values to avoid NaN
    if (!isNaN(Number(day)) && !isNaN(Number(month)) && Number(month) <= 12) {
      return `${day}-${month}-${year}`;
    }
  }

  // Case 3: Space separated like "20 Jul 2026"
  const spaceParts = cleanStr.split(/\s+/);
  if (spaceParts.length === 3) {
    let day = spaceParts[0].replace(/[^0-9]/g, '').trim().padStart(2, '0');
    let monthStr = spaceParts[1].toLowerCase();
    let year = spaceParts[2].trim();

    const monthsMap: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
      january: '01', february: '02', march: '03', april: '04', june: '06',
      july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
    };

    let month = monthsMap[monthStr] || '07';
    return `${day}-${month}-${year}`;
  }

  // Standard fallback
  const d = new Date(cleanStr);
  if (isNaN(d.getTime())) {
    const fallbackD = new Date();
    const day = String(fallbackD.getDate()).padStart(2, '0');
    const month = String(fallbackD.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${fallbackD.getFullYear()}`;
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${d.getFullYear()}`;
};

/**
 * Call the VedAstro PanchangaTable API
 */
export const getPanchangaTable = async (
  date: Date | string,
  latitude: number,
  longitude: number,
  locationName: string
): Promise<any> => {
  const dateFormatted = formatDateToDDMMYYYY(date);
  
  // Format coordinates cleanly
  const latClean = Number(latitude || 28.6139).toFixed(4);
  const lngClean = Number(longitude || 77.2090).toFixed(4);
  
  const url = `https://api.vedastro.org/api/Calculate/PanchangaTable/Location/${latClean},${lngClean}/Time/12:00/${dateFormatted}/+05:30/Ayanamsa/RAMAN`;

  try {
    const response = await axios.get(url, { timeout: 12000 });
    return response.data;
  } catch (error: any) {
    console.error('VedAstro getPanchangaTable Error:', error?.response?.data || error.message || error);
    throw error;
  }
};

export interface NorthIndianChartRequest {
  Time: {
    StdTime: string;
    Location: {
      Name: string;
      Latitude: number;
      Longitude: number;
    };
  };
  ChartType: string;
  Ayanamsa: string;
}

export const getNorthIndianChart = async (payload: NorthIndianChartRequest): Promise<string> => {
  try {
    const response = await axios.post('https://api.vedastro.org/api/Calculate/NorthIndianChart', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 25000,
    });

    const data = response.data;
    // In some cases, the payload might be double-nested or inside a wrapper.
    const svgContent = data?.Payload || data?.Payload?.NorthIndianChart || (typeof data === 'string' ? data : null);

    if (svgContent && typeof svgContent === 'string') {
      return svgContent;
    }

    if (typeof data === 'object') {
      // If we got an object but couldn't find Svg, stringify it for fallback or log it
      console.warn('VedAstro returned object but no payload string:', data);
    }

    throw new Error('SVG content not found in VedAstro response');
  } catch (error: any) {
    console.error('VedAstro getNorthIndianChart Error:', error?.response?.data || error.message || error);
    throw error;
  }
};

