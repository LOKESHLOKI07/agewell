import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import {
  fetchAppointments,
  fetchHealthDocuments,
  fetchHealthMedications,
  fetchHealthcareProviders,
  fetchLabResults,
  fetchMedicalRecords,
  fetchMedicationSchedules,
} from './api';
import { healthQueryKeys } from './queryKeys';
import type {
  Appointment,
  HealthDocument,
  HealthcareProvider,
  LabResult,
  ListPage,
  MedicalRecord,
  Medication,
  MedicationSchedule,
} from '@/features/home/types/home';

function useAuthedQuery<T>(queryKey: readonly unknown[], queryFn: () => Promise<T>): UseQueryResult<T> {
  const isAuthenticated = useAuthStore((state) => state.status === 'AUTHENTICATED');
  return useQuery({
    queryKey,
    queryFn,
    enabled: isAuthenticated,
  });
}

export function useMedications() {
  return useAuthedQuery<ListPage<Medication>>(healthQueryKeys.medications, fetchHealthMedications);
}

export function useMedicationSchedules() {
  return useAuthedQuery<ListPage<MedicationSchedule>>(
    healthQueryKeys.medicationSchedules,
    fetchMedicationSchedules,
  );
}

export function useMedicalRecords() {
  return useAuthedQuery<ListPage<MedicalRecord>>(healthQueryKeys.medicalRecords, fetchMedicalRecords);
}

export function useLabResults() {
  return useAuthedQuery<ListPage<LabResult>>(healthQueryKeys.labResults, fetchLabResults);
}

export function useHealthDocuments() {
  return useAuthedQuery<ListPage<HealthDocument>>(healthQueryKeys.documents, fetchHealthDocuments);
}

export function useHealthcareProviders() {
  return useAuthedQuery<ListPage<HealthcareProvider>>(healthQueryKeys.providers, fetchHealthcareProviders);
}

export function useAppointments() {
  return useAuthedQuery<ListPage<Appointment>>(healthQueryKeys.appointments, fetchAppointments);
}
