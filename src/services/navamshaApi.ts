import axios from './axios';

export interface NavamshaPanchangParams {
  year: number;
  month: number;
  date: number;
  hours: number;
  minutes: number;
  latitude: number;
  longitude: number;
  timezone: number;
}

/**
 * Call the Navamsha Advanced Panchang API
 */
export const getNavamshaPanchang = async (
  dateInput: Date | string,
  latitude: number,
  longitude: number
): Promise<any> => {
  let d: Date;
  if (!dateInput) {
    d = new Date();
  } else if (dateInput instanceof Date) {
    d = dateInput;
  } else {
    // Parse dateInput. Examples: "23 Jul 2026", "23-07-2026", "2026-07-23"
    const cleanStr = String(dateInput).trim();
    // Try standard parsing
    const parsed = new Date(cleanStr);
    if (!isNaN(parsed.getTime())) {
      d = parsed;
    } else {
      // Manual parse for "23 Jul 2026"
      const spaceParts = cleanStr.split(/\s+/);
      if (spaceParts.length === 3) {
        const day = parseInt(spaceParts[0].replace(/[^0-9]/g, ''), 10);
        const monthStr = spaceParts[1].toLowerCase();
        const year = parseInt(spaceParts[2], 10);

        const monthsMap: Record<string, number> = {
          jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
          jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
          january: 0, february: 1, march: 2, april: 3, june: 5,
          july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
        };

        const month = monthsMap[monthStr] !== undefined ? monthsMap[monthStr] : 6;
        d = new Date(year, month, day);
      } else {
        d = new Date();
      }
    }
  }

  // If the parsed date is today, we can use the current hour and minute.
  // Otherwise, default to 05:30 (standard morning time for panchang)
  const today = new Date();
  const isToday = d.getDate() === today.getDate() && 
                  d.getMonth() === today.getMonth() && 
                  d.getFullYear() === today.getFullYear();
                  
  const hours = isToday ? today.getHours() : 5;
  const minutes = isToday ? today.getMinutes() : 30;
  
  // Estimate timezone offset from the selected longitude instead of using the local device's timezone offset.
  // Using the wrong timezone for a coordinate causes sidereal time calculation mismatches and 500 server errors.
  let timezone = Math.round(Number(longitude) / 15);
  if (Number(longitude) >= 68 && Number(longitude) <= 98) {
    timezone = 5.5; // Indian Standard Time
  }

  const body = {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    date: d.getDate(),
    hours,
    minutes,
    hour: hours,       // Singular form to support different API version schemas
    minute: minutes,   // Singular form to support different API version schemas
    latitude: (latitude !== undefined && latitude !== null && !isNaN(Number(latitude))) ? Number(latitude) : 16.5449,
    longitude: (longitude !== undefined && longitude !== null && !isNaN(Number(longitude))) ? Number(longitude) : 81.5212,
    timezone,
  };

  const url = 'https://api.navamsha.in/api/v1/astrology/panchang/advanced';
  
  try {
    console.log(`[Navamsha API] POST ${url} with body:`, JSON.stringify(body));
    const response = await axios.post(url, body, {
      timeout: 15000,
    });
    return response.data;
  } catch (error: any) {
    console.error('Navamsha getNavamshaPanchang Error with body:', JSON.stringify(body), error?.response?.data || error.message || error);
    throw error;
  }
};
