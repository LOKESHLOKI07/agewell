import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import type { Appointment, ListPage, Visit } from '@/features/home/types/home';
import {
  fetchCareManagerAppointments,
  fetchCareManagerProfile,
  fetchCareManagerTodayVisits,
  fetchCareManagerUpcomingVisits,
  fetchVisitDetail,
  fetchVisitReports,
  fetchVisitTasks,
} from './api';
import { careQueryKeys } from './queryKeys';
import type { CareManagerProfile, VisitReport, VisitTask } from './types';

function useAuthedQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  enabled = true,
): UseQueryResult<T> {
  const isAuthenticated = useAuthStore((state) => state.status === 'AUTHENTICATED');
  return useQuery({
    queryKey,
    queryFn,
    enabled: isAuthenticated && enabled,
  });
}

export function useCareManagerProfile() {
  return useAuthedQuery<CareManagerProfile | null>(careQueryKeys.profile, fetchCareManagerProfile);
}

export function useCareManagerTodayVisits() {
  return useAuthedQuery<ListPage<Visit>>(careQueryKeys.visitsToday, fetchCareManagerTodayVisits);
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
