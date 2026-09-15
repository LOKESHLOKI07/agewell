import { Alert } from 'react-native';
import { ApiError } from '@/api/errors';
import { queryClient } from '@/api/queryClient';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';
import type { CurrentMembership } from '@/features/home/types/home';
import { ADD_ON_SERVICES } from '@/features/services/addOnServiceCatalog';
import { openMembershipPurchase } from './openMembershipPurchase';

export const MEMBERSHIP_REQUIRED_TITLE = 'Membership required';
export const MEMBERSHIP_REQUIRED_MESSAGE =
  'Buy an AgeWell Single Membership to continue with this service. Add-on services can still be used without a membership.';

export const EMERGENCY_SUPPORT_SLUG = 'emergency-sos';
export const CARE_MANAGER_SLUG = 'care-manager';

const ADDON_SLUGS = new Set(ADD_ON_SERVICES.map((item) => item.id));

/** Emergency Support always opens; the SOS screen shows coming-soon / membership / SOS. */
export function isEmergencySupportSlug(slug: string | undefined | null): boolean {
  return slug === EMERGENCY_SUPPORT_SLUG;
}

/** Care Manager always opens; the page shows coming-soon / unassigned / assigned. */
export function isCareManagerSlug(slug: string | undefined | null): boolean {
  return slug === CARE_MANAGER_SLUG;
}

/** Emergency Support and Care Manager skip the submit membership check; their pages handle variants. */
export function isOpenAccessServiceSlug(slug: string | undefined | null): boolean {
  return isEmergencySupportSlug(slug) || isCareManagerSlug(slug);
}

export function isAddonServiceSlug(slug: string | undefined | null): boolean {
  if (!slug) {
    return false;
  }
  return ADDON_SLUGS.has(slug);
}

export function isMembershipActive(membership: CurrentMembership | null | undefined): boolean {
  if (!membership) {
    return false;
  }
  return membership.status.toUpperCase() !== 'EXPIRED';
}

export function isMembershipNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

/** True when the user has a non-expired membership on file. */
export function hasActiveMembership(
  membership: CurrentMembership | null | undefined,
  error?: unknown,
): boolean {
  if (isMembershipNotFound(error)) {
    return false;
  }
  return isMembershipActive(membership);
}

/** Reads the cached /memberships/current query (for submit guards). */
export function hasCachedActiveMembership(): boolean {
  const data = queryClient.getQueryData<CurrentMembership>(homeQueryKeys.membershipCurrent);
  if (data) {
    return isMembershipActive(data);
  }
  const state = queryClient.getQueryState(homeQueryKeys.membershipCurrent);
  if (state?.error && isMembershipNotFound(state.error)) {
    return false;
  }
  // Unknown / still loading — do not block submit as "has membership" (safer to prompt).
  return Boolean(data);
}

export function promptBuyMembership(message = MEMBERSHIP_REQUIRED_MESSAGE): void {
  Alert.alert(MEMBERSHIP_REQUIRED_TITLE, message, [
    { text: 'Not now', style: 'cancel' },
    { text: 'Buy membership', onPress: () => openMembershipPurchase() },
  ]);
}

/**
 * Returns true when the user may use a Single Membership service.
 * Shows an alert and returns false when membership is missing.
 */
export function guardBasicMembershipAccess(hasMembership: boolean): boolean {
  if (hasMembership) {
    return true;
  }
  promptBuyMembership();
  return false;
}

/**
 * Submit guard: add-ons always allowed (area checks stay elsewhere);
 * membership service slugs require an active membership.
 */
export function guardServiceSubmitBySlug(slug: string): boolean {
  if (isAddonServiceSlug(slug) || isOpenAccessServiceSlug(slug)) {
    return true;
  }
  if (hasCachedActiveMembership()) {
    return true;
  }
  promptBuyMembership();
  return false;
}
