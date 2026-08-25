import { apiClient } from '@/api/client';
import { ApiError, toApiError } from '@/api/errors';
import { fetchVisitDetail, fetchVisitReports, fetchVisitTasks } from '@/features/care/api';
import type { VisitReport, VisitTask } from '@/features/care/types';
import { toEmergencyCase, toEmergencyEvent } from '@/features/emergency/mappers';
import type { EmergencyCase, EmergencyEvent, EmergencyStatus } from '@/features/emergency/types/emergency';
import {
  toAppointment,
  toCurrentMembership,
  toHealthcareProvider,
  toListPage,
  toMedicalRecord,
  toMembershipUsageList,
  toServiceRequest,
  toVisit,
} from '@/features/home/api/mappers';
import type {
  Appointment,
  AppointmentStatus,
  CurrentMembership,
  HealthcareProvider,
  ListPage,
  MedicalRecord,
  MembershipUsage,
  NotificationPriority,
  ServiceRequest,
  ServiceRequestStatus,
  Visit,
  VisitStatus,
} from '@/features/home/types/home';
import type { AuthRole } from '@/features/auth/authTypes';
import type { FamilyMember } from '@/features/family/types';
import { toFamilyMember } from '@/features/family/mappers';
import { toIsoDate } from '@/utils/date';
import {
  adminSeniorCreateBody,
  adminUserCreateBody,
  toAdminAccess,
  toAdminAccessPage,
  toAdminAuditLog,
  toAdminCareManager,
  toAdminCareManagerList,
  toAdminFamilyPage,
  toAdminMembershipBenefit,
  toAdminMembershipPlan,
  toAdminMembershipRecord,
  toAdminNotification,
  toAdminSenior,
  toAdminSeniorPage,
  toAdminService,
  toAdminServiceList,
  toAdminUser,
  toAdminUserPage,
} from './mappers';
import type {
  AdminAccess,
  AdminAuditLog,
  AdminCareManager,
  AdminCareManagerCreate,
  AdminCareManagerUpdate,
  AdminMembershipBenefit,
  AdminMembershipPlan,
  AdminMembershipRecord,
  AdminNotification,
  AdminSenior,
  AdminSeniorCreate,
  AdminService,
  AdminUser,
  AdminUserCreate,
  AdminUserUpdate,
} from './types';

async function getMapped<T>(path: string, map: (data: unknown) => T, params?: Record<string, unknown>): Promise<T> {
  try {
    const response = await apiClient.get(path, { params });
    return map(response.data);
  } catch (error) {
    throw toApiError(error, 'admin');
  }
}

async function sendMapped<T>(
  method: 'post' | 'patch' | 'delete',
  path: string,
  map: (data: unknown) => T,
  body?: unknown,
): Promise<T> {
  try {
    const response = await apiClient.request({ method, url: path, data: body });
    return map(response.data);
  } catch (error) {
    throw toApiError(error, 'admin');
  }
}

export function fetchAdminUsers(params: {
  limit: number;
  offset: number;
  role?: AuthRole;
  email?: string;
}): Promise<ListPage<AdminUser>> {
  return getMapped('/users/', toAdminUserPage, {
    limit: params.limit,
    offset: params.offset,
    ...(params.role ? { role: params.role } : {}),
    ...(params.email ? { email: params.email } : {}),
  });
}

export function fetchAdminUser(id: string): Promise<AdminUser> {
  return getMapped(`/users/${id}`, toAdminUser);
}

export function createAdminUser(input: AdminUserCreate): Promise<AdminUser> {
  return sendMapped('post', '/users/', toAdminUser, adminUserCreateBody(input));
}

export function updateAdminUser(id: string, input: AdminUserUpdate): Promise<AdminUser> {
  const body: Record<string, unknown> = {};
  if (input.email !== undefined) body.email = input.email;
  if (input.phone !== undefined) body.phone = input.phone;
  if (input.role !== undefined) body.role = input.role;
  if (input.accountStatus !== undefined) body.account_status = input.accountStatus;
  return sendMapped('patch', `/users/${id}`, toAdminUser, body);
}

export function deleteAdminUser(id: string): Promise<AdminUser> {
  return sendMapped('delete', `/users/${id}`, toAdminUser);
}

export function fetchAdminSeniors(params: { limit: number; offset: number }): Promise<ListPage<AdminSenior>> {
  return getMapped('/seniors/', toAdminSeniorPage, params);
}

export function fetchAdminSenior(id: string): Promise<AdminSenior> {
  return getMapped(`/seniors/${id}`, toAdminSenior);
}

export async function fetchAdminSeniorByUserId(userId: string): Promise<AdminSenior | null> {
  try {
    return await getMapped(`/seniors/by-user/${userId}`, toAdminSenior);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export function createAdminSenior(input: AdminSeniorCreate): Promise<AdminSenior> {
  return sendMapped('post', '/seniors/', toAdminSenior, adminSeniorCreateBody(input));
}

export function updateAdminSenior(
  id: string,
  input: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    address?: string;
    emergencyContact?: string;
    email?: string;
    phone?: string;
  },
): Promise<AdminSenior> {
  const body: Record<string, unknown> = {};
  if (input.firstName !== undefined) body.first_name = input.firstName;
  if (input.lastName !== undefined) body.last_name = input.lastName;
  if (input.dateOfBirth !== undefined) body.date_of_birth = toIsoDate(input.dateOfBirth);
  if (input.address !== undefined) body.address = input.address;
  if (input.emergencyContact !== undefined) body.emergency_contact = input.emergencyContact;
  if (input.email !== undefined) body.email = input.email;
  if (input.phone !== undefined) body.phone = input.phone;
  return sendMapped('patch', `/seniors/${id}`, toAdminSenior, body);
}

export function deleteAdminSenior(id: string): Promise<AdminSenior> {
  return sendMapped('delete', `/seniors/${id}`, toAdminSenior);
}

export function fetchAdminFamilies(params: { limit: number; offset: number }): Promise<ListPage<FamilyMember>> {
  return getMapped('/families/', toAdminFamilyPage, params);
}

export function fetchAdminFamily(id: string): Promise<FamilyMember> {
  return getMapped(`/families/${id}`, toFamilyMember);
}

export async function fetchAdminFamilyByUserId(userId: string): Promise<FamilyMember | null> {
  try {
    return await getMapped(`/families/by-user/${userId}`, toFamilyMember);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export function createAdminFamily(input: {
  userId: string;
  firstName: string;
  lastName: string;
  relationship?: string;
  requestedSeniorReference?: string;
}): Promise<FamilyMember> {
  return sendMapped('post', '/families/', toFamilyMember, {
    user_id: input.userId,
    first_name: input.firstName,
    last_name: input.lastName,
    relationship: input.relationship,
    requested_senior_reference: input.requestedSeniorReference,
  });
}

export function updateAdminFamily(
  id: string,
  input: {
    firstName?: string;
    lastName?: string;
    relationship?: string;
    requestedSeniorReference?: string;
  },
): Promise<FamilyMember> {
  const body: Record<string, unknown> = {};
  if (input.firstName !== undefined) body.first_name = input.firstName;
  if (input.lastName !== undefined) body.last_name = input.lastName;
  if (input.relationship !== undefined) body.relationship = input.relationship;
  if (input.requestedSeniorReference !== undefined) body.requested_senior_reference = input.requestedSeniorReference;
  return sendMapped('patch', `/families/${id}`, toFamilyMember, body);
}

export function deleteAdminFamily(id: string): Promise<FamilyMember> {
  return sendMapped('delete', `/families/${id}`, toFamilyMember);
}

export function fetchAdminAccess(params: {
  limit: number;
  offset: number;
  familyId?: string;
  seniorId?: string;
}): Promise<ListPage<AdminAccess>> {
  return getMapped('/access/', toAdminAccessPage, {
    limit: params.limit,
    offset: params.offset,
    ...(params.familyId ? { family_id: params.familyId } : {}),
    ...(params.seniorId ? { senior_id: params.seniorId } : {}),
  });
}

export function grantAdminAccess(familyId: string, seniorId: string): Promise<AdminAccess> {
  return sendMapped('post', '/access/', toAdminAccess, { family_id: familyId, senior_id: seniorId });
}

export function revokeAdminAccess(accessId: string): Promise<AdminAccess> {
  return sendMapped('delete', `/access/${accessId}`, toAdminAccess);
}

export function fetchAdminCareManagers(): Promise<AdminCareManager[]> {
  return getMapped('/care/', toAdminCareManagerList);
}

export function fetchAdminCareManager(id: string): Promise<AdminCareManager> {
  return getMapped(`/care/${id}`, toAdminCareManager);
}

export async function fetchAdminCareManagerByUserId(userId: string): Promise<AdminCareManager | null> {
  try {
    return await getMapped(`/care/by-user/${userId}`, toAdminCareManager);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export function createAdminCareManager(input: AdminCareManagerCreate): Promise<AdminCareManager> {
  return sendMapped('post', '/care/', toAdminCareManager, {
    user_id: input.userId,
    employee_id: input.employeeId,
    first_name: input.firstName,
    last_name: input.lastName,
    skills: input.skills,
    experience: input.experience,
    languages: input.languages,
    availability: input.availability,
    status: input.status,
  });
}

export function updateAdminCareManager(id: string, input: AdminCareManagerUpdate): Promise<AdminCareManager> {
  const body: Record<string, unknown> = {};
  if (input.employeeId !== undefined) body.employee_id = input.employeeId;
  if (input.firstName !== undefined) body.first_name = input.firstName;
  if (input.lastName !== undefined) body.last_name = input.lastName;
  if (input.skills !== undefined) body.skills = input.skills;
  if (input.status !== undefined) body.status = input.status;
  if (input.experience !== undefined) body.experience = input.experience;
  if (input.languages !== undefined) body.languages = input.languages;
  if (input.availability !== undefined) body.availability = input.availability;
  return sendMapped('patch', `/care/${id}`, toAdminCareManager, body);
}

export function deleteAdminCareManager(id: string): Promise<AdminCareManager> {
  return sendMapped('delete', `/care/${id}`, toAdminCareManager);
}

export function approveAdminCareManager(
  id: string,
  input: { status?: string; employeeId?: string } = {},
): Promise<AdminCareManager> {
  return sendMapped('post', `/care/${id}/approve`, toAdminCareManager, {
    status: input.status ?? 'ACTIVE',
    employee_id: input.employeeId,
  });
}

export function fetchAdminServices(): Promise<AdminService[]> {
  return getMapped('/services/', toAdminServiceList);
}

export function createAdminService(input: { name: string; category: string; description: string }): Promise<AdminService> {
  return sendMapped('post', '/services/', toAdminService, input);
}

export function updateAdminService(
  id: string,
  input: { name?: string; category?: string; description?: string },
): Promise<AdminService> {
  return sendMapped('patch', `/services/${id}`, toAdminService, input);
}

export function fetchAdminServiceRequests(params: {
  limit: number;
  offset: number;
  status?: ServiceRequestStatus;
  seniorId?: string;
}): Promise<ListPage<ServiceRequest>> {
  return getMapped('/services/requests', (data) => toListPage(data, toServiceRequest, 'service requests'), {
    limit: params.limit,
    offset: params.offset,
    ...(params.status ? { status: params.status } : {}),
    ...(params.seniorId ? { senior_id: params.seniorId } : {}),
  });
}

export function updateAdminServiceRequest(id: string, status: ServiceRequestStatus): Promise<ServiceRequest> {
  return sendMapped('patch', `/services/requests/${id}`, toServiceRequest, { status });
}

export function fetchAdminVisits(params: {
  limit: number;
  offset: number;
  today?: boolean;
  upcoming?: boolean;
  seniorId?: string;
  careManagerId?: string;
  status?: VisitStatus;
}): Promise<ListPage<Visit>> {
  return getMapped('/visits/', (data) => toListPage(data, toVisit, 'visits'), {
    limit: params.limit,
    offset: params.offset,
    ...(params.today ? { today: true } : {}),
    ...(params.upcoming ? { upcoming: true } : {}),
    ...(params.seniorId ? { senior_id: params.seniorId } : {}),
    ...(params.careManagerId ? { care_manager_id: params.careManagerId } : {}),
    ...(params.status ? { status: params.status } : {}),
  });
}

export function createAdminVisit(input: {
  seniorId: string;
  careManagerId?: string;
  status?: VisitStatus;
  scheduledAt?: string;
  notes?: string;
}): Promise<Visit> {
  return sendMapped('post', '/visits/', toVisit, {
    senior_id: input.seniorId,
    care_manager_id: input.careManagerId,
    status: input.status,
    scheduled_at: input.scheduledAt,
    notes: input.notes,
  });
}

export function updateAdminVisit(
  id: string,
  input: {
    careManagerId?: string;
    status?: VisitStatus;
    scheduledAt?: string;
    notes?: string;
  },
): Promise<Visit> {
  const body: Record<string, unknown> = {};
  if (input.careManagerId !== undefined) body.care_manager_id = input.careManagerId;
  if (input.status !== undefined) body.status = input.status;
  if (input.scheduledAt !== undefined) body.scheduled_at = input.scheduledAt;
  if (input.notes !== undefined) body.notes = input.notes;
  return sendMapped('patch', `/visits/${id}`, toVisit, body);
}

export { fetchVisitDetail as fetchAdminVisitDetail, fetchVisitTasks as fetchAdminVisitTasks, fetchVisitReports as fetchAdminVisitReports };

export function fetchAdminAppointments(params: {
  limit: number;
  offset: number;
  seniorId?: string;
  upcoming?: boolean;
  status?: AppointmentStatus;
}): Promise<ListPage<Appointment>> {
  return getMapped('/appointments/', (data) => toListPage(data, toAppointment, 'appointments'), {
    limit: params.limit,
    offset: params.offset,
    ...(params.seniorId ? { senior_id: params.seniorId } : {}),
    ...(params.upcoming ? { upcoming: true } : {}),
    ...(params.status ? { status: params.status } : {}),
  });
}

export function fetchAdminProviders(): Promise<ListPage<HealthcareProvider>> {
  return getMapped('/healthcare/providers', (data) => toListPage(data, toHealthcareProvider, 'providers'));
}

export function fetchAdminMembershipPlans(params: { limit: number; offset: number }): Promise<ListPage<AdminMembershipPlan>> {
  return getMapped('/memberships/plans', (data) => toListPage(data, toAdminMembershipPlan, 'membership plans'), params);
}

export function fetchAdminMembershipBenefits(params: {
  limit: number;
  offset: number;
  planId?: string;
}): Promise<ListPage<AdminMembershipBenefit>> {
  return getMapped('/memberships/benefits', (data) => toListPage(data, toAdminMembershipBenefit, 'membership benefits'), {
    limit: params.limit,
    offset: params.offset,
    ...(params.planId ? { plan_id: params.planId } : {}),
  });
}

export function fetchAdminMembershipRecords(params: {
  limit: number;
  offset: number;
  seniorId?: string;
}): Promise<ListPage<AdminMembershipRecord>> {
  return getMapped('/memberships/records', (data) => toListPage(data, toAdminMembershipRecord, 'membership records'), {
    limit: params.limit,
    offset: params.offset,
    ...(params.seniorId ? { senior_id: params.seniorId } : {}),
  });
}

export function fetchAdminCurrentMembership(seniorId: string): Promise<CurrentMembership> {
  return getMapped('/memberships/current', toCurrentMembership, { senior_id: seniorId });
}

export function fetchAdminMembershipUsage(seniorId: string): Promise<MembershipUsage[]> {
  return getMapped('/memberships/current/usage', toMembershipUsageList, { senior_id: seniorId });
}

export function fetchAdminEmergencies(params: {
  limit: number;
  offset: number;
  status?: EmergencyStatus;
  seniorId?: string;
}): Promise<ListPage<EmergencyCase>> {
  return getMapped('/emergency/', (data) => toListPage(data, toEmergencyCase, 'emergency cases'), {
    limit: params.limit,
    offset: params.offset,
    ...(params.status ? { status: params.status } : {}),
    ...(params.seniorId ? { senior_id: params.seniorId } : {}),
  });
}

export function fetchAdminEmergency(id: string): Promise<EmergencyCase> {
  return getMapped(`/emergency/${id}`, toEmergencyCase);
}

export function fetchAdminEmergencyEvents(id: string): Promise<ListPage<EmergencyEvent>> {
  return getMapped(`/emergency/${id}/events`, (data) => toListPage(data, toEmergencyEvent, 'emergency events'));
}

export function updateAdminEmergencyStatus(id: string, status: EmergencyStatus): Promise<EmergencyCase> {
  return sendMapped('patch', `/emergency/${id}`, toEmergencyCase, { status });
}

export function fetchAdminNotifications(params: {
  limit: number;
  offset: number;
  userId?: string;
  priority?: NotificationPriority;
  isRead?: boolean;
}): Promise<ListPage<AdminNotification>> {
  return getMapped('/notifications/admin', (data) => toListPage(data, toAdminNotification, 'notifications'), {
    limit: params.limit,
    offset: params.offset,
    ...(params.userId ? { user_id: params.userId } : {}),
    ...(params.priority ? { priority: params.priority } : {}),
    ...(params.isRead === undefined ? {} : { is_read: params.isRead }),
  });
}

export function fetchAdminAuditLogs(params: { limit: number; offset: number }): Promise<ListPage<AdminAuditLog>> {
  return getMapped('/audit/', (data) => toListPage(data, toAdminAuditLog, 'audit logs'), params);
}

export function fetchAdminMedicalRecords(seniorId: string): Promise<ListPage<MedicalRecord>> {
  return getMapped('/healthcare/medical-records', (data) => toListPage(data, toMedicalRecord, 'medical records'), {
    senior_id: seniorId,
  });
}

export type { VisitTask, VisitReport };
