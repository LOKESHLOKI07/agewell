import * as Location from 'expo-location';
import { LOCATION_PERMISSION_MESSAGE, LOCATION_SERVICES_MESSAGE, toPointTimestamp } from './selectors';
import type { TrackingPermissionState, TrackingPointCreate } from './types';

export interface ForegroundCoordinates {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface PermissionCheck {
  state: TrackingPermissionState;
  message: string | null;
}

export async function checkForegroundPermission(): Promise<PermissionCheck> {
  const enabled = await Location.hasServicesEnabledAsync();
  if (!enabled) {
    return { state: 'unavailable', message: LOCATION_SERVICES_MESSAGE };
  }
  const current = await Location.getForegroundPermissionsAsync();
  if (current.status === 'granted') {
    return { state: 'granted', message: null };
  }
  if (current.status === 'denied' && current.canAskAgain === false) {
    return { state: 'denied', message: LOCATION_PERMISSION_MESSAGE };
  }
  return { state: 'unknown', message: null };
}

export async function requestForegroundPermission(): Promise<PermissionCheck> {
  const enabled = await Location.hasServicesEnabledAsync();
  if (!enabled) {
    return { state: 'unavailable', message: LOCATION_SERVICES_MESSAGE };
  }
  const result = await Location.requestForegroundPermissionsAsync();
  if (result.status === 'granted') {
    return { state: 'granted', message: null };
  }
  return { state: 'denied', message: LOCATION_PERMISSION_MESSAGE };
}

export async function readForegroundCoordinates(): Promise<ForegroundCoordinates> {
  const position = await Location.getCurrentPositionAsync({});
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    timestamp: position.timestamp,
  };
}

export function toTrackingPointCreate(coords: ForegroundCoordinates): TrackingPointCreate {
  return {
    latitude: String(coords.latitude),
    longitude: String(coords.longitude),
    timestamp: toPointTimestamp(coords.timestamp),
  };
}

export async function watchForegroundCoordinates(
  onUpdate: (coords: ForegroundCoordinates) => void,
): Promise<() => void> {
  const subscription = await Location.watchPositionAsync({}, (position) => {
    onUpdate({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: position.timestamp,
    });
  });
  return () => {
    subscription.remove();
  };
}
