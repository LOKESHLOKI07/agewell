import * as Location from 'expo-location';
import { promptToEnableLocationServices, readDevicePosition } from '@/utils/deviceLocation';

export type OnboardingAuthMethod = 'google' | 'mobile' | 'email';

export type OnboardingLocationSource = 'gps' | 'manual';

export type OnboardingLocationDraft = {
  method: OnboardingAuthMethod | null;
  source: OnboardingLocationSource | null;
  latitude: number | null;
  longitude: number | null;
  query: string | null;
};

const draft: OnboardingLocationDraft = {
  method: null,
  source: null,
  latitude: null,
  longitude: null,
  query: null,
};

export function setOnboardingAuthMethod(method: OnboardingAuthMethod) {
  draft.method = method;
}

export function setOnboardingGps(latitude: number, longitude: number) {
  draft.source = 'gps';
  draft.latitude = latitude;
  draft.longitude = longitude;
  draft.query = null;
}

export function setOnboardingManualLocation(query: string) {
  draft.source = 'manual';
  draft.latitude = null;
  draft.longitude = null;
  draft.query = query.trim() || null;
}

export function getOnboardingLocationDraft(): OnboardingLocationDraft {
  return { ...draft };
}

/** Payload fields for register / PATCH /seniors/me from the last location check. */
export function onboardingLocationApiFields() {
  const loc = getOnboardingLocationDraft();
  if (!loc.source) {
    return {
      locationLat: null as number | null,
      locationLng: null as number | null,
      locationQuery: null as string | null,
      locationSource: null as OnboardingLocationSource | null,
    };
  }
  if (loc.source === 'gps') {
    return {
      locationLat: loc.latitude,
      locationLng: loc.longitude,
      locationQuery: null as string | null,
      locationSource: 'gps' as const,
    };
  }
  return {
    locationLat: null as number | null,
    locationLng: null as number | null,
    locationQuery: loc.query,
    locationSource: 'manual' as const,
  };
}

export type LocationFailureReason = 'denied' | 'blocked' | 'unavailable' | 'no_fix' | 'coarse';

export type LocationRequestResult =
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; reason: LocationFailureReason };

export const LOCATION_ISSUE_COPY: Record<
  LocationFailureReason,
  { title: string; message: string; openSettings: boolean }
> = {
  denied: {
    title: 'Location permission needed',
    message:
      'AgeWell needs location permission to check whether services are available in your area. Tap Allow Location Access again, or enter your area manually.',
    openSettings: false,
  },
  blocked: {
    title: 'Location is blocked',
    message:
      'Location permission is turned off for AgeWell. Open Settings, allow location, and turn on Precise location. You can also enter your area manually.',
    openSettings: true,
  },
  unavailable: {
    title: 'Location is off',
    message:
      'Turn on Location when the phone asks, or open Settings. You can also enter your area manually.',
    openSettings: true,
  },
  coarse: {
    title: 'Precise location is off',
    message:
      'AgeWell is only allowed Approximate location, so this phone did not return a usable point. Open Settings, turn on Precise location, then try again. You can also enter your area manually.',
    openSettings: true,
  },
  no_fix: {
    title: "Couldn't detect your location",
    message:
      'Permission is allowed, but this phone did not return a GPS point. Turn on Precise location and Google location accuracy, go near a window, then try again. You can also enter your area manually.',
    openSettings: true,
  },
};

function isCoarseAndroidGrant(result: { android?: { accuracy?: string } }): boolean {
  return result.android?.accuracy === 'coarse';
}

export async function requestOnboardingLocation(): Promise<LocationRequestResult> {
  const result = await Location.requestForegroundPermissionsAsync();
  if (result.status !== 'granted') {
    return { ok: false, reason: result.canAskAgain === false ? 'blocked' : 'denied' };
  }

  const servicesOn = await promptToEnableLocationServices();
  if (!servicesOn) {
    return { ok: false, reason: 'unavailable' };
  }

  try {
    const position = await readDevicePosition();
    return {
      ok: true,
      latitude: position.latitude,
      longitude: position.longitude,
    };
  } catch {
    return { ok: false, reason: isCoarseAndroidGrant(result) ? 'coarse' : 'no_fix' };
  }
}

export function openDeviceLocationSettings() {
  // Lazy require so unit tests for the draft helpers do not load react-native.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Linking } = require('react-native') as { Linking: { openSettings: () => void } };
  void Linking.openSettings();
}
