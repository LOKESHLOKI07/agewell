import type { AuthRole } from './authTypes';

export function authenticatedHomeHref(role: AuthRole, options?: { careStatus?: string | null }): string {
  if (role === 'CARE_MANAGER' && options?.careStatus && options.careStatus.toUpperCase() !== 'ACTIVE') {
    return '/pending-approval';
  }
  switch (role) {
    case 'SENIOR':
    case 'FAMILY':
      // Legacy FAMILY accounts also use the senior home shell.
      return '/(tabs)';
    case 'CARE_MANAGER':
      return '/(care)';
    case 'ADMIN':
    case 'OPERATIONS':
      return '/(admin)';
  }
}

export function isSeniorRole(role: AuthRole | null | undefined): boolean {
  return role === 'SENIOR';
}

export function isCareManagerRole(role: AuthRole | null | undefined): boolean {
  return role === 'CARE_MANAGER';
}

/** @deprecated Family mode removed; kept for legacy accounts routed to senior tabs. */
export function isFamilyRole(role: AuthRole | null | undefined): boolean {
  return role === 'FAMILY';
}

export function isMemberHomeRole(role: AuthRole | null | undefined): boolean {
  return role === 'SENIOR' || role === 'FAMILY';
}

export function isStaffRole(role: AuthRole | null | undefined): boolean {
  return role === 'ADMIN' || role === 'OPERATIONS';
}

export function authenticatedProfileHref(role: AuthRole | null | undefined): string {
  switch (role) {
    case 'CARE_MANAGER':
      return '/(care)/profile';
    case 'ADMIN':
    case 'OPERATIONS':
      return '/(admin)/profile';
    case 'FAMILY':
    case 'SENIOR':
    default:
      return '/(tabs)/profile';
  }
}
