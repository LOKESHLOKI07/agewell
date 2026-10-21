import * as Location from 'expo-location';
import type { Href } from 'expo-router';

export type ServiceTier = 'tier1' | 'tier2';

export type ServiceAreaMatch = {
  inServiceArea: boolean;
  tier: ServiceTier | null;
  localityId: string | null;
  localityLabel: string | null;
};

export type ServiceLocality = {
  id: string;
  label: string;
  tier: ServiceTier;
  keywords: string[];
};

/** Public line used on banners and lock screens. */
export const SERVICE_AREA_CITIES =
  'Kandivali & Borivali, Mumbai, and Warora, Bhadravati & Wani, Chandrapur';

export const SERVICE_AREA_STAY_TUNED =
  'Stay tuned, we will start our service in your area shortly.';

export const NONE_SERVICE_AREA_MATCH: ServiceAreaMatch = {
  inServiceArea: false,
  tier: null,
  localityId: null,
  localityLabel: null,
};

/** Kandivali / Borivali, Mumbai. */
const TIER1_BOUNDS = {
  minLat: 19.17,
  maxLat: 19.28,
  minLng: 72.81,
  maxLng: 72.9,
} as const;

/**
 * Warora, Bhadravati and Wani in Chandrapur district.
 * Stays south of Nagpur (~21.15N) and away from Karnataka Bhadravati.
 */
const TIER2_BOUNDS = {
  minLat: 19.95,
  maxLat: 20.35,
  minLng: 78.8,
  maxLng: 79.25,
} as const;

export const SERVICE_LOCALITIES: ServiceLocality[] = [
  {
    id: 'kandivali',
    label: 'Kandivali, Mumbai',
    tier: 'tier1',
    keywords: ['kandivali', 'kandivli'],
  },
  {
    id: 'borivali',
    label: 'Borivali, Mumbai',
    tier: 'tier1',
    keywords: ['borivali', 'borivli'],
  },
  {
    id: 'warora',
    label: 'Warora, Chandrapur',
    tier: 'tier2',
    keywords: ['warora'],
  },
  {
    id: 'bhadravati',
    label: 'Bhadravati, Chandrapur',
    tier: 'tier2',
    keywords: ['bhadravati'],
  },
  {
    id: 'wani',
    label: 'Wani, Chandrapur',
    tier: 'tier2',
    keywords: ['wani'],
  },
];

function inBounds(
  latitude: number,
  longitude: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
): boolean {
  return (
    latitude >= bounds.minLat &&
    latitude <= bounds.maxLat &&
    longitude >= bounds.minLng &&
    longitude <= bounds.maxLng
  );
}

function matchesKeyword(normalized: string, keyword: string): boolean {
  if (keyword.length <= 4) {
    return new RegExp(`(^|[^a-z0-9])${keyword}([^a-z0-9]|$)`).test(normalized);
  }
  return normalized.includes(keyword);
}

export function matchPlaceName(place: string): ServiceAreaMatch {
  const normalized = place.trim().toLowerCase();
  if (!normalized) {
    return NONE_SERVICE_AREA_MATCH;
  }
  for (const locality of SERVICE_LOCALITIES) {
    if (locality.keywords.some((keyword) => matchesKeyword(normalized, keyword))) {
      return {
        inServiceArea: true,
        tier: locality.tier,
        localityId: locality.id,
        localityLabel: locality.label,
      };
    }
  }
  return NONE_SERVICE_AREA_MATCH;
}

export function matchCoordinate(latitude: number, longitude: number): ServiceAreaMatch {
  if (inBounds(latitude, longitude, TIER1_BOUNDS)) {
    return {
      inServiceArea: true,
      tier: 'tier1',
      localityId: 'mumbai-west',
      localityLabel: 'Kandivali & Borivali, Mumbai',
    };
  }
  if (inBounds(latitude, longitude, TIER2_BOUNDS)) {
    return {
      inServiceArea: true,
      tier: 'tier2',
      localityId: 'chandrapur-cluster',
      localityLabel: 'Warora, Bhadravati & Wani, Chandrapur',
    };
  }
  return NONE_SERVICE_AREA_MATCH;
}

export function isCoordinateInServiceArea(latitude: number, longitude: number): boolean {
  return matchCoordinate(latitude, longitude).inServiceArea;
}

export function isPlaceNameInServiceArea(place: string): boolean {
  return matchPlaceName(place).inServiceArea;
}

export function isAddressInServiceArea(address: {
  city?: string | null;
  district?: string | null;
  subregion?: string | null;
  name?: string | null;
  street?: string | null;
  formattedAddress?: string | null;
}): boolean {
  return matchPlaceName(joinAddressFields(address)).inServiceArea;
}

function joinAddressFields(address: {
  city?: string | null;
  district?: string | null;
  subregion?: string | null;
  name?: string | null;
  street?: string | null;
  formattedAddress?: string | null;
}): string {
  return [address.city, address.district, address.subregion, address.name, address.street, address.formattedAddress]
    .filter(Boolean)
    .join(' ');
}

export async function resolveServiceAreaMatchFromGps(
  latitude: number,
  longitude: number,
): Promise<ServiceAreaMatch> {
  const byCoord = matchCoordinate(latitude, longitude);
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    for (const address of results) {
      const byPlace = matchPlaceName(joinAddressFields(address));
      if (byPlace.inServiceArea) {
        return byPlace;
      }
    }
  } catch {
    // GPS box still counts when reverse-geocode is unavailable.
  }
  return byCoord;
}

export async function resolveServiceAreaMatchFromQuery(query: string): Promise<ServiceAreaMatch> {
  const byPlace = matchPlaceName(query);
  if (byPlace.inServiceArea) {
    return byPlace;
  }
  try {
    const results = await Location.geocodeAsync(query.trim());
    const first = results[0];
    if (first) {
      return matchCoordinate(first.latitude, first.longitude);
    }
  } catch {
    return NONE_SERVICE_AREA_MATCH;
  }
  return NONE_SERVICE_AREA_MATCH;
}

export async function resolveServiceAreaFromGps(latitude: number, longitude: number): Promise<boolean> {
  return (await resolveServiceAreaMatchFromGps(latitude, longitude)).inServiceArea;
}

export async function resolveServiceAreaFromQuery(query: string): Promise<boolean> {
  return (await resolveServiceAreaMatchFromQuery(query)).inServiceArea;
}

export function resolveServiceAreaFromSenior(input: {
  inServiceArea?: boolean | null;
  locationQuery?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  address?: string | null;
}): ServiceAreaMatch {
  if (input.locationQuery) {
    const fromQuery = matchPlaceName(input.locationQuery);
    if (fromQuery.inServiceArea) {
      return fromQuery;
    }
  }
  if (input.locationLat != null && input.locationLng != null) {
    const fromGps = matchCoordinate(input.locationLat, input.locationLng);
    if (fromGps.inServiceArea) {
      return fromGps;
    }
  }
  if (input.address) {
    const fromAddress = matchPlaceName(input.address);
    if (fromAddress.inServiceArea) {
      return fromAddress;
    }
  }
  if (input.inServiceArea) {
    return {
      inServiceArea: true,
      tier: 'tier1',
      localityId: 'mumbai-west',
      localityLabel: 'Kandivali & Borivali, Mumbai',
    };
  }
  return NONE_SERVICE_AREA_MATCH;
}

export function serviceAreaHref(available: boolean): Href {
  return {
    pathname: '/(auth)/service-area',
    params: { available: available ? '1' : '0' },
  } as Href;
}
