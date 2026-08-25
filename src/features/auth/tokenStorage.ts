import * as SecureStore from 'expo-secure-store';
import type { AuthTokens } from './authTypes';

const ACCESS_TOKEN_KEY = 'agewell.access_token';
const REFRESH_TOKEN_KEY = 'agewell.refresh_token';

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;
let secureStoreAvailable: boolean | null = null;

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

function webStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function persistWebTokens(tokens: AuthTokens): void {
  const storage = webStorage();
  if (!storage) {
    return;
  }
  storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

function loadWebTokens(): AuthTokens | null {
  const storage = webStorage();
  if (!storage) {
    return null;
  }
  const accessToken = storage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = storage.getItem(REFRESH_TOKEN_KEY);
  if (!accessToken || !refreshToken) {
    return null;
  }
  return { accessToken, refreshToken };
}

function clearWebTokens(): void {
  const storage = webStorage();
  if (!storage) {
    return;
  }
  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  return memoryAccessToken;
}

export function getRefreshToken(): string | null {
  return memoryRefreshToken;
}

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  memoryAccessToken = tokens.accessToken;
  memoryRefreshToken = tokens.refreshToken;

  if (await canUseSecureStore()) {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
    ]);
    return;
  }

  // Web / environments without SecureStore — persist across reloads.
  persistWebTokens(tokens);
}

export async function loadTokens(): Promise<AuthTokens | null> {
  if (memoryAccessToken && memoryRefreshToken) {
    return { accessToken: memoryAccessToken, refreshToken: memoryRefreshToken };
  }

  if (await canUseSecureStore()) {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    ]);
    memoryAccessToken = accessToken;
    memoryRefreshToken = refreshToken;
    if (!accessToken || !refreshToken) {
      return null;
    }
    return { accessToken, refreshToken };
  }

  const webTokens = loadWebTokens();
  if (!webTokens) {
    return null;
  }
  memoryAccessToken = webTokens.accessToken;
  memoryRefreshToken = webTokens.refreshToken;
  return webTokens;
}

export async function clearTokens(): Promise<void> {
  memoryAccessToken = null;
  memoryRefreshToken = null;

  if (await canUseSecureStore()) {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  }

  clearWebTokens();
}

/** Test helper — resets in-memory session and SecureStore availability cache. */
export function resetTokenMemory(): void {
  memoryAccessToken = null;
  memoryRefreshToken = null;
  secureStoreAvailable = null;
}
