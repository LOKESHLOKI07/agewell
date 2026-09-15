import * as Location from 'expo-location';

export const LOCATION_FIX_TIMEOUT_MS = 10_000;
export const LAST_KNOWN_MAX_AGE_MS = 5 * 60 * 1000;

export type DevicePosition = {
  latitude: number;
  longitude: number;
  timestamp: number;
};

export function isUsableCoordinate(latitude: number, longitude: number): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && !(latitude === 0 && longitude === 0);
}

function toDevicePosition(position: {
  coords: { latitude: number; longitude: number };
  timestamp: number;
}): DevicePosition | null {
  const { latitude, longitude } = position.coords;
  if (!isUsableCoordinate(latitude, longitude)) {
    return null;
  }
  return {
    latitude,
    longitude,
    timestamp: position.timestamp,
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('LOCATION_TIMEOUT')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

async function enableNetworkProviderIfAvailable() {
  try {
    await Location.enableNetworkProviderAsync?.();
  } catch {
    // User declined the Android location-accuracy prompt, or the API is unavailable.
  }
}

/**
 * If the phone Location toggle is off, show Android's "Turn on Location" dialog.
 * Returns true when location services are on afterwards.
 */
export async function promptToEnableLocationServices(): Promise<boolean> {
  if (await Location.hasServicesEnabledAsync()) {
    return true;
  }
  await enableNetworkProviderIfAvailable();
  return Location.hasServicesEnabledAsync();
}

/**
 * Reads a usable device point. Permission must already be granted.
 * Tries a timed GPS fix, then last-known coordinates. Throws if neither works.
 */
export async function readDevicePosition(options?: { timeoutMs?: number }): Promise<DevicePosition> {
  const timeoutMs = options?.timeoutMs ?? LOCATION_FIX_TIMEOUT_MS;
  await enableNetworkProviderIfAvailable();

  try {
    const position = await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        mayShowUserSettingsDialog: true,
      }),
      timeoutMs,
    );
    const current = toDevicePosition(position);
    if (current) {
      return current;
    }
  } catch {
    // Fall through to last-known.
  }

  const last = await Location.getLastKnownPositionAsync({
    maxAge: LAST_KNOWN_MAX_AGE_MS,
  });
  const cached = last ? toDevicePosition(last) : null;
  if (cached) {
    return cached;
  }

  throw new Error('LOCATION_NO_FIX');
}
