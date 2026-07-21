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
