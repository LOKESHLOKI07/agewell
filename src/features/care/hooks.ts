import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import type { Appointment, ListPage, Visit, VisitStatus } from '@/features/home/types/home';
import type { EmergencyCase } from '@/features/emergency/types/emergency';
import { emergencyQueryKeys } from '@/features/emergency/queryKeys';
import { acknowledgeEmergency } from '@/features/emergency/api/emergencyApi';
import {
  checkIn,
  checkOut,
  createVisitReport,
  fetchAttendanceToday,
  fetchCareManagerAppointments,
  fetchCareManagerProfile,
  fetchCareManagerTodayVisits,
  fetchCareManagerUpcomingVisits,
  fetchCareManagerVisits,
  fetchDeliveries,
  fetchDeliveryDetail,
  fetchStaffEmergencies,
  fetchTrainingHome,
  fetchVisitDetail,
  fetchVisitReports,
  fetchVisitTasks,
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
  refetchInterval: number | false = false,
): UseQueryResult<T> {
  const isAuthenticated = useAuthStore((state) => state.status === 'AUTHENTICATED');
  return useQuery({
    queryKey,
    queryFn,
    enabled: isAuthenticated && enabled,
    refetchInterval,
  });
}

export function useCareManagerProfile() {
  return useAuthedQuery<CareManagerProfile | null>(careQueryKeys.profile, fetchCareManagerProfile);
}

export function useCareManagerTodayVisits() {
  return useAuthedQuery<ListPage<Visit>>(careQueryKeys.visitsToday, fetchCareManagerTodayVisits);
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
  return useAuthedQuery<ListPage<Delivery>>(careQueryKeys.deliveries, () => fetchDeliveries());
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
  return useAuthedQuery<EmergencyCase[]>(careQueryKeys.staffEmergencies, () => fetchStaffEmergencies(), true, 4000);
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
    mutationFn: ({ visitId, status, notes }: { visitId: string; status: VisitStatus; notes?: string | null }) =>
      updateVisitStatus(visitId, status, notes),
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
    }: {
      visitId: string;
      summary?: string | null;
      issuesNoted?: string | null;
    }) => createVisitReport(visitId, { summary, issuesNoted }),
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
    mutationFn: ({ deliveryId, status }: { deliveryId: string; status: DeliveryStatus }) =>
      updateDeliveryStatus(deliveryId, status),
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
