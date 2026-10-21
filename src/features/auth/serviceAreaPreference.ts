import * as SecureStore from 'expo-secure-store';
import {
  NONE_SERVICE_AREA_MATCH,
  SERVICE_AREA_STAY_TUNED,
  type ServiceAreaMatch,
} from './serviceArea';

const SERVICE_AREA_KEY = 'agewell.service_area_available';
const SERVICE_AREA_RESOLUTION_KEY = 'agewell.service_area_resolution';

let memoryAvailable: boolean | null = null;
let memoryResolution: ServiceAreaMatch | null = null;
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

function parseResolution(raw: string | null | undefined): ServiceAreaMatch | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<ServiceAreaMatch>;
    if (typeof parsed.inServiceArea !== 'boolean') {
      return null;
    }
    return {
      inServiceArea: parsed.inServiceArea,
      tier: parsed.tier === 'tier1' || parsed.tier === 'tier2' ? parsed.tier : null,
      localityId: typeof parsed.localityId === 'string' ? parsed.localityId : null,
      localityLabel: typeof parsed.localityLabel === 'string' ? parsed.localityLabel : null,
    };
  } catch {
    return null;
  }
}

export async function setServiceAreaAvailable(available: boolean): Promise<void> {
  memoryAvailable = available;
  const value = available ? '1' : '0';
  webStorage()?.setItem(SERVICE_AREA_KEY, value);
  if (await canUseSecureStore()) {
    await SecureStore.setItemAsync(SERVICE_AREA_KEY, value);
  }
}

export async function setServiceAreaResolution(match: ServiceAreaMatch): Promise<void> {
  memoryResolution = match;
  await setServiceAreaAvailable(match.inServiceArea);
  const encoded = JSON.stringify(match);
  webStorage()?.setItem(SERVICE_AREA_RESOLUTION_KEY, encoded);
  if (await canUseSecureStore()) {
    await SecureStore.setItemAsync(SERVICE_AREA_RESOLUTION_KEY, encoded);
  }
}

export async function hydrateServiceAreaAvailable(): Promise<void> {
  if (memoryAvailable !== null && memoryResolution !== null) {
    return;
  }
  const fromWeb = webStorage()?.getItem(SERVICE_AREA_KEY);
  if (fromWeb === '1' || fromWeb === '0') {
    memoryAvailable = fromWeb === '1';
  }
  const resolutionWeb = parseResolution(webStorage()?.getItem(SERVICE_AREA_RESOLUTION_KEY));
  if (resolutionWeb) {
    memoryResolution = resolutionWeb;
    memoryAvailable = resolutionWeb.inServiceArea;
    return;
  }
  if (await canUseSecureStore()) {
    if (memoryAvailable === null) {
      const value = await SecureStore.getItemAsync(SERVICE_AREA_KEY);
      if (value === '1' || value === '0') {
        memoryAvailable = value === '1';
      }
    }
    const stored = parseResolution(await SecureStore.getItemAsync(SERVICE_AREA_RESOLUTION_KEY));
    if (stored) {
      memoryResolution = stored;
      memoryAvailable = stored.inServiceArea;
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

export function getServiceAreaResolution(): ServiceAreaMatch | null {
  if (memoryResolution) {
    return memoryResolution;
  }
  return parseResolution(webStorage()?.getItem(SERVICE_AREA_RESOLUTION_KEY));
}

export function canAvailServices(): boolean {
  const available = getServiceAreaAvailable();
  return available !== false;
}

export const SERVICE_AREA_LOCKED_TITLE = 'Coming soon in your area';
export const SERVICE_AREA_LOCKED_MESSAGE = SERVICE_AREA_STAY_TUNED;

/** Test helper */
export function resetServiceAreaPreference(): void {
  memoryAvailable = null;
  memoryResolution = null;
  secureStoreAvailable = null;
  webStorage()?.removeItem(SERVICE_AREA_KEY);
  webStorage()?.removeItem(SERVICE_AREA_RESOLUTION_KEY);
}

export { NONE_SERVICE_AREA_MATCH };
