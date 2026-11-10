import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { LIVE_POLL_MS, liveQueryOptions } from '@/api/liveQuery';
import { useAuthStore } from '@/features/auth/authStore';
import type { AuthRole } from '@/features/auth/authTypes';
import type { EmergencyStatus } from '@/features/emergency/types/emergency';
import type { AppointmentStatus, NotificationPriority, ServiceRequestStatus, VisitStatus } from '@/features/home/types/home';
import type { MembershipRequestStatus } from '@/features/membership/membershipTypes';
import {
  assignAdminServiceRequest,
  autoAssignAdminServiceRequest,
  approveAdminCareManager,
  createAdminCareManager,
  provisionAdminStaff,
  createAdminSenior,
  createAdminService,
  createAdminUser,
  cancelAdminMembershipRecord,
  createAdminVisit,
  fetchAdminAppointments,
  fetchAdminAuditLogs,
  fetchAdminCareManager,
  fetchAdminCareManagerByUserId,
  fetchAdminCareManagers,
  fetchAdminCaseloadPreview,
  restoreAdminCaseload,
  transferAdminCaseload,
  fetchAdminCurrentMembership,
  fetchAdminEmergencies,
  fetchAdminEmergency,
  fetchAdminEmergencyEvents,
  fetchAdminMedicalRecords,
  fetchAdminMembershipBenefits,
  fetchAdminMembershipPlans,
  fetchAdminMembershipRecords,
  fetchAdminMembershipRequests,
  fetchAdminMembershipUsage,
  fetchAdminNotifications,
  fetchAdminProviders,
  fetchAdminSenior,
  fetchAdminSeniorByUserId,
  fetchAdminSeniors,
  fetchAdminServiceRequests,
  fetchAdminUnassignedServiceRequestCounts,
  fetchAdminServices,
  fetchAdminUser,
  fetchAdminUsers,
  fetchAdminVisitDetail,
  fetchAdminVisitReports,
  fetchAdminVisitTasks,
  fetchAdminVisits,
  reviewAdminMembershipRequest,
  updateAdminMembershipRequestStage,
  updateAdminCareManager,
  updateAdminEmergencyStatus,
  updateAdminSenior,
  updateAdminService,
  updateAdminServiceRequest,
  updateAdminUser,
  updateAdminVisit,
} from './api';
import { fetchCareActivities, updateCareActivity } from '@/features/membership/careManagerApi';
import type { CareActivityUpdate } from '@/features/membership/careManagerTypes';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';
import { adminQueryKeys } from './queryKeys';
import type {
  AdminCareManagerCreate,
  AdminCareManagerUpdate,
  AdminSeniorCreate,
  AdminSeniorUpdate,
  AdminStaffProvision,
  AdminUserCreate,
  AdminUserUpdate,
  CaseloadTransferMode,
} from './types';
import { ADMIN_PAGE_SIZE } from './types';

function useStaffQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  enabled = true,
  pollMs: number | false = false,
): UseQueryResult<T> {
  const isAuthenticated = useAuthStore((state) => state.status === 'AUTHENTICATED');
  return useQuery({
    queryKey,
    queryFn,
    enabled: isAuthenticated && enabled,
    ...(pollMs ? liveQueryOptions(pollMs) : null),
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

export function useAdminSeniors(params: {
  limit?: number;
  offset?: number;
  segment?: string;
  serviceCity?: string;
}) {
  const query = {
    limit: params.limit ?? ADMIN_PAGE_SIZE,
    offset: params.offset ?? 0,
    ...(params.segment ? { segment: params.segment } : {}),
    ...(params.serviceCity ? { serviceCity: params.serviceCity } : {}),
  };
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

export function useAdminCareManagers() {
  return useStaffQuery(adminQueryKeys.careManagers, fetchAdminCareManagers);
}

export function useAdminCareManager(id: string | undefined) {
  return useStaffQuery(adminQueryKeys.careManager(id ?? ''), () => fetchAdminCareManager(id as string), Boolean(id));
}

export function useAdminCareActivities(seniorId: string | undefined) {
  return useStaffQuery(
    adminQueryKeys.careActivities(seniorId ?? ''),
    () => fetchCareActivities(seniorId),
    Boolean(seniorId),
  );
}

export function useUpdateAdminCareActivity(seniorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string } & CareActivityUpdate) => {
      const { id, ...rest } = input;
      return updateCareActivity(id, rest);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.careActivities(seniorId) });
    },
  });
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

export function useProvisionAdminStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminStaffProvision) => provisionAdminStaff(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'careManagers'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
      ]);
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

export function useAdminCaseloadPreview(id: string | undefined) {
  return useStaffQuery(
    adminQueryKeys.caseload(id ?? ''),
    () => fetchAdminCaseloadPreview(id as string),
    Boolean(id),
  );
}

async function invalidateCaseloadQueries(queryClient: ReturnType<typeof useQueryClient>, staffId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['admin', 'careManagers'] }),
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.caseload(staffId) }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'seniors'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'visits'] }),
  ]);
}

export function useTransferAdminCaseload(staffId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      substituteId: string;
      mode: CaseloadTransferMode;
      transferVisits?: boolean;
    }) => transferAdminCaseload(staffId, input),
    onSuccess: async () => {
      await invalidateCaseloadQueries(queryClient, staffId);
    },
  });
}

/** Bulk assign from the Care Team list — From staff id is chosen at submit time. */
export function useBulkTransferAdminCaseload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      fromStaffId: string;
      substituteId: string;
      mode: CaseloadTransferMode;
      transferVisits?: boolean;
    }) =>
      transferAdminCaseload(input.fromStaffId, {
        substituteId: input.substituteId,
        mode: input.mode,
        transferVisits: input.transferVisits,
      }),
    onSuccess: async (_result, variables) => {
      await invalidateCaseloadQueries(queryClient, variables.fromStaffId);
      if (variables.substituteId !== variables.fromStaffId) {
        await queryClient.invalidateQueries({ queryKey: adminQueryKeys.caseload(variables.substituteId) });
      }
    },
  });
}

export function useRestoreAdminCaseload(staffId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => restoreAdminCaseload(staffId),
    onSuccess: async () => {
      await invalidateCaseloadQueries(queryClient, staffId);
    },
  });
}

/** Bulk restore from the Care Team list — original staff id is chosen at submit time. */
export function useBulkRestoreAdminCaseload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (staffId: string) => restoreAdminCaseload(staffId),
    onSuccess: async (_result, staffId) => {
      await invalidateCaseloadQueries(queryClient, staffId);
    },
  });
}

export function useAdminServices() {
  return useStaffQuery(adminQueryKeys.services, fetchAdminServices);
}

export function useCreateAdminService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      category: string;
      description: string;
      coverImage?: string | null;
    }) => createAdminService(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.services });
    },
  });
}

export function useUpdateAdminService(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name?: string;
      category?: string;
      description?: string;
      coverImage?: string | null;
      callHoursText?: string | null;
      supportPhone?: string | null;
    }) => updateAdminService(id, input),
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
  serviceSlug?: string;
}) {
  const query = {
    limit: params.limit ?? ADMIN_PAGE_SIZE,
    offset: params.offset ?? 0,
    status: params.status,
    seniorId: params.seniorId,
    serviceSlug: params.serviceSlug,
  };
  return useStaffQuery(
    adminQueryKeys.serviceRequests(query),
    () => fetchAdminServiceRequests(query),
    true,
    LIVE_POLL_MS.standard,
  );
}

export function useAdminUnassignedServiceRequestCounts() {
  return useStaffQuery(
    adminQueryKeys.serviceRequestUnassignedCounts,
    fetchAdminUnassignedServiceRequestCounts,
    true,
    LIVE_POLL_MS.standard,
  );
}

export function useUpdateAdminServiceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: ServiceRequestStatus; proofPhoto?: string | null }) =>
      updateAdminServiceRequest(input.id, input.status, input.proofPhoto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'serviceRequests'] });
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.serviceRequestUnassignedCounts });
    },
  });
}

export function useAssignAdminServiceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; careManagerIds: string[] }) =>
      assignAdminServiceRequest(input.id, input.careManagerIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'serviceRequests'] });
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.serviceRequestUnassignedCounts });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'visits'] });
      await queryClient.invalidateQueries({ queryKey: ['care', 'deliveries'] });
      await queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      await queryClient.invalidateQueries({ queryKey: ['care', 'serviceRequests'] });
    },
  });
}

export function useAutoAssignAdminServiceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => autoAssignAdminServiceRequest(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'serviceRequests'] });
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.serviceRequestUnassignedCounts });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'visits'] });
      await queryClient.invalidateQueries({ queryKey: ['care', 'deliveries'] });
      await queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      await queryClient.invalidateQueries({ queryKey: ['care', 'serviceRequests'] });
      await queryClient.invalidateQueries({ queryKey: ['care', 'dispatchQueue'] });
      await queryClient.invalidateQueries({ queryKey: ['care', 'visitsToday'] });
      await queryClient.invalidateQueries({ queryKey: ['care', 'visitsAll'] });
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

export function useAdminMembershipRequests(params: {
  limit?: number;
  offset?: number;
  status?: MembershipRequestStatus;
} = {}) {
  const query = { limit: params.limit ?? ADMIN_PAGE_SIZE, offset: params.offset ?? 0, status: params.status };
  return useStaffQuery(adminQueryKeys.membershipRequests(query), () => fetchAdminMembershipRequests(query));
}

export function useReviewAdminMembershipRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: Extract<MembershipRequestStatus, 'APPROVED' | 'REJECTED'> }) =>
      reviewAdminMembershipRequest(input.id, input.status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'memberships'] });
    },
  });
}

export function useUpdateAdminMembershipRequestStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      stage?: string;
      visitScheduledStart?: string;
      visitScheduledEnd?: string;
      careManagerId?: string | null;
      companionId?: string | null;
      clearCareManager?: boolean;
      clearCompanion?: boolean;
    }) => updateAdminMembershipRequestStage(input.id, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'memberships'] }),
        queryClient.invalidateQueries({ queryKey: ['membership', 'requests'] }),
        queryClient.invalidateQueries({ queryKey: homeQueryKeys.membershipCurrent }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'seniors'] }),
      ]);
    },
  });
}

export function useCancelAdminMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelAdminMembershipRecord(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.memberships }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'seniors'] }),
        queryClient.invalidateQueries({ queryKey: homeQueryKeys.membershipCurrent }),
        queryClient.invalidateQueries({ queryKey: homeQueryKeys.membershipUsage }),
      ]);
    },
  });
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
  return useStaffQuery(
    adminQueryKeys.emergencies(query),
    () => fetchAdminEmergencies(query),
    true,
    LIVE_POLL_MS.urgent,
  );
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
  return useStaffQuery(
    adminQueryKeys.notifications(query),
    () => fetchAdminNotifications(query),
    true,
    LIVE_POLL_MS.standard,
  );
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
