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
  email: string | null;
  phone: string | null;
  accountStatus: string | null;
}

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
  email?: string;
  phone?: string;
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

export interface AdminDashboardMetric {
  key: string;
  label: string;
  href: string;
  state: 'loading' | 'error' | 'ready';
  value: number | null;
  tone?: 'default' | 'primary' | 'emergency' | 'warning';
}
