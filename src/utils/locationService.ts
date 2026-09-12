import { GrievanceLocation } from '../types';

export interface LocationDetectionResult {
  success: boolean;
  location?: GrievanceLocation;
  error?: string;
  errorCode?: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED' | 'NETWORK_ERROR';
}

export interface GeocodedPlace {
  displayName: string;
  name: string;
  zone: string;
  ward: string;
  lat: number;
  lng: number;
  address?: string;
}

/**
 * Reverse geocodes coordinates (lat, lng) to real street/area address
 * using the server OpenStreetMap proxy, with direct Nominatim fallback.
 */
export async function reverseGeocodeCoords(lat: number, lng: number): Promise<GrievanceLocation> {
  try {
    const res = await fetch(`/api/location/reverse?lat=${lat}&lng=${lng}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.location) {
        return data.location;
      }
    }
  } catch (err) {
    console.warn('Server reverse geocoding fallback to direct client call:', err);
  }

  // Direct OpenStreetMap Nominatim client-side fallback
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en'
        }
      }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const street = addr.road || addr.street || addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || 'Civic Area';
      const city = addr.city || addr.town || addr.village || addr.county || 'Metro Region';
      const ward = addr.suburb || addr.quarter || (addr.postcode ? `Ward ${addr.postcode.slice(-3)}` : 'Ward 12');
      const zone = addr.city_district || addr.state_district || 'Central Zone';

      return {
        name: `${street}, ${city}`,
        zone: zone,
        ward: ward,
        lat: lat,
        lng: lng,
        address: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      };
    }
  } catch (e) {
    console.warn('Direct Nominatim fallback failed, using coordinate fallback', e);
  }

  // Absolute fallback
  return {
    name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    zone: 'Zone 4',
    ward: 'Ward 12',
    lat,
    lng,
    address: `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`
  };
}

/**
 * Robust Geolocation Detector:
 * 1. Tries high accuracy (GPS) with 6s timeout.
 * 2. If it times out or fails (common on desktops/laptops with no GPS chip),
 *    immediately falls back to low-accuracy Wi-Fi/IP location with 10s timeout.
 * 3. Reverse-geocodes coordinates via OpenStreetMap.
 */
export async function detectDeviceLocation(): Promise<LocationDetectionResult> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return {
      success: false,
      errorCode: 'NOT_SUPPORTED',
      error: 'Geolocation is not supported by your browser.'
    };
  }

  const getPositionPromise = (options: PositionOptions): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  };

  let position: GeolocationPosition | null = null;

  try {
    // Attempt 1: High Accuracy (GPS hardware, ideal for mobile devices)
    position = await getPositionPromise({
      enableHighAccuracy: true,
      timeout: 6000,
      maximumAge: 30000
    });
  } catch (err: any) {
    if (err.code === 1) {
      // PERMISSION_DENIED: Do not retry, user explicitly clicked block or disallowed
      return {
        success: false,
        errorCode: 'PERMISSION_DENIED',
        error: 'Location access was blocked. Please click the padlock or tune icon in your browser address bar to allow location permission.'
      };
    }

    // Attempt 2: Fallback to low-accuracy (Wi-Fi / Cell tower / IP triangulation)
    // This succeeds immediately on desktop computers & laptops
    try {
      position = await getPositionPromise({
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 120000
      });
    } catch (fallbackErr: any) {
      if (fallbackErr.code === 1) {
        return {
          success: false,
          errorCode: 'PERMISSION_DENIED',
          error: 'Location permission was denied. Please allow location in your browser settings.'
        };
      }
      if (fallbackErr.code === 3) {
        return {
          success: false,
          errorCode: 'TIMEOUT',
          error: 'Location request timed out. You can manually search your address or pick on the OpenStreetMap below.'
        };
      }
      return {
        success: false,
        errorCode: 'POSITION_UNAVAILABLE',
        error: 'Could not determine device position. Please use the search bar or click on the map.'
      };
    }
  }

  if (!position) {
    return {
      success: false,
      errorCode: 'POSITION_UNAVAILABLE',
      error: 'Location coordinates unavailable.'
    };
  }

  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

  // Reverse geocode to get street name & district
  const resolvedLoc = await reverseGeocodeCoords(lat, lng);

  return {
    success: true,
    location: resolvedLoc
  };
}

/**
 * Searches places by name or address using OpenStreetMap Nominatim
 */
export async function searchOpenStreetMap(query: string): Promise<GeocodedPlace[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const res = await fetch(`/api/location/search?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.places)) {
        return data.places;
      }
    }
  } catch (err) {
    console.warn('Server search failed, trying direct OSM search', err);
  }

  // Direct client-side Nominatim query
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en'
        }
      }
    );
    if (res.ok) {
      const results = await res.json();
      return results.map((item: any) => {
        const addr = item.address || {};
        const road = addr.road || addr.suburb || addr.neighbourhood || item.name || 'Municipal Area';
        const city = addr.city || addr.town || addr.village || addr.county || 'City';
        return {
          displayName: item.display_name,
          name: `${road}, ${city}`,
          zone: addr.city_district || addr.state_district || 'Civic Zone',
          ward: addr.suburb || addr.quarter || 'Ward 1',
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          address: item.display_name
        };
      });
    }
  } catch (e) {
    console.warn('Direct search fallback error', e);
  }

  return [];
}

/**
 * Continuous Live Location Tracker using browser GPS watchPosition.
 * Updates on movement in real time and reverse-geocodes with OpenStreetMap.
 * Returns a teardown function to stop tracking when component unmounts.
 */
export function watchLiveLocation(
  onUpdate: (location: GrievanceLocation, accuracy: number) => void,
  onError: (error: string) => void
): () => void {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    onError('Geolocation is not supported by your browser.');
    return () => {};
  }

  let lastLat = 0;
  let lastLng = 0;

  const watchId = navigator.geolocation.watchPosition(
    async (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      // Check distance moved to prevent excessive network requests (~15 meters threshold)
      const dist = Math.sqrt(Math.pow(latitude - lastLat, 2) + Math.pow(longitude - lastLng, 2));
      if (dist > 0.00015 || lastLat === 0) {
        lastLat = latitude;
        lastLng = longitude;
        try {
          const loc = await reverseGeocodeCoords(latitude, longitude);
          onUpdate(loc, accuracy);
        } catch {
          onUpdate(
            {
              name: `Live Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
              zone: 'Civic Zone',
              ward: 'Local Area',
              lat: latitude,
              lng: longitude,
              address: `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(accuracy)}m)`
            },
            accuracy
          );
        }
      }
    },
    (err) => {
      if (err.code === 1) {
        onError('Location permission denied. Please allow location in your browser address bar.');
      } else if (err.code === 3) {
        onError('GPS signal weak or timed out.');
      } else {
        onError('Could not retrieve live GPS position.');
      }
    },
    {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 10000
    }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}
