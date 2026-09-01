import * as SecureStore from 'expo-secure-store';

export type MembershipKind = 'single' | 'couple';

const MEMBERSHIP_KIND_KEY = 'agewell.membership_kind';

let memoryKind: MembershipKind | null = null;
let secureStoreAvailable: boolean | null = null;

function webStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function parseKind(value: string | null | undefined): MembershipKind | null {
  if (value === 'single' || value === 'couple') {
    return value;
  }
  // Legacy onboarding values
  if (value === 'myself') {
    return 'single';
  }
  if (value === 'parents') {
    return 'couple';
  }
  return null;
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

export async function setMembershipKind(kind: MembershipKind): Promise<void> {
  memoryKind = kind;
  webStorage()?.setItem(MEMBERSHIP_KIND_KEY, kind);
  if (await canUseSecureStore()) {
    await SecureStore.setItemAsync(MEMBERSHIP_KIND_KEY, kind);
  }
}

export async function hydrateMembershipKind(): Promise<void> {
  if (memoryKind !== null) {
    return;
  }
  const fromWeb = parseKind(webStorage()?.getItem(MEMBERSHIP_KIND_KEY));
  if (fromWeb) {
    memoryKind = fromWeb;
    return;
  }
  if (await canUseSecureStore()) {
    const value = await SecureStore.getItemAsync(MEMBERSHIP_KIND_KEY);
    const parsed = parseKind(value);
    if (parsed) {
      memoryKind = parsed;
    }
  }
}

/** null = not chosen yet (show both plans so existing users are not blocked). */
export function getMembershipKind(): MembershipKind | null {
  if (memoryKind !== null) {
    return memoryKind;
  }
  return parseKind(webStorage()?.getItem(MEMBERSHIP_KIND_KEY));
}

/** Test helper */
export function resetMembershipKindPreference(): void {
  memoryKind = null;
  webStorage()?.removeItem(MEMBERSHIP_KIND_KEY);
}
