import type { AuthRole } from '@/features/auth/authTypes';
import { isAuthRole } from '@/features/auth/authTypes';
import { toFamilyMember } from '@/features/family/mappers';
import { toListPage } from '@/features/home/api/mappers';
import type { NotificationPriority } from '@/features/home/types/home';
import type {
  AdminAccess,
  AdminAuditLog,
  AdminCareManager,
  AdminMembershipBenefit,
  AdminMembershipPlan,
  AdminMembershipRecord,
  AdminNotification,
  AdminSenior,
  AdminService,
  AdminUser,
} from './types';

function asRecord(payload: unknown, label: string): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    throw new Error(`Invalid ${label}`);
  }
  return payload as Record<string, unknown>;
}

function asId(value: unknown, label: string): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  throw new Error(`Invalid ${label}`);
}

function asString(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}

function asOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asOptionalNumber(value: unknown): number | null {
  return typeof value === 'number' && !Number.isNaN(value) ? value : null;
}

function asBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}

export function toAdminUser(payload: unknown): AdminUser {
  const data = asRecord(payload, 'user');
  if (!isAuthRole(data.role)) {
    throw new Error('Invalid user role');
  }
  return {
    id: asId(data.id, 'user.id'),
    email: asString(data.email, 'user.email'),
    phone: asString(data.phone, 'user.phone'),
    role: data.role,
    createdAt: asOptionalString(data.created_at),
    updatedAt: asOptionalString(data.updated_at),
  };
}

export function toAdminUserPage(payload: unknown) {
  return toListPage(payload, toAdminUser, 'users');
}

export function toAdminSenior(payload: unknown): AdminSenior {
  const data = asRecord(payload, 'senior');
  return {
    id: asId(data.id, 'senior.id'),
    userId: asId(data.user_id, 'senior.user_id'),
    firstName: asString(data.first_name, 'senior.first_name'),
    lastName: asString(data.last_name, 'senior.last_name'),
    dateOfBirth: asString(data.date_of_birth, 'senior.date_of_birth'),
    address: asString(data.address, 'senior.address'),
    emergencyContact: asString(data.emergency_contact, 'senior.emergency_contact'),
    email: asOptionalString(data.email),
  };
}

export function toAdminSeniorPage(payload: unknown) {
  return toListPage(payload, toAdminSenior, 'seniors');
}

export function toAdminFamilyPage(payload: unknown) {
  return toListPage(payload, toFamilyMember, 'families');
}

export function toAdminAccess(payload: unknown): AdminAccess {
  const data = asRecord(payload, 'access');
  return {
    id: asId(data.id, 'access.id'),
    familyId: asId(data.family_id, 'access.family_id'),
    seniorId: asId(data.senior_id, 'access.senior_id'),
    createdAt: asOptionalString(data.created_at),
  };
}

export function toAdminAccessPage(payload: unknown) {
  return toListPage(payload, toAdminAccess, 'access');
}

export function toAdminCareManager(payload: unknown): AdminCareManager {
  const data = asRecord(payload, 'care manager');
  const firstName = asOptionalString(data.first_name);
  const lastName = asOptionalString(data.last_name);
  const combined = [firstName, lastName].filter(Boolean).join(' ').trim();
  const name = asOptionalString(data.name) ?? (combined || null);
  return {
    id: asId(data.id, 'care_manager.id'),
    userId: asOptionalString(data.user_id),
    employeeId: asOptionalString(data.employee_id),
    name,
    firstName,
    lastName,
    skills: asOptionalString(data.skills),
    status: asOptionalString(data.status),
  };
}

export function toAdminCareManagerList(payload: unknown): AdminCareManager[] {
  if (!Array.isArray(payload)) {
    throw new Error('Invalid care managers');
  }
  return payload.map(toAdminCareManager);
}

export function toAdminService(payload: unknown): AdminService {
  const data = asRecord(payload, 'service');
  return {
    id: asId(data.id, 'service.id'),
    name: asString(data.name, 'service.name'),
    category: asString(data.category, 'service.category'),
    description: asString(data.description, 'service.description'),
  };
}

export function toAdminServiceList(payload: unknown): AdminService[] {
  if (!Array.isArray(payload)) {
    throw new Error('Invalid services');
  }
  return payload.map(toAdminService);
}

export function toAdminMembershipPlan(payload: unknown): AdminMembershipPlan {
  const data = asRecord(payload, 'membership plan');
  return {
    id: asId(data.id, 'plan.id'),
    name: asOptionalString(data.name),
    price: asOptionalNumber(data.price),
  };
}

export function toAdminMembershipBenefit(payload: unknown): AdminMembershipBenefit {
  const data = asRecord(payload, 'membership benefit');
  return {
    id: asId(data.id, 'benefit.id'),
    planId: asOptionalString(data.plan_id),
    benefitName: asOptionalString(data.benefit_name),
    quota: asOptionalNumber(data.quota),
  };
}

export function toAdminMembershipRecord(payload: unknown): AdminMembershipRecord {
  const data = asRecord(payload, 'membership record');
  return {
    id: asId(data.id, 'membership.id'),
    seniorId: asOptionalString(data.senior_id),
    planId: asOptionalString(data.plan_id),
    planName: asOptionalString(data.plan_name),
    status: asString(data.status, 'membership.status'),
    startDate: asOptionalString(data.start_date),
    endDate: asOptionalString(data.end_date),
  };
}

export function toAdminNotification(payload: unknown): AdminNotification {
  const data = asRecord(payload, 'notification');
  return {
    id: asId(data.id, 'notification.id'),
    userId: asOptionalString(data.user_id),
    title: asOptionalString(data.title),
    message: asOptionalString(data.message),
    priority: asString(data.priority, 'notification.priority') as NotificationPriority,
    isRead: asBoolean(data.is_read, 'notification.is_read'),
    createdAt: asOptionalString(data.created_at),
  };
}

export function toAdminAuditLog(payload: unknown): AdminAuditLog {
  const data = asRecord(payload, 'audit log');
  return {
    id: asId(data.id, 'audit.id'),
    entityName: asOptionalString(data.entity_name),
    entityId: asOptionalString(data.entity_id),
    action: asOptionalString(data.action),
    changes: asOptionalString(data.changes),
    createdAt: asOptionalString(data.created_at),
  };
}

export function adminUserCreateBody(input: {
  email: string;
  phone: string;
  role: AuthRole;
  password: string;
}) {
  return {
    email: input.email,
    phone: input.phone,
    role: input.role,
    password: input.password,
  };
}

export function adminSeniorCreateBody(input: {
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
}) {
  return {
    user_id: input.userId,
    first_name: input.firstName,
    last_name: input.lastName,
    date_of_birth: input.dateOfBirth,
    address: input.address,
    emergency_contact: input.emergencyContact,
  };
}

export { toListPage };
