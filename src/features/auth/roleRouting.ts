import type { AuthRole } from './authTypes';

export function authenticatedHomeHref(role: AuthRole, options?: { careStatus?: string | null }): string {
  if (role === 'CARE_MANAGER' && options?.careStatus && options.careStatus.toUpperCase() !== 'ACTIVE') {
    return '/pending-approval';
  }
  switch (role) {
    case 'SENIOR':
      return '/(tabs)';
    case 'CARE_MANAGER':
      return '/(care)';
    case 'FAMILY':
      return '/(family)';
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

export function isFamilyRole(role: AuthRole | null | undefined): boolean {
  return role === 'FAMILY';
}

export function isStaffRole(role: AuthRole | null | undefined): boolean {
  return role === 'ADMIN' || role === 'OPERATIONS';
}

export function authenticatedProfileHref(role: AuthRole | null | undefined): string {
  switch (role) {
    case 'CARE_MANAGER':
      return '/(care)/profile';
    case 'FAMILY':
      return '/(family)/profile';
    case 'ADMIN':
    case 'OPERATIONS':
      return '/(admin)/profile';
    default:
      return '/(tabs)/profile';
  }
}
