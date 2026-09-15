import type { IconName } from '@/components/ui';
import { ApiError, getApiErrorMessage } from '@/api/errors';
import { AUTH_ROLE_LABELS, type AuthRole } from '@/features/auth/authTypes';
import { isStaffRole } from '@/features/auth/roleRouting';
import { getSectionState, humanizeStatus } from '@/features/home/selectors/homeViewModel';
import { STAFF_KIND_LABELS, parseStaffKind } from '@/features/care/staffKind';
import type { AdminCareManager, AdminDashboardMetric, AdminSenior, AdminUser } from './types';
import { ADMIN_DESKTOP_MIN_WIDTH, ADMIN_PAGE_SIZE } from './types';
import { joinPersonName } from '@/utils/personName';

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
  { key: 'careManagers', href: '/(admin)/care-managers', label: 'Care Team', icon: 'medkit-outline' },
  { key: 'services', href: '/(admin)/services', label: 'Services', icon: 'grid-outline' },
  { key: 'addonServices', href: '/(admin)/addon-services', label: 'Add-on Services', icon: 'sparkles' },
  { key: 'serviceItems', href: '/(admin)/catalog/offerings', label: 'Service Catalog', icon: 'cart-outline' },
  { key: 'requests', href: '/(admin)/requests', label: 'Requests', icon: 'clipboard-outline' },
  { key: 'visits', href: '/(admin)/visits', label: 'Visits', icon: 'calendar-outline', mobileTab: true },
  { key: 'appointments', href: '/(admin)/appointments', label: 'Appointments', icon: 'time-outline' },
  { key: 'community', href: '/(admin)/community', label: 'Community', icon: 'people-outline' },
  { key: 'memberships', href: '/(admin)/memberships', label: 'Memberships', icon: 'card-outline' },
  { key: 'emergencies', href: '/(admin)/emergencies', label: 'Emergencies', icon: 'warning-outline', mobileTab: true },
  { key: 'notifications', href: '/(admin)/notifications', label: 'Notifications', icon: 'notifications-outline' },
  { key: 'audit', href: '/(admin)/audit', label: 'Audit Logs', icon: 'document-text-outline' },
  { key: 'profile', href: '/(admin)/profile', label: 'Settings', icon: 'settings-outline' },
];

export const ADMIN_NAV_GROUPS: { title: string; keys: string[] }[] = [
  { title: 'Main', keys: ['dashboard'] },
  { title: 'People', keys: ['users', 'seniors', 'careManagers'] },
  { title: 'Care operations', keys: ['visits', 'appointments', 'services', 'addonServices', 'requests', 'emergencies'] },
  { title: 'Programs', keys: ['community', 'memberships', 'serviceItems'] },
  { title: 'System', keys: ['notifications', 'audit', 'profile'] },
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
  return titleCaseName(joinPersonName(senior.firstName, senior.lastName));
}

export function seniorAgeYears(dateOfBirth: string, now = new Date()): number | null {
  const born = new Date(dateOfBirth);
  if (Number.isNaN(born.getTime())) {
    return null;
  }
  let age = now.getFullYear() - born.getFullYear();
  const monthDelta = now.getMonth() - born.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < born.getDate())) {
    age -= 1;
  }
  return age >= 0 && age < 130 ? age : null;
}

export function shortSeniorCode(id: string): string {
  const compact = id.replace(/-/g, '').slice(0, 5).toUpperCase();
  return compact ? `SR-${compact}` : 'SR';
}

/** Formats saved GPS / manual location check for Admin detail. */
export function adminSeniorLocationLabel(
  senior: Pick<AdminSenior, 'locationLat' | 'locationLng' | 'locationQuery' | 'locationSource'>,
): string {
  if (senior.locationSource === 'gps' && senior.locationLat != null && senior.locationLng != null) {
    return `GPS ${senior.locationLat.toFixed(5)}, ${senior.locationLng.toFixed(5)}`;
  }
  if (senior.locationSource === 'manual' && senior.locationQuery) {
    return `Manual: ${senior.locationQuery}`;
  }
  if (senior.locationQuery) {
    return senior.locationQuery;
  }
  if (senior.locationLat != null && senior.locationLng != null) {
    return `${senior.locationLat.toFixed(5)}, ${senior.locationLng.toFixed(5)}`;
  }
  return 'Not recorded';
}

export function adminContactLine(name?: string | null, phone?: string | null): string {
  const who = name?.trim() ?? '';
  const tel = phone?.trim() ?? '';
  if (who && tel) {
    return `${who} · ${tel}`;
  }
  return who || tel || 'Not on file';
}

export function adminCareManagerDisplay(manager: AdminCareManager): string {
  const fromParts = [manager.firstName, manager.lastName].filter(Boolean).join(' ').trim();
  const raw = fromParts || manager.name || 'Care manager';
  return titleCaseName(raw);
}

export function adminStaffKindLabel(staffKind: string | null | undefined): string {
  return STAFF_KIND_LABELS[parseStaffKind(staffKind)];
}

export function splitTagList(value: string | null | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }
  return value
    .split(/[,;|/]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function monthsBetween(fromIso: string, now = new Date()): number | null {
  const from = new Date(fromIso);
  if (Number.isNaN(from.getTime())) {
    return null;
  }
  const months = (now.getFullYear() - from.getFullYear()) * 12 + (now.getMonth() - from.getMonth());
  return months >= 0 ? months : null;
}

export function pageCount(total: number, limit: number): number {
  if (limit <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(total / limit));
}

export function getAdminErrorMessage(error: unknown, kind: 'default' | 'care' | 'user' = 'default'): string {
  const status = error instanceof ApiError ? error.status : undefined;
  if (status === 403) {
    return ADMIN_FORBIDDEN_MESSAGE;
  }
  if (status === 409) {
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
