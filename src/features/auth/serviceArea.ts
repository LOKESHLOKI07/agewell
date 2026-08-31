import * as Location from 'expo-location';
import type { Href } from 'expo-router';

export const SERVICE_AREA_CITIES = 'Kandivali and Borivali, Mumbai';

const SERVICE_BOUNDS = {
  minLat: 19.17,
  maxLat: 19.28,
  minLng: 72.81,
  maxLng: 72.9,
} as const;

const SERVICE_KEYWORDS = [
  'kandivali',
  'kandivli',
  'borivali',
  'borivli',
];

export function isCoordinateInServiceArea(latitude: number, longitude: number): boolean {
  return (
    latitude >= SERVICE_BOUNDS.minLat &&
    latitude <= SERVICE_BOUNDS.maxLat &&
    longitude >= SERVICE_BOUNDS.minLng &&
    longitude <= SERVICE_BOUNDS.maxLng
  );
}

export function isPlaceNameInServiceArea(place: string): boolean {
  const normalized = place.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return SERVICE_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function isAddressInServiceArea(address: {
  city?: string | null;
  district?: string | null;
  subregion?: string | null;
  name?: string | null;
  street?: string | null;
  formattedAddress?: string | null;
}): boolean {
  return isPlaceNameInServiceArea(
    [address.city, address.district, address.subregion, address.name, address.street, address.formattedAddress]
      .filter(Boolean)
      .join(' '),
  );
}

export async function resolveServiceAreaFromGps(latitude: number, longitude: number): Promise<boolean> {
  if (isCoordinateInServiceArea(latitude, longitude)) {
    return true;
  }
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    return results.some(isAddressInServiceArea);
  } catch {
    return false;
  }
}

export async function resolveServiceAreaFromQuery(query: string): Promise<boolean> {
  if (isPlaceNameInServiceArea(query)) {
    return true;
  }
  try {
    const results = await Location.geocodeAsync(query.trim());
    const first = results[0];
    if (first && isCoordinateInServiceArea(first.latitude, first.longitude)) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function serviceAreaHref(available: boolean): Href {
  return {
    pathname: '/(auth)/service-area',
    params: { available: available ? '1' : '0' },
  } as Href;
}
