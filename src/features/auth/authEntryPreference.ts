import * as SecureStore from 'expo-secure-store';
import type { Href } from 'expo-router';
import { signInHref } from './authEntry';

const RETURN_TO_SIGN_IN_KEY = 'agewell.return_to_sign_in';

let memoryReturnToSignIn = false;
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

/**
 * After someone has signed in once, later signed-out visits should open Sign in
 * (not first-time Welcome / onboarding).
 */
export async function markReturnToSignIn(): Promise<void> {
  memoryReturnToSignIn = true;
  webStorage()?.setItem(RETURN_TO_SIGN_IN_KEY, '1');
  if (await canUseSecureStore()) {
    await SecureStore.setItemAsync(RETURN_TO_SIGN_IN_KEY, '1');
  }
}

export async function clearReturnToSignIn(): Promise<void> {
  memoryReturnToSignIn = false;
  webStorage()?.removeItem(RETURN_TO_SIGN_IN_KEY);
  if (await canUseSecureStore()) {
    await SecureStore.deleteItemAsync(RETURN_TO_SIGN_IN_KEY);
  }
}

export async function hydrateReturnToSignIn(): Promise<void> {
  if (memoryReturnToSignIn) {
    return;
  }
  if (webStorage()?.getItem(RETURN_TO_SIGN_IN_KEY) === '1') {
    memoryReturnToSignIn = true;
    return;
  }
  if (await canUseSecureStore()) {
    const value = await SecureStore.getItemAsync(RETURN_TO_SIGN_IN_KEY);
    memoryReturnToSignIn = value === '1';
  }
}

export function shouldOpenSignInWhenSignedOut(): boolean {
  if (memoryReturnToSignIn) {
    return true;
  }
  return webStorage()?.getItem(RETURN_TO_SIGN_IN_KEY) === '1';
}

export function unauthenticatedEntryHref(): Href {
  return shouldOpenSignInWhenSignedOut() ? signInHref() : ('/(auth)/welcome' as Href);
}

/** Test helper */
export function resetAuthEntryPreference(): void {
  memoryReturnToSignIn = false;
  secureStoreAvailable = null;
  webStorage()?.removeItem(RETURN_TO_SIGN_IN_KEY);
}
