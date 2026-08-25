import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import type { AuthRole } from '@/features/auth/authTypes';
import type { EmergencyStatus } from '@/features/emergency/types/emergency';
import type { AppointmentStatus, NotificationPriority, ServiceRequestStatus, VisitStatus } from '@/features/home/types/home';
import {
  approveAdminCareManager,
  createAdminCareManager,
  createAdminFamily,
  createAdminSenior,
  createAdminService,
  createAdminUser,
  createAdminVisit,
  fetchAdminAccess,
  fetchAdminAppointments,
  fetchAdminAuditLogs,
  fetchAdminCareManager,
  fetchAdminCareManagerByUserId,
  fetchAdminCareManagers,
  fetchAdminCurrentMembership,
  fetchAdminEmergencies,
  fetchAdminEmergency,
  fetchAdminEmergencyEvents,
  fetchAdminFamilies,
  fetchAdminFamily,
  fetchAdminFamilyByUserId,
  fetchAdminMedicalRecords,
  fetchAdminMembershipBenefits,
  fetchAdminMembershipPlans,
  fetchAdminMembershipRecords,
  fetchAdminMembershipUsage,
  fetchAdminNotifications,
  fetchAdminProviders,
  fetchAdminSenior,
  fetchAdminSeniorByUserId,
  fetchAdminSeniors,
  fetchAdminServiceRequests,
  fetchAdminServices,
  fetchAdminUser,
  fetchAdminUsers,
  fetchAdminVisitDetail,
  fetchAdminVisitReports,
  fetchAdminVisitTasks,
  fetchAdminVisits,
  grantAdminAccess,
  revokeAdminAccess,
  updateAdminCareManager,
  updateAdminEmergencyStatus,
  updateAdminFamily,
  updateAdminSenior,
  updateAdminService,
  updateAdminServiceRequest,
  updateAdminUser,
  updateAdminVisit,
} from './api';
import { adminQueryKeys } from './queryKeys';
import type { AdminCareManagerCreate, AdminCareManagerUpdate, AdminSeniorCreate, AdminSeniorUpdate, AdminUserCreate, AdminUserUpdate } from './types';
import { ADMIN_PAGE_SIZE } from './types';

function useStaffQuery<T>(queryKey: readonly unknown[], queryFn: () => Promise<T>, enabled = true): UseQueryResult<T> {
  const isAuthenticated = useAuthStore((state) => state.status === 'AUTHENTICATED');
  return useQuery({
    queryKey,
    queryFn,
    enabled: isAuthenticated && enabled,
  });
}

export function useAdminUsers(params: { limit?: number; offset?: number; role?: AuthRole; email?: string }) {
  const query = {
    limit: params.limit ?? ADMIN_PAGE_SIZE,
    offset: params.offset ?? 0,
    role: params.role,
    email: params.email,
  };
  return useStaffQuery(adminQueryKeys.users(query), () => fetchAdminUsers(query));
}

export function useAdminUser(id: string | undefined) {
  return useStaffQuery(adminQueryKeys.user(id ?? ''), () => fetchAdminUser(id as string), Boolean(id));
}

export function useAdminSeniorByUserId(userId: string | undefined) {
  return useStaffQuery(
    ['admin', 'seniors', 'by-user', userId ?? ''] as const,
    () => fetchAdminSeniorByUserId(userId as string),
    Boolean(userId),
  );
}

export function useAdminFamilyByUserId(userId: string | undefined) {
  return useStaffQuery(
    ['admin', 'families', 'by-user', userId ?? ''] as const,
    () => fetchAdminFamilyByUserId(userId as string),
    Boolean(userId),
  );
}

export function useAdminCareManagerByUserId(userId: string | undefined) {
  return useStaffQuery(
    ['admin', 'careManagers', 'by-user', userId ?? ''] as const,
    () => fetchAdminCareManagerByUserId(userId as string),
    Boolean(userId),
  );
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminUserCreate) => createAdminUser(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useUpdateAdminUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminUserUpdate) => updateAdminUser(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useAdminSeniors(params: { limit?: number; offset?: number }) {
  const query = { limit: params.limit ?? ADMIN_PAGE_SIZE, offset: params.offset ?? 0 };
  return useStaffQuery(adminQueryKeys.seniors(query), () => fetchAdminSeniors(query));
}

export function useAdminSenior(id: string | undefined) {
  return useStaffQuery(adminQueryKeys.senior(id ?? ''), () => fetchAdminSenior(id as string), Boolean(id));
}

export function useCreateAdminSenior() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminSeniorCreate) => createAdminSenior(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'seniors'] });
    },
  });
}

export function useUpdateAdminSenior(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminSeniorUpdate) => updateAdminSenior(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'seniors'] });
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.senior(id) });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useAdminFamilies(params: { limit?: number; offset?: number }) {
  const query = { limit: params.limit ?? ADMIN_PAGE_SIZE, offset: params.offset ?? 0 };
  return useStaffQuery(adminQueryKeys.families(query), () => fetchAdminFamilies(query));
}

export function useAdminFamily(id: string | undefined) {
  return useStaffQuery(adminQueryKeys.family(id ?? ''), () => fetchAdminFamily(id as string), Boolean(id));
}

export function useCreateAdminFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      userId: string;
      firstName: string;
      lastName: string;
      relationship?: string;
      requestedSeniorReference?: string;
    }) => createAdminFamily(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'families'] });
    },
  });
}

export function useUpdateAdminFamily(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      firstName?: string;
      lastName?: string;
      relationship?: string;
      requestedSeniorReference?: string;
    }) => updateAdminFamily(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'families'] });
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.family(id) });
    },
  });
}

export function useAdminAccess(params: {
  limit?: number;
  offset?: number;
  familyId?: string;
  seniorId?: string;
  enabled?: boolean;
}) {
  const query = {
    limit: params.limit ?? ADMIN_PAGE_SIZE,
    offset: params.offset ?? 0,
    familyId: params.familyId,
    seniorId: params.seniorId,
  };
  return useStaffQuery(
    adminQueryKeys.access(query),
    () => fetchAdminAccess(query),
    params.enabled ?? true,
  );
}

export function useGrantAdminAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { familyId: string; seniorId: string }) => grantAdminAccess(input.familyId, input.seniorId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'access'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'families'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'seniors'] });
      await queryClient.invalidateQueries({ queryKey: ['family'] });
    },
  });
}

export function useRevokeAdminAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accessId: string) => revokeAdminAccess(accessId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'access'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'families'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'seniors'] });
      await queryClient.invalidateQueries({ queryKey: ['family'] });
    },
  });
}

export function useAdminCareManagers() {
  return useStaffQuery(adminQueryKeys.careManagers, fetchAdminCareManagers);
}

export function useAdminCareManager(id: string | undefined) {
  return useStaffQuery(adminQueryKeys.careManager(id ?? ''), () => fetchAdminCareManager(id as string), Boolean(id));
}

export function useCreateAdminCareManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminCareManagerCreate) => createAdminCareManager(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'careManagers'] });
    },
  });
}

export function useUpdateAdminCareManager(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminCareManagerUpdate) => updateAdminCareManager(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'careManagers'] });
    },
  });
}

export function useApproveAdminCareManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status?: string; employeeId?: string }) =>
      approveAdminCareManager(input.id, { status: input.status, employeeId: input.employeeId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'careManagers'] });
    },
  });
}

export function useAdminServices() {
  return useStaffQuery(adminQueryKeys.services, fetchAdminServices);
}

export function useCreateAdminService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; category: string; description: string }) => createAdminService(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.services });
    },
  });
}

export function useUpdateAdminService(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name?: string; category?: string; description?: string }) => updateAdminService(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.services });
    },
  });
}

export function useAdminServiceRequests(params: {
  limit?: number;
  offset?: number;
  status?: ServiceRequestStatus;
  seniorId?: string;
}) {
  const query = {
    limit: params.limit ?? ADMIN_PAGE_SIZE,
    offset: params.offset ?? 0,
    status: params.status,
    seniorId: params.seniorId,
  };
  return useStaffQuery(adminQueryKeys.serviceRequests(query), () => fetchAdminServiceRequests(query));
}

export function useUpdateAdminServiceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: ServiceRequestStatus }) => updateAdminServiceRequest(input.id, input.status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'serviceRequests'] });
    },
  });
}

export function useAdminVisits(params: {
  limit?: number;
  offset?: number;
  today?: boolean;
  upcoming?: boolean;
  seniorId?: string;
  careManagerId?: string;
  status?: VisitStatus;
}) {
  const query = {
    limit: params.limit ?? ADMIN_PAGE_SIZE,
    offset: params.offset ?? 0,
    today: params.today,
    upcoming: params.upcoming,
    seniorId: params.seniorId,
    careManagerId: params.careManagerId,
    status: params.status,
  };
  return useStaffQuery(adminQueryKeys.visits(query), () => fetchAdminVisits(query));
}

export function useAdminVisit(id: string | undefined) {
  return useStaffQuery(adminQueryKeys.visit(id ?? ''), () => fetchAdminVisitDetail(id as string), Boolean(id));
}

export function useAdminVisitTasks(id: string | undefined) {
  return useStaffQuery(adminQueryKeys.visitTasks(id ?? ''), () => fetchAdminVisitTasks(id as string), Boolean(id));
}

export function useAdminVisitReports(id: string | undefined) {
  return useStaffQuery(adminQueryKeys.visitReports(id ?? ''), () => fetchAdminVisitReports(id as string), Boolean(id));
}

export function useCreateAdminVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminVisit,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'visits'] });
    },
  });
}

export function useUpdateAdminVisit(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof updateAdminVisit>[1]) => updateAdminVisit(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'visits'] });
    },
  });
}

export function useAdminAppointments(params: {
  limit?: number;
  offset?: number;
  seniorId?: string;
  upcoming?: boolean;
  status?: AppointmentStatus;
}) {
  const query = {
    limit: params.limit ?? ADMIN_PAGE_SIZE,
    offset: params.offset ?? 0,
    seniorId: params.seniorId,
    upcoming: params.upcoming,
    status: params.status,
  };
  return useStaffQuery(adminQueryKeys.appointments(query), () => fetchAdminAppointments(query));
}

export function useAdminProviders() {
  return useStaffQuery(adminQueryKeys.providers, fetchAdminProviders);
}

export function useAdminMembershipPlans(params: { limit?: number; offset?: number } = {}) {
  const query = { limit: params.limit ?? ADMIN_PAGE_SIZE, offset: params.offset ?? 0 };
  return useStaffQuery(adminQueryKeys.membershipPlans(query), () => fetchAdminMembershipPlans(query));
}

export function useAdminMembershipBenefits(params: { limit?: number; offset?: number; planId?: string } = {}) {
  const query = { limit: params.limit ?? ADMIN_PAGE_SIZE, offset: params.offset ?? 0, planId: params.planId };
  return useStaffQuery(adminQueryKeys.membershipBenefits(query), () => fetchAdminMembershipBenefits(query));
}

export function useAdminMembershipRecords(params: { limit?: number; offset?: number; seniorId?: string } = {}) {
  const query = { limit: params.limit ?? ADMIN_PAGE_SIZE, offset: params.offset ?? 0, seniorId: params.seniorId };
  return useStaffQuery(adminQueryKeys.membershipRecords(query), () => fetchAdminMembershipRecords(query));
}

export function useAdminCurrentMembership(seniorId: string | undefined) {
  return useStaffQuery(
    adminQueryKeys.membershipCurrent(seniorId ?? ''),
    () => fetchAdminCurrentMembership(seniorId as string),
    Boolean(seniorId),
  );
}

export function useAdminMembershipUsage(seniorId: string | undefined) {
  return useStaffQuery(
    adminQueryKeys.membershipUsage(seniorId ?? ''),
    () => fetchAdminMembershipUsage(seniorId as string),
    Boolean(seniorId),
  );
}

export function useAdminEmergencies(params: { limit?: number; offset?: number; status?: EmergencyStatus; seniorId?: string }) {
  const query = {
    limit: params.limit ?? ADMIN_PAGE_SIZE,
    offset: params.offset ?? 0,
    status: params.status,
    seniorId: params.seniorId,
  };
  return useStaffQuery(adminQueryKeys.emergencies(query), () => fetchAdminEmergencies(query));
}

export function useAdminEmergency(id: string | undefined) {
  return useStaffQuery(adminQueryKeys.emergency(id ?? ''), () => fetchAdminEmergency(id as string), Boolean(id));
}

export function useAdminEmergencyEvents(id: string | undefined) {
  return useStaffQuery(adminQueryKeys.emergencyEvents(id ?? ''), () => fetchAdminEmergencyEvents(id as string), Boolean(id));
}

export function useUpdateAdminEmergency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: EmergencyStatus }) => updateAdminEmergencyStatus(input.id, input.status),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'emergencies'] });
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.emergency(variables.id) });
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.emergencyEvents(variables.id) });
    },
  });
}

export function useAdminNotifications(params: {
  limit?: number;
  offset?: number;
  userId?: string;
  priority?: NotificationPriority;
  isRead?: boolean;
}) {
  const query = {
    limit: params.limit ?? ADMIN_PAGE_SIZE,
    offset: params.offset ?? 0,
    userId: params.userId,
    priority: params.priority,
    isRead: params.isRead,
  };
  return useStaffQuery(adminQueryKeys.notifications(query), () => fetchAdminNotifications(query));
}

export function useAdminAuditLogs(params: { limit?: number; offset?: number }) {
  const query = { limit: params.limit ?? ADMIN_PAGE_SIZE, offset: params.offset ?? 0 };
  return useStaffQuery(adminQueryKeys.audit(query), () => fetchAdminAuditLogs(query));
}

export function useAdminMedicalRecords(seniorId: string | undefined) {
  return useStaffQuery(
    adminQueryKeys.healthRecords(seniorId ?? ''),
    () => fetchAdminMedicalRecords(seniorId as string),
    Boolean(seniorId),
  );
}
