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

export function getAccessToken(): string | null {
  return memoryAccessToken;
}

export function getRefreshToken(): string | null {
  return memoryRefreshToken;
}

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  memoryAccessToken = tokens.accessToken;
  memoryRefreshToken = tokens.refreshToken;

  if (!(await canUseSecureStore())) {
    return;
  }

  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
  ]);
}

export async function loadTokens(): Promise<AuthTokens | null> {
  if (memoryAccessToken && memoryRefreshToken) {
    return { accessToken: memoryAccessToken, refreshToken: memoryRefreshToken };
  }

  if (!(await canUseSecureStore())) {
    return memoryAccessToken && memoryRefreshToken
      ? { accessToken: memoryAccessToken, refreshToken: memoryRefreshToken }
      : null;
  }

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

export async function clearTokens(): Promise<void> {
  memoryAccessToken = null;
  memoryRefreshToken = null;

  if (!(await canUseSecureStore())) {
    return;
  }

  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

/** Test helper — resets in-memory session without touching SecureStore availability. */
export function resetTokenMemory(): void {
  memoryAccessToken = null;
  memoryRefreshToken = null;
}
