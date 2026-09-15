import type { AuthRole } from '@/features/auth/authTypes';
import type { NotificationPriority } from '@/features/home/types/home';

export const ADMIN_PAGE_SIZE = 20;
export const ADMIN_DESKTOP_MIN_WIDTH = 900;

export interface AdminUser {
  id: string;
  email: string;
  phone: string;
  role: AuthRole;
  accountStatus: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminUserCreate {
  email: string;
  phone: string;
  role: AuthRole;
  password: string;
}

export interface AdminUserUpdate {
  email?: string;
  phone?: string;
  role?: AuthRole;
  accountStatus?: string;
}

export interface AdminSenior {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
  preferredLanguage: string | null;
  familyContact1Name?: string | null;
  familyContact1Phone?: string | null;
  familyContact2Name?: string | null;
  familyContact2Phone?: string | null;
  preferredHospital?: string | null;
  email: string | null;
  phone: string | null;
  accountStatus: string | null;
  inServiceArea: boolean;
  locationLat: number | null;
  locationLng: number | null;
  locationQuery: string | null;
  locationSource: 'gps' | 'manual' | null;
  hasMembership: boolean;
  careManagerId: string | null;
}

/** Admin seniors list filter segments. */
export type AdminSeniorSegment = 'membership' | 'outside_area' | 'in_area_no_membership';

export interface AdminSeniorCreate {
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
  preferredLanguage?: string;
}

export interface AdminSeniorUpdate {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  preferredLanguage?: string;
  familyContact1Name?: string | null;
  familyContact1Phone?: string | null;
  familyContact2Name?: string | null;
  familyContact2Phone?: string | null;
  preferredHospital?: string | null;
  email?: string;
  phone?: string;
  careManagerId?: string | null;
}

export interface AdminCareManager {
  id: string;
  userId: string | null;
  employeeId: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  skills: string | null;
  experience: string | null;
  languages: string | null;
  availability: string | null;
  status: string | null;
  staffKind: string | null;
}

export interface AdminCareManagerCreate {
  userId: string;
  employeeId: string;
  firstName?: string;
  lastName?: string;
  skills?: string;
  experience?: string;
  languages?: string;
  availability?: string;
  status?: string;
  staffKind?: string;
}

export interface AdminStaffProvision {
  email: string;
  phone: string;
  password: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  staffKind: string;
  skills?: string;
  experience?: string;
  languages?: string;
  availability?: string;
  status?: string;
}

export interface AdminCareManagerUpdate {
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  skills?: string;
  experience?: string;
  languages?: string;
  availability?: string;
  status?: string;
  staffKind?: string;
}

export interface AdminService {
  id: string;
  name: string;
  category: string;
  description: string;
  slug: string | null;
  coverImage: string | null;
}

export interface AdminMembershipPlan {
  id: string;
  name: string | null;
  price: number | null;
}

export interface AdminMembershipBenefit {
  id: string;
  planId: string | null;
  benefitName: string | null;
  quota: number | null;
}

export interface AdminMembershipRecord {
  id: string;
  seniorId: string | null;
  planId: string | null;
  planName: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

export interface AdminNotification {
  id: string;
  userId: string | null;
  title: string | null;
  message: string | null;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: string | null;
}

export interface AdminAuditLog {
  id: string;
  entityName: string | null;
  entityId: string | null;
  action: string | null;
  changes: string | null;
  createdAt: string | null;
}

export interface AdminMetricBreakdown {
  label: string;
  value: number;
  color: string;
}

export interface AdminDashboardMetric {
  key: string;
  label: string;
  href: string;
  state: 'loading' | 'error' | 'ready';
  value: number | null;
  tone?: 'default' | 'primary' | 'accent' | 'emergency' | 'warning' | 'info' | 'safe';
  icon?: string;
  breakdown?: AdminMetricBreakdown[];
}

export interface AdminChartSlice {
  label: string;
  value: number;
  color: string;
}

export interface AdminAttentionItem {
  id: string;
  kind: 'emergency' | 'request' | 'visit';
  title: string;
  detail: string;
  timestamp: string | null;
  actionLabel: string;
  href: string;
}

export interface AdminUpcomingVisitRow {
  id: string;
  time: string;
  name: string;
  type: string;
  status: string;
  href: string;
}

export interface AdminActivityRow {
  id: string;
  title: string;
  detail: string;
  timestamp: string | null;
}
