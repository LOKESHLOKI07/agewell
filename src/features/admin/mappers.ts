import type { AuthRole } from '@/features/auth/authTypes';
import { isAuthRole } from '@/features/auth/authTypes';
import { isServiceCity } from '@/features/auth/serviceCities';
import { toListPage } from '@/features/home/api/mappers';
import type { NotificationPriority } from '@/features/home/types/home';
import { toIsoDate } from '@/utils/date';
import { parseStaffKind } from '@/features/care/staffKind';
import type {
  AdminAuditLog,
  AdminCareManager,
  AdminCaseloadPreview,
  AdminCaseloadRestoreResult,
  AdminCaseloadTransferResult,
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
    accountStatus: asOptionalString(data.account_status) ?? 'ACTIVE',
    serviceCity: isServiceCity(data.service_city) ? data.service_city : null,
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
    emergencyContactName: asOptionalString(data.emergency_contact_name),
    preferredLanguage: asOptionalString(data.preferred_language),
    familyContact1Name: asOptionalString(data.family_contact_1_name),
    familyContact1Phone: asOptionalString(data.family_contact_1_phone),
    familyContact2Name: asOptionalString(data.family_contact_2_name),
    familyContact2Phone: asOptionalString(data.family_contact_2_phone),
    preferredHospital: asOptionalString(data.preferred_hospital),
    email: asOptionalString(data.email),
    phone: asOptionalString(data.phone),
    accountStatus: asOptionalString(data.account_status),
    inServiceArea: Boolean(data.in_service_area),
    locationLat: asOptionalNumber(data.location_lat),
    locationLng: asOptionalNumber(data.location_lng),
    locationQuery: asOptionalString(data.location_query),
    locationSource:
      data.location_source === 'gps' || data.location_source === 'manual'
        ? data.location_source
        : null,
    serviceCity: isServiceCity(data.service_city) ? data.service_city : null,
    hasMembership: Boolean(data.has_membership),
    careManagerId: asOptionalString(data.care_manager_id),
    companionId: asOptionalString(data.companion_id),
    careManagerPrimaryId: asOptionalString(data.care_manager_primary_id),
    companionPrimaryId: asOptionalString(data.companion_primary_id),
  };
}

export function toAdminCaseloadPreview(payload: unknown): AdminCaseloadPreview {
  const data = asRecord(payload, 'caseload preview');
  return {
    staffId: asId(data.staff_id, 'caseload.staff_id'),
    staffKind: asString(data.staff_kind, 'caseload.staff_kind'),
    status: asOptionalString(data.status),
    standingSeniorCount: Number(data.standing_senior_count ?? 0),
    coveredSeniorCount: Number(data.covered_senior_count ?? 0),
    openVisitCount: Number(data.open_visit_count ?? 0),
    canRestore: Boolean(data.can_restore),
    transferSupported: Boolean(data.transfer_supported),
  };
}

export function toAdminCaseloadTransferResult(payload: unknown): AdminCaseloadTransferResult {
  const data = asRecord(payload, 'caseload transfer');
  const mode = data.mode === 'PERMANENT' ? 'PERMANENT' : 'TEMPORARY';
  return {
    fromStaffId: asId(data.from_staff_id, 'caseload.from_staff_id'),
    toStaffId: asId(data.to_staff_id, 'caseload.to_staff_id'),
    mode,
    staffKind: asString(data.staff_kind, 'caseload.staff_kind'),
    seniorsMoved: Number(data.seniors_moved ?? 0),
    visitsMoved: Number(data.visits_moved ?? 0),
    seniorIds: Array.isArray(data.senior_ids)
      ? data.senior_ids.filter((item): item is string => typeof item === 'string')
      : [],
  };
}

export function toAdminCaseloadRestoreResult(payload: unknown): AdminCaseloadRestoreResult {
  const data = asRecord(payload, 'caseload restore');
  return {
    staffId: asId(data.staff_id, 'caseload.staff_id'),
    staffKind: asString(data.staff_kind, 'caseload.staff_kind'),
    seniorsRestored: Number(data.seniors_restored ?? 0),
    visitsMoved: Number(data.visits_moved ?? 0),
    seniorIds: Array.isArray(data.senior_ids)
      ? data.senior_ids.filter((item): item is string => typeof item === 'string')
      : [],
  };
}

export function toAdminSeniorPage(payload: unknown) {
  return toListPage(payload, toAdminSenior, 'seniors');
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
    experience: asOptionalString(data.experience),
    languages: asOptionalString(data.languages),
    availability: asOptionalString(data.availability),
    status: asOptionalString(data.status),
    staffKind: parseStaffKind(data.staff_kind),
    companionServiceSlugs: Array.isArray(data.companion_service_slugs)
      ? data.companion_service_slugs.filter((item): item is string => typeof item === 'string')
      : [],
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
    slug: asOptionalString(data.slug),
    coverImage: asOptionalString(data.cover_image),
    callHoursText: asOptionalString(data.call_hours_text),
    supportPhone: asOptionalString(data.support_phone),
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
    userEmail: asOptionalString(data.user_email),
    title: asOptionalString(data.title),
    message: asOptionalString(data.message),
    priority: asString(data.priority, 'notification.priority') as NotificationPriority,
    isRead: asBoolean(data.is_read, 'notification.is_read'),
    actionRef: asOptionalString(data.action_ref),
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
  serviceCity?: string | null;
}) {
  return {
    email: input.email,
    phone: input.phone,
    role: input.role,
    password: input.password,
    ...(input.serviceCity ? { service_city: input.serviceCity } : {}),
  };
}

export function adminSeniorCreateBody(input: {
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
  preferredLanguage?: string;
}) {
  return {
    user_id: input.userId,
    first_name: input.firstName,
    last_name: input.lastName,
    date_of_birth: toIsoDate(input.dateOfBirth),
    address: input.address,
    emergency_contact: input.emergencyContact,
    preferred_language: input.preferredLanguage ?? null,
  };
}

export { toListPage };
