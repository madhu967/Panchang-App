import axios from './axios';

export interface LocationItem {
  name: string;
  fullName: string;
  latitude: number;
  longitude: number;
}

export const searchLocationSuggestions = async (query: string): Promise<LocationItem[]> => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const cleanQuery = query.trim();

  try {
    // Attempt 1: Photon Geocoding API (Fast & structured open search)
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=6`;
    const response = await axios.get(photonUrl, { timeout: 4000 });

    if (response.data && Array.isArray(response.data.features) && response.data.features.length > 0) {
      return response.data.features.map((feature: any) => {
        const props = feature.properties || {};
        const coords = feature.geometry?.coordinates || [0, 0]; // [lon, lat]
        const name = props.name || props.city || props.street || cleanQuery;
        
        const parts = [
          name,
          props.city !== name ? props.city : null,
          props.state,
          props.country
        ].filter(Boolean);

        return {
          name: `${name}${props.country ? `, ${props.country}` : ''}`,
          fullName: parts.join(', '),
          latitude: Number(coords[1]),
          longitude: Number(coords[0]),
        };
      });
    }
  } catch (error) {
    console.warn('Photon API search failed, falling back to Nominatim', error);
  }

  try {
    // Fallback: OpenStreetMap Nominatim API
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&limit=6&addressdetails=1`;
    const response = await axios.get(nominatimUrl, {
      headers: {
        'User-Agent': 'PanchangamApp/1.0',
      },
      timeout: 4000,
    });

    if (Array.isArray(response.data)) {
      return response.data.map((item: any) => {
        const address = item.address || {};
        const cityName = address.city || address.town || address.village || address.county || item.display_name.split(',')[0];
        const country = address.country || '';
        const nameStr = country ? `${cityName}, ${country}` : item.display_name;

        return {
          name: nameStr,
          fullName: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        };
      });
    }
  } catch (error) {
    console.error('Location search error:', error);
  }

  return [];
};

export const getCurrentLocationByIp = async (): Promise<LocationItem | null> => {
  try {
    const response = await axios.get('https://ipapi.co/json/', { timeout: 3500 });
    if (response.data && response.data.latitude && response.data.longitude) {
      const city = response.data.city || '';
      const country = response.data.country_name || '';
      const name = city ? `${city}, ${country}` : country || 'Detected Location';
      return {
        name,
        fullName: `${city}, ${response.data.region || ''}, ${country}`,
        latitude: parseFloat(response.data.latitude),
        longitude: parseFloat(response.data.longitude),
      };
    }
  } catch (error) {
    console.warn('IP Geolocation failed, trying fallback:', error);
  }

  try {
    const response = await axios.get('http://ip-api.com/json/', { timeout: 3500 });
    if (response.data && response.data.status === 'success') {
      const city = response.data.city || '';
      const country = response.data.country || '';
      const name = city ? `${city}, ${country}` : country || 'Detected Location';
      return {
        name,
        fullName: `${city}, ${response.data.regionName || ''}, ${country}`,
        latitude: parseFloat(response.data.lat),
        longitude: parseFloat(response.data.lon),
      };
    }
  } catch (error) {
    console.error('All IP Geolocation attempts failed:', error);
  }
  return null;
};

let cachedLocation: LocationItem | null = null;

export const setCachedLocation = (loc: LocationItem) => {
  cachedLocation = loc;
};

export const getCachedLocation = (): LocationItem | null => {
  return cachedLocation;
};


