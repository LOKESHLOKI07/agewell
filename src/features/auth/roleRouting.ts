import { getAppVariant, type AppVariant } from '@/config/appVariant';
import type { StaffKind } from '@/features/care/staffKind';
import type { AuthRole } from './authTypes';

export type HomeRoutingOptions = {
  careStatus?: string | null;
  staffKind?: string | null;
  variant?: AppVariant;
};

function isPendingCare(careStatus?: string | null): boolean {
  return Boolean(careStatus && careStatus.toUpperCase() !== 'ACTIVE');
}

function familyAppHomeHref(role: AuthRole): string {
  switch (role) {
    case 'SENIOR':
    case 'FAMILY':
      return '/(tabs)';
    case 'CARE_MANAGER':
      return '/role-unavailable?role=CARE_MANAGER';
    case 'ADMIN':
    case 'OPERATIONS':
      return '/(admin)';
  }
}

function careAppHomeHref(role: AuthRole, options?: HomeRoutingOptions): string {
  if (role !== 'CARE_MANAGER') {
    return `/role-unavailable?role=${role}`;
  }
  if (isPendingCare(options?.careStatus)) {
    return '/pending-approval';
  }
  return '/(care)';
}

export function authenticatedHomeHref(role: AuthRole, options?: HomeRoutingOptions): string {
  const variant = options?.variant ?? getAppVariant();
  if (variant === 'care') {
    return careAppHomeHref(role, options);
  }
  return familyAppHomeHref(role);
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

/** All staff kinds share the same five Care app tabs (Home / Tasks / Map / Alerts / Profile). */
export function staffHomeTabs(_staffKind?: StaffKind | string | null): 'staff' {
  return 'staff';
}
