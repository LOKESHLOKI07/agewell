import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';
import {
  toAppointment,
  toHealthDocument,
  toHealthcareProvider,
  toLabResult,
  toListPage,
  toMedicalRecord,
  toMedication,
  toMedicationSchedule,
} from '@/features/home/api/mappers';
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

async function getMapped<T>(path: string, map: (data: unknown) => T, params?: Record<string, unknown>): Promise<T> {
  try {
    const response = await apiClient.get(path, { params });
    return map(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export function fetchHealthMedications(): Promise<ListPage<Medication>> {
  return getMapped('/healthcare/medications', (data) => toListPage(data, toMedication, 'medications'));
}

export function fetchMedicationSchedules(): Promise<ListPage<MedicationSchedule>> {
  return getMapped('/healthcare/medication-schedules', (data) =>
    toListPage(data, toMedicationSchedule, 'medication schedules'),
  );
}

export function fetchMedicalRecords(): Promise<ListPage<MedicalRecord>> {
  return getMapped('/healthcare/medical-records', (data) => toListPage(data, toMedicalRecord, 'medical records'));
}

export function fetchLabResults(): Promise<ListPage<LabResult>> {
  return getMapped('/healthcare/lab-results', (data) => toListPage(data, toLabResult, 'lab results'));
}

export function fetchHealthDocuments(): Promise<ListPage<HealthDocument>> {
  return getMapped('/healthcare/documents', (data) => toListPage(data, toHealthDocument, 'health documents'));
}

export function fetchHealthcareProviders(): Promise<ListPage<HealthcareProvider>> {
  return getMapped('/healthcare/providers', (data) => toListPage(data, toHealthcareProvider, 'providers'));
}

export function fetchAppointments(): Promise<ListPage<Appointment>> {
  return getMapped('/appointments/', (data) => toListPage(data, toAppointment, 'appointments'));
}
