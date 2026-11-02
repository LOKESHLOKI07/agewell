import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { LIVE_POLL_MS, liveQueryOptions } from '@/api/liveQuery';
import { useAuthStore } from '@/features/auth/authStore';
import type {
  Appointment,
  ListPage,
  ServiceRequest,
  ServiceRequestStatus,
  Visit,
  VisitStatus,
} from '@/features/home/types/home';
import type { EmergencyCase } from '@/features/emergency/types/emergency';
import { emergencyQueryKeys } from '@/features/emergency/queryKeys';
import { acknowledgeEmergency } from '@/features/emergency/api/emergencyApi';
import {
  assignCareServiceCompanion,
  assignCareServiceRequest,
  assignVisitServiceCompanion,
  autoAssignCareServiceRequest,
  checkIn,
  checkOut,
  createVisitReport,
  fetchAssignableCareStaff,
  fetchAttendanceToday,
  fetchCareDispatchQueue,
  fetchCareManagerAppointments,
  fetchCareManagerProfile,
  fetchCareManagerTodayVisits,
  fetchCareManagerUpcomingVisits,
  fetchCareManagerVisits,
  fetchCareServiceRequests,
  fetchCareUnassignedServiceRequestCounts,
  fetchDeliveries,
  fetchDeliveryDetail,
  fetchStaffEmergencies,
  fetchTrainingHome,
  fetchVisitDetail,
  fetchVisitReports,
  fetchVisitTasks,
  takeCareServiceRequest,
  updateDeliveryStatus,
  updateVisitStatus,
  updateVisitTask,
} from './api';
import { careQueryKeys } from './queryKeys';
import type {
  AttendanceRecord,
  CareManagerProfile,
  Delivery,
  DeliveryStatus,
  TrainingHome,
  VisitReport,
  VisitTask,
} from './types';

function useAuthedQuery<T>(
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

export function useCareManagerProfile() {
  return useAuthedQuery<CareManagerProfile | null>(careQueryKeys.profile, fetchCareManagerProfile);
}

export function useCareManagerTodayVisits() {
  return useAuthedQuery<ListPage<Visit>>(
    careQueryKeys.visitsToday,
    fetchCareManagerTodayVisits,
    true,
    LIVE_POLL_MS.relaxed,
  );
}

export function useCareManagerVisits() {
  return useAuthedQuery<ListPage<Visit>>(careQueryKeys.visitsAll, fetchCareManagerVisits);
}

export function useCareManagerUpcomingVisits() {
  return useAuthedQuery<ListPage<Visit>>(careQueryKeys.visitsUpcoming, fetchCareManagerUpcomingVisits);
}

export function useVisitDetail(visitId: string | undefined) {
  return useAuthedQuery<Visit>(
    careQueryKeys.visitDetail(visitId ?? ''),
    () => fetchVisitDetail(visitId as string),
    Boolean(visitId),
  );
}

export function useVisitTasks(visitId: string | undefined) {
  return useAuthedQuery<VisitTask[]>(
    careQueryKeys.visitTasks(visitId ?? ''),
    () => fetchVisitTasks(visitId as string),
    Boolean(visitId),
  );
}

export function useVisitReports(visitId: string | undefined) {
  return useAuthedQuery<VisitReport[]>(
    careQueryKeys.visitReports(visitId ?? ''),
    () => fetchVisitReports(visitId as string),
    Boolean(visitId),
  );
}

export function useCareManagerAppointments() {
  return useAuthedQuery<ListPage<Appointment>>(careQueryKeys.appointments, fetchCareManagerAppointments);
}

export function useAttendanceToday() {
  return useAuthedQuery<AttendanceRecord | null>(careQueryKeys.attendanceToday, fetchAttendanceToday);
}

export function useDeliveries() {
  return useAuthedQuery<ListPage<Delivery>>(
    careQueryKeys.deliveries,
    () => fetchDeliveries(),
    true,
    LIVE_POLL_MS.relaxed,
  );
}

export function useDeliveryDetail(deliveryId: string | undefined) {
  return useAuthedQuery<Delivery>(
    careQueryKeys.deliveryDetail(deliveryId ?? ''),
    () => fetchDeliveryDetail(deliveryId as string),
    Boolean(deliveryId),
  );
}

export function useTrainingHome() {
  return useAuthedQuery<TrainingHome>(careQueryKeys.training, fetchTrainingHome);
}

export function useStaffEmergencies() {
  return useAuthedQuery<EmergencyCase[]>(
    careQueryKeys.staffEmergencies,
    () => fetchStaffEmergencies(),
    true,
    LIVE_POLL_MS.urgent,
  );
}

function invalidateVisitQueries(queryClient: ReturnType<typeof useQueryClient>, visitId?: string) {
  void queryClient.invalidateQueries({ queryKey: careQueryKeys.visitsToday });
  void queryClient.invalidateQueries({ queryKey: careQueryKeys.visitsUpcoming });
  if (visitId) {
    void queryClient.invalidateQueries({ queryKey: careQueryKeys.visitDetail(visitId) });
    void queryClient.invalidateQueries({ queryKey: careQueryKeys.visitTasks(visitId) });
    void queryClient.invalidateQueries({ queryKey: careQueryKeys.visitReports(visitId) });
  }
}

export function useUpdateVisitStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      visitId,
      status,
      notes,
      proofPhoto,
    }: {
      visitId: string;
      status: VisitStatus;
      notes?: string | null;
      proofPhoto?: string | null;
    }) => updateVisitStatus(visitId, status, notes, proofPhoto),
    onSuccess: (_data, variables) => {
      invalidateVisitQueries(queryClient, variables.visitId);
    },
  });
}

export function useUpdateVisitTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      visitId,
      taskId,
      isCompleted,
    }: {
      visitId: string;
      taskId: string;
      isCompleted: boolean;
    }) => updateVisitTask(visitId, taskId, isCompleted),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: careQueryKeys.visitTasks(variables.visitId) });
    },
  });
}

export function useCreateVisitReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      visitId,
      summary,
      issuesNoted,
      proofPhoto,
    }: {
      visitId: string;
      summary?: string | null;
      issuesNoted?: string | null;
      proofPhoto?: string | null;
    }) => createVisitReport(visitId, { summary, issuesNoted, proofPhoto }),
    onSuccess: (_data, variables) => {
      invalidateVisitQueries(queryClient, variables.visitId);
    },
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (location?: string | null) => checkIn(location),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: careQueryKeys.attendanceToday });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (location?: string | null) => checkOut(location),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: careQueryKeys.attendanceToday });
    },
  });
}

export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      deliveryId,
      status,
      proofPhoto,
    }: {
      deliveryId: string;
      status: DeliveryStatus;
      proofPhoto?: string | null;
    }) => updateDeliveryStatus(deliveryId, status, { proofPhoto }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: careQueryKeys.deliveries });
    },
  });
}

export function useRespondEmergency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ emergencyId }: { emergencyId: string; status?: string }) => acknowledgeEmergency(emergencyId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: careQueryKeys.staffEmergencies });
      void queryClient.invalidateQueries({ queryKey: emergencyQueryKeys.list });
      void queryClient.invalidateQueries({ queryKey: emergencyQueryKeys.detail(variables.emergencyId) });
    },
  });
}

export function useAssignableCareStaff(enabled = true) {
  return useAuthedQuery<CareManagerProfile[]>(
    careQueryKeys.assignableStaff,
    fetchAssignableCareStaff,
    enabled,
  );
}

export function useCareServiceRequests(
  params: {
    limit?: number;
    offset?: number;
    status?: ServiceRequestStatus;
    serviceSlug?: string;
  } = {},
  enabled = true,
) {
  const query = {
    limit: params.limit ?? 50,
    offset: params.offset ?? 0,
    status: params.status,
    serviceSlug: params.serviceSlug,
  };
  return useAuthedQuery<ListPage<ServiceRequest>>(
    careQueryKeys.serviceRequests(query),
    () => fetchCareServiceRequests(query),
    enabled,
    LIVE_POLL_MS.standard,
  );
}

export function useCareUnassignedServiceRequestCounts(enabled = true) {
  return useAuthedQuery<Record<string, number>>(
    careQueryKeys.serviceRequestUnassignedCounts,
    fetchCareUnassignedServiceRequestCounts,
    enabled,
    LIVE_POLL_MS.standard,
  );
}

export function useAssignCareServiceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; careManagerIds: string[] }) =>
      assignCareServiceRequest(input.id, input.careManagerIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['care', 'serviceRequests'] });
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.serviceRequestUnassignedCounts });
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.dispatchQueue });
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.visitsAll });
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.visitsToday });
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.deliveries });
    },
  });
}

export function useAutoAssignCareServiceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => autoAssignCareServiceRequest(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['care', 'serviceRequests'] });
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.serviceRequestUnassignedCounts });
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.dispatchQueue });
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.visitsAll });
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.visitsToday });
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.deliveries });
    },
  });
}

export function useCareDispatchQueue(enabled = true) {
  return useAuthedQuery<ListPage<ServiceRequest>>(
    careQueryKeys.dispatchQueue,
    fetchCareDispatchQueue,
    enabled,
    LIVE_POLL_MS.standard,
  );
}

export function useTakeCareServiceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => takeCareServiceRequest(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.dispatchQueue });
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.visitsToday });
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.visitsAll });
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.deliveries });
    },
  });
}

export function useAssignCareServiceCompanion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; serviceCompanionId: string }) =>
      assignCareServiceCompanion(input.id, input.serviceCompanionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.dispatchQueue });
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.deliveries });
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.visitsToday });
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.visitsAll });
    },
  });
}

export function useAssignVisitServiceCompanion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { visitId: string; serviceCompanionId: string }) =>
      assignVisitServiceCompanion(input.visitId, input.serviceCompanionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.dispatchQueue });
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.deliveries });
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.visitsToday });
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.visitsAll });
    },
  });
}
