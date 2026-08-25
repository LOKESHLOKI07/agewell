import type { IconName } from '@/components/ui';
import { ApiError, getApiErrorMessage } from '@/api/errors';
import { AUTH_ROLE_LABELS, type AuthRole } from '@/features/auth/authTypes';
import { isStaffRole } from '@/features/auth/roleRouting';
import { familyDisplayName } from '@/features/family/mappers';
import type { FamilyMember } from '@/features/family/types';
import { getSectionState, humanizeStatus } from '@/features/home/selectors/homeViewModel';
import type { AdminCareManager, AdminDashboardMetric, AdminSenior, AdminUser } from './types';
import { ADMIN_DESKTOP_MIN_WIDTH, ADMIN_PAGE_SIZE } from './types';

export { ADMIN_DESKTOP_MIN_WIDTH, ADMIN_PAGE_SIZE };

export const ADMIN_FORBIDDEN_MESSAGE = "You don't have permission to access this area.";
export const AUDIT_ACTOR_NOTICE = 'Actor information is not available in the current audit schema.';

export interface AdminNavItem {
  key: string;
  href: string;
  label: string;
  icon: IconName;
  mobileTab?: boolean;
}

export const ADMIN_NAV: readonly AdminNavItem[] = [
  { key: 'dashboard', href: '/(admin)', label: 'Dashboard', icon: 'home-outline', mobileTab: true },
  { key: 'users', href: '/(admin)/users', label: 'Users', icon: 'people-outline', mobileTab: true },
  { key: 'seniors', href: '/(admin)/seniors', label: 'Seniors', icon: 'person-outline' },
  { key: 'families', href: '/(admin)/families', label: 'Families', icon: 'heart-outline' },
  { key: 'access', href: '/(admin)/access', label: 'Access', icon: 'key-outline' },
  { key: 'careManagers', href: '/(admin)/care-managers', label: 'Care Associates', icon: 'medkit-outline' },
  { key: 'services', href: '/(admin)/services', label: 'Services', icon: 'grid-outline' },
  { key: 'requests', href: '/(admin)/requests', label: 'Requests', icon: 'clipboard-outline' },
  { key: 'visits', href: '/(admin)/visits', label: 'Visits', icon: 'calendar-outline', mobileTab: true },
  { key: 'appointments', href: '/(admin)/appointments', label: 'Appointments', icon: 'time-outline' },
  { key: 'community', href: '/(admin)/community', label: 'Community', icon: 'people-outline' },
  { key: 'memberships', href: '/(admin)/memberships', label: 'Memberships', icon: 'card-outline' },
  { key: 'emergencies', href: '/(admin)/emergencies', label: 'Emergencies', icon: 'warning-outline', mobileTab: true },
  { key: 'notifications', href: '/(admin)/notifications', label: 'Notifications', icon: 'notifications-outline' },
  { key: 'audit', href: '/(admin)/audit', label: 'Audit Logs', icon: 'document-text-outline' },
  { key: 'profile', href: '/(admin)/profile', label: 'Profile', icon: 'person-circle-outline' },
];

export const ADMIN_MORE_HREF = '/(admin)/more';

export function adminMobileTabs(): AdminNavItem[] {
  return [...ADMIN_NAV.filter((item) => item.mobileTab), { key: 'more', href: ADMIN_MORE_HREF, label: 'More', icon: 'menu-outline' }];
}

export function adminOverflowNav(): AdminNavItem[] {
  return ADMIN_NAV.filter((item) => !item.mobileTab);
}

export function isAdminPathActive(pathname: string, href: string): boolean {
  const current = pathname.replace(/\/$/, '') || '/';
  const target = href.replace('/(admin)', '') || '/';
  const normalizedTarget = target.replace(/\/$/, '') || '/';
  if (normalizedTarget === '/') {
    return current === '/' || current === '/index';
  }
  return current === normalizedTarget || current.startsWith(`${normalizedTarget}/`);
}

export function isDesktopWidth(width: number): boolean {
  return width >= ADMIN_DESKTOP_MIN_WIDTH;
}

export function canEnterAdminUi(role: AuthRole | null | undefined): boolean {
  return isStaffRole(role);
}

export function adminRoleLabel(role: AuthRole): string {
  return AUTH_ROLE_LABELS[role];
}

export function titleCaseName(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function adminUserDisplay(user: AdminUser): string {
  return user.email;
}

export function adminSeniorDisplay(senior: Pick<AdminSenior, 'firstName' | 'lastName'>): string {
  return titleCaseName(`${senior.firstName} ${senior.lastName}`);
}

export function adminFamilyDisplay(family: Pick<FamilyMember, 'firstName' | 'lastName'>): string {
  const name = familyDisplayName(family);
  return name ? titleCaseName(name) : 'Family member';
}

export function adminCareManagerDisplay(manager: AdminCareManager): string {
  const fromParts = [manager.firstName, manager.lastName].filter(Boolean).join(' ').trim();
  const raw = fromParts || manager.name || 'Care manager';
  return titleCaseName(raw);
}

export function pageCount(total: number, limit: number): number {
  if (limit <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(total / limit));
}

export function getAdminErrorMessage(error: unknown, kind: 'default' | 'access' | 'care' | 'user' = 'default'): string {
  const status = error instanceof ApiError ? error.status : undefined;
  if (status === 403) {
    return ADMIN_FORBIDDEN_MESSAGE;
  }
  if (status === 409) {
    if (kind === 'access') {
      return 'This family already has access to that senior.';
    }
    if (kind === 'care') {
      return 'This employee ID is already in use.';
    }
    if (kind === 'user') {
      return 'This email or phone is already in use.';
    }
    return 'This record already exists.';
  }
  if (error instanceof ApiError) {
    return error.message;
  }
  return getApiErrorMessage(error, 'admin');
}

export function containsSecretField(payload: unknown): boolean {
  const text = JSON.stringify(payload);
  return (
    text.includes('hashed_password') ||
    text.includes('"password"') ||
    text.includes('access_token') ||
    text.includes('refresh_token') ||
    text.includes('JWT_SECRET')
  );
}

export function buildDashboardMetrics(input: {
  users: { isPending: boolean; isError: boolean; data?: { total: number } };
  seniors: { isPending: boolean; isError: boolean; data?: { total: number } };
  families: { isPending: boolean; isError: boolean; data?: { total: number } };
  careManagers: { isPending: boolean; isError: boolean; data?: unknown[] };
  todayVisits: { isPending: boolean; isError: boolean; data?: { total: number } };
  openEmergencies: { isPending: boolean; isError: boolean; data?: { total: number } };
  pendingRequests: { isPending: boolean; isError: boolean; data?: { total: number } };
}): AdminDashboardMetric[] {
  const metric = (
    key: string,
    label: string,
    href: string,
    query: { isPending: boolean; isError: boolean; value: number | null },
    tone: AdminDashboardMetric['tone'] = 'default',
  ): AdminDashboardMetric => ({
    key,
    label,
    href,
    tone,
    state: query.isPending ? 'loading' : query.isError ? 'error' : 'ready',
    value: query.isPending || query.isError ? null : query.value,
  });

  return [
    metric('users', 'Total Users', '/(admin)/users', {
      isPending: input.users.isPending,
      isError: input.users.isError,
      value: input.users.data?.total ?? 0,
    }),
    metric('seniors', 'Total Seniors', '/(admin)/seniors', {
      isPending: input.seniors.isPending,
      isError: input.seniors.isError,
      value: input.seniors.data?.total ?? 0,
    }),
    metric('families', 'Total Families', '/(admin)/families', {
      isPending: input.families.isPending,
      isError: input.families.isError,
      value: input.families.data?.total ?? 0,
    }),
    metric('careManagers', 'Care Managers', '/(admin)/care-managers', {
      isPending: input.careManagers.isPending,
      isError: input.careManagers.isError,
      value: input.careManagers.data?.length ?? 0,
    }),
    metric('visits', "Today's Visits", '/(admin)/visits', {
      isPending: input.todayVisits.isPending,
      isError: input.todayVisits.isError,
      value: input.todayVisits.data?.total ?? 0,
    }),
    metric(
      'emergencies',
      'Open Emergencies',
      '/(admin)/emergencies',
      {
        isPending: input.openEmergencies.isPending,
        isError: input.openEmergencies.isError,
        value: input.openEmergencies.data?.total ?? 0,
      },
      'emergency',
    ),
    metric('requests', 'Pending Service Requests', '/(admin)/requests', {
      isPending: input.pendingRequests.isPending,
      isError: input.pendingRequests.isError,
      value: input.pendingRequests.data?.total ?? 0,
    }),
  ];
}

export { getSectionState, humanizeStatus };
