import * as Location from 'expo-location';
import { Linking } from 'react-native';

export type OnboardingAuthMethod = 'google' | 'mobile' | 'email';

export type OnboardingLocationDraft = {
  method: OnboardingAuthMethod | null;
  source: 'gps' | 'manual' | null;
  latitude: number | null;
  longitude: number | null;
};

const draft: OnboardingLocationDraft = {
  method: null,
  source: null,
  latitude: null,
  longitude: null,
};

export function setOnboardingAuthMethod(method: OnboardingAuthMethod) {
  draft.method = method;
}

export function setOnboardingGps(latitude: number, longitude: number) {
  draft.source = 'gps';
  draft.latitude = latitude;
  draft.longitude = longitude;
}

export function setOnboardingManualLocation() {
  draft.source = 'manual';
  draft.latitude = null;
  draft.longitude = null;
}

export function getOnboardingLocationDraft(): OnboardingLocationDraft {
  return { ...draft };
}

export type LocationRequestResult =
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; reason: 'denied' | 'blocked' | 'unavailable' };

export async function requestOnboardingLocation(): Promise<LocationRequestResult> {
  const enabled = await Location.hasServicesEnabledAsync();
  if (!enabled) {
    return { ok: false, reason: 'unavailable' };
  }

  const result = await Location.requestForegroundPermissionsAsync();
  if (result.status !== 'granted') {
    return { ok: false, reason: result.canAskAgain === false ? 'blocked' : 'denied' };
  }

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      ok: true,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    return { ok: true, latitude: 0, longitude: 0 };
  }
}

export function openDeviceLocationSettings() {
  void Linking.openSettings();
}
