import * as SecureStore from 'expo-secure-store';

const SERVICE_AREA_KEY = 'agewell.service_area_available';

let memoryAvailable: boolean | null = null;
let secureStoreAvailable: boolean | null = null;

function webStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

async function canUseSecureStore(): Promise<boolean> {
  if (secureStoreAvailable !== null) {
    return secureStoreAvailable;
  }
  try {
    secureStoreAvailable = await SecureStore.isAvailableAsync();
  } catch {
    secureStoreAvailable = false;
  }
  return secureStoreAvailable;
}

export async function setServiceAreaAvailable(available: boolean): Promise<void> {
  memoryAvailable = available;
  const value = available ? '1' : '0';
  webStorage()?.setItem(SERVICE_AREA_KEY, value);
  if (await canUseSecureStore()) {
    await SecureStore.setItemAsync(SERVICE_AREA_KEY, value);
  }
}

export async function hydrateServiceAreaAvailable(): Promise<void> {
  if (memoryAvailable !== null) {
    return;
  }
  const fromWeb = webStorage()?.getItem(SERVICE_AREA_KEY);
  if (fromWeb === '1' || fromWeb === '0') {
    memoryAvailable = fromWeb === '1';
    return;
  }
  if (await canUseSecureStore()) {
    const value = await SecureStore.getItemAsync(SERVICE_AREA_KEY);
    if (value === '1' || value === '0') {
      memoryAvailable = value === '1';
    }
  }
}

/** null = not checked yet (treat as available so existing users are not locked). */
export function getServiceAreaAvailable(): boolean | null {
  if (memoryAvailable !== null) {
    return memoryAvailable;
  }
  const fromWeb = webStorage()?.getItem(SERVICE_AREA_KEY);
  if (fromWeb === '1') {
    return true;
  }
  if (fromWeb === '0') {
    return false;
  }
  return null;
}

export function canAvailServices(): boolean {
  const available = getServiceAreaAvailable();
  return available !== false;
}

export const SERVICE_AREA_LOCKED_TITLE = 'Coming soon in your area';
export const SERVICE_AREA_LOCKED_MESSAGE =
  'AgeWell is not live in your location yet. You can explore services here — we will notify you when booking opens.';

/** Test helper */
export function resetServiceAreaPreference(): void {
  memoryAvailable = null;
  secureStoreAvailable = null;
  webStorage()?.removeItem(SERVICE_AREA_KEY);
}
