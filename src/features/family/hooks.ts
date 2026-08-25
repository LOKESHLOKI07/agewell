import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import { fetchVisitDetail, fetchVisitReports, fetchVisitTasks } from '@/features/care/api';
import { careQueryKeys } from '@/features/care/queryKeys';
import type { VisitReport, VisitTask } from '@/features/care/types';
import type { EmergencyCase } from '@/features/emergency/types/emergency';
import type {
  Appointment,
  CurrentMembership,
  HealthDocument,
  HealthcareProvider,
  LabResult,
  ListPage,
  MedicalRecord,
  MedicationSchedule,
  MembershipUsage,
  Notification,
  SeniorProfile,
  ServiceRequest,
  Visit,
} from '@/features/home/types/home';
import {
  fetchFamilyAppointments,
  fetchFamilyEmergencyCases,
  fetchFamilyHealthDocuments,
  fetchFamilyLabResults,
  fetchFamilyMe,
  fetchFamilyMedicalRecords,
  fetchFamilyMedicationSchedules,
  fetchFamilyMembership,
  fetchFamilyMembershipUsage,
  fetchFamilyNotifications,
  fetchFamilyProviders,
  fetchFamilySeniors,
  fetchFamilyServiceRequests,
  fetchFamilyTodayVisits,
  fetchFamilyUpcomingVisits,
} from './api';
import { useFamilyStore } from './familyStore';
import { resolveSelectedSeniorId } from './mappers';
import { familyQueryKeys } from './queryKeys';
import { invalidateFamilySeniorQueries } from './selectors';
import type { FamilyMember } from './types';

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

export function useFamilyMe() {
  return useAuthedQuery<FamilyMember>(familyQueryKeys.me, fetchFamilyMe);
}

export function useFamilySeniors() {
  return useAuthedQuery<SeniorProfile[]>(familyQueryKeys.seniors, fetchFamilySeniors);
}

export function useFamilyScope() {
  const seniorsQuery = useFamilySeniors();
  const selectedSeniorId = useFamilyStore((state) => state.selectedSeniorId);
  const selectSenior = useFamilyStore((state) => state.selectSenior);
  const resolvedId = resolveSelectedSeniorId(seniorsQuery.data ?? [], selectedSeniorId);

  useEffect(() => {
    if (resolvedId !== selectedSeniorId) {
      selectSenior(resolvedId);
    }
  }, [resolvedId, selectedSeniorId, selectSenior]);

  const selectedSenior = seniorsQuery.data?.find((senior) => senior.id === resolvedId) ?? null;
  return {
    seniorsQuery,
    selectedSeniorId: resolvedId,
    selectedSenior,
  };
}

export function useSelectFamilySenior() {
  const queryClient = useQueryClient();
  const selectSenior = useFamilyStore((state) => state.selectSenior);
  return useMutation({
    mutationFn: async (seniorId: string) => {
      selectSenior(seniorId);
      queryClient.setQueryData(familyQueryKeys.selectedSenior, seniorId);
      return seniorId;
    },
    onSuccess: async () => {
      await invalidateFamilySeniorQueries();
    },
  });
}

export function useFamilyTodayVisits(seniorId: string | null) {
  return useAuthedQuery<ListPage<Visit>>(
    familyQueryKeys.visitsToday(seniorId ?? ''),
    () => fetchFamilyTodayVisits(seniorId as string),
    Boolean(seniorId),
  );
}

export function useFamilyUpcomingVisits(seniorId: string | null) {
  return useAuthedQuery<ListPage<Visit>>(
    familyQueryKeys.visitsUpcoming(seniorId ?? ''),
    () => fetchFamilyUpcomingVisits(seniorId as string),
    Boolean(seniorId),
  );
}

export function useFamilyAppointments(seniorId: string | null, upcoming = false) {
  return useAuthedQuery<ListPage<Appointment>>(
    [...familyQueryKeys.appointments(seniorId ?? ''), upcoming ? 'upcoming' : 'all'] as const,
    () => fetchFamilyAppointments(seniorId as string, upcoming),
    Boolean(seniorId),
  );
}

export function useFamilyMedicationSchedules(seniorId: string | null) {
  return useAuthedQuery<ListPage<MedicationSchedule>>(
    familyQueryKeys.medications(seniorId ?? ''),
    () => fetchFamilyMedicationSchedules(seniorId as string),
    Boolean(seniorId),
  );
}

export function useFamilyMedicalRecords(seniorId: string | null) {
  return useAuthedQuery<ListPage<MedicalRecord>>(
    familyQueryKeys.medicalRecords(seniorId ?? ''),
    () => fetchFamilyMedicalRecords(seniorId as string),
    Boolean(seniorId),
  );
}

export function useFamilyLabResults(seniorId: string | null) {
  return useAuthedQuery<ListPage<LabResult>>(
    familyQueryKeys.labResults(seniorId ?? ''),
    () => fetchFamilyLabResults(seniorId as string),
    Boolean(seniorId),
  );
}

export function useFamilyHealthDocuments(seniorId: string | null) {
  return useAuthedQuery<ListPage<HealthDocument>>(
    familyQueryKeys.documents(seniorId ?? ''),
    () => fetchFamilyHealthDocuments(seniorId as string),
    Boolean(seniorId),
  );
}

export function useFamilyProviders(seniorId: string | null) {
  return useAuthedQuery<ListPage<HealthcareProvider>>(
    familyQueryKeys.providers(seniorId ?? ''),
    () => fetchFamilyProviders(seniorId as string),
    Boolean(seniorId),
  );
}

export function useFamilyServiceRequests(seniorId: string | null) {
  return useAuthedQuery<ListPage<ServiceRequest>>(
    familyQueryKeys.serviceRequests(seniorId ?? ''),
    () => fetchFamilyServiceRequests(seniorId as string),
    Boolean(seniorId),
  );
}

export function useFamilyMembership(seniorId: string | null) {
  return useAuthedQuery<CurrentMembership>(
    familyQueryKeys.membership(seniorId ?? ''),
    () => fetchFamilyMembership(seniorId as string),
    Boolean(seniorId),
  );
}

export function useFamilyMembershipUsage(seniorId: string | null) {
  return useAuthedQuery<MembershipUsage[]>(
    familyQueryKeys.membershipUsage(seniorId ?? ''),
    () => fetchFamilyMembershipUsage(seniorId as string),
    Boolean(seniorId),
  );
}

export function useFamilyEmergencyCases(seniorId: string | null) {
  return useAuthedQuery<ListPage<EmergencyCase>>(
    familyQueryKeys.emergency(seniorId ?? ''),
    () => fetchFamilyEmergencyCases(seniorId as string),
    Boolean(seniorId),
  );
}

export function useFamilyNotifications() {
  return useAuthedQuery<ListPage<Notification>>(familyQueryKeys.notifications, fetchFamilyNotifications);
}

export function useFamilyVisitDetail(visitId: string | undefined) {
  return useAuthedQuery<Visit>(
    careQueryKeys.visitDetail(visitId ?? ''),
    () => fetchVisitDetail(visitId as string),
    Boolean(visitId),
  );
}

export function useFamilyVisitTasks(visitId: string | undefined) {
  return useAuthedQuery<VisitTask[]>(
    careQueryKeys.visitTasks(visitId ?? ''),
    () => fetchVisitTasks(visitId as string),
    Boolean(visitId),
  );
}

export function useFamilyVisitReports(visitId: string | undefined) {
  return useAuthedQuery<VisitReport[]>(
    careQueryKeys.visitReports(visitId ?? ''),
    () => fetchVisitReports(visitId as string),
    Boolean(visitId),
  );
}
