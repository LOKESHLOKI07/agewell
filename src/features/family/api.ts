import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';
import { toEmergencyCase } from '@/features/emergency/mappers';
import type { EmergencyCase } from '@/features/emergency/types/emergency';
import {
  toAppointment,
  toCurrentMembership,
  toHealthDocument,
  toHealthcareProvider,
  toLabResult,
  toListPage,
  toMedicalRecord,
  toMedicationSchedule,
  toMembershipUsageList,
  toServiceRequest,
  toVisit,
} from '@/features/home/api/mappers';
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
  SeniorProfile,
  ServiceRequest,
  Visit,
} from '@/features/home/types/home';
import { fetchNotifications, fetchUnreadNotifications } from '@/features/notifications/api';
import { toFamilyMember, toFamilySeniors } from './mappers';
import { familySeniorScopeParams } from './queryKeys';
import type { FamilyMember } from './types';

async function getMapped<T>(path: string, map: (data: unknown) => T, params?: Record<string, unknown>): Promise<T> {
  try {
    const response = await apiClient.get(path, { params });
    return map(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export { fetchNotifications as fetchFamilyNotifications, fetchUnreadNotifications as fetchFamilyUnreadNotifications };

export function fetchFamilyMe(): Promise<FamilyMember> {
  return getMapped('/families/me', toFamilyMember);
}

export function fetchFamilySeniors(): Promise<SeniorProfile[]> {
  return getMapped('/families/seniors', toFamilySeniors);
}

export function fetchFamilyTodayVisits(seniorId: string): Promise<ListPage<Visit>> {
  return getMapped('/visits/', (data) => toListPage(data, toVisit, 'visits'), {
    ...familySeniorScopeParams(seniorId),
    today: true,
  });
}

export function fetchFamilyUpcomingVisits(seniorId: string): Promise<ListPage<Visit>> {
  return getMapped('/visits/', (data) => toListPage(data, toVisit, 'visits'), {
    ...familySeniorScopeParams(seniorId),
    upcoming: true,
  });
}

export function fetchFamilyAppointments(seniorId: string, upcoming = false): Promise<ListPage<Appointment>> {
  return getMapped('/appointments/', (data) => toListPage(data, toAppointment, 'appointments'), {
    ...familySeniorScopeParams(seniorId),
    ...(upcoming ? { upcoming: true } : {}),
  });
}

export function fetchFamilyMedicationSchedules(seniorId: string): Promise<ListPage<MedicationSchedule>> {
  return getMapped('/healthcare/medication-schedules', (data) => toListPage(data, toMedicationSchedule, 'medication schedules'), {
    ...familySeniorScopeParams(seniorId),
  });
}

export function fetchFamilyMedicalRecords(seniorId: string): Promise<ListPage<MedicalRecord>> {
  return getMapped('/healthcare/medical-records', (data) => toListPage(data, toMedicalRecord, 'medical records'), {
    ...familySeniorScopeParams(seniorId),
  });
}

export function fetchFamilyLabResults(seniorId: string): Promise<ListPage<LabResult>> {
  return getMapped('/healthcare/lab-results', (data) => toListPage(data, toLabResult, 'lab results'), {
    ...familySeniorScopeParams(seniorId),
  });
}

export function fetchFamilyHealthDocuments(seniorId: string): Promise<ListPage<HealthDocument>> {
  return getMapped('/healthcare/documents', (data) => toListPage(data, toHealthDocument, 'health documents'), {
    ...familySeniorScopeParams(seniorId),
  });
}

export function fetchFamilyProviders(seniorId: string): Promise<ListPage<HealthcareProvider>> {
  return getMapped('/healthcare/providers', (data) => toListPage(data, toHealthcareProvider, 'providers'), {
    ...familySeniorScopeParams(seniorId),
  });
}

export function fetchFamilyServiceRequests(seniorId: string): Promise<ListPage<ServiceRequest>> {
  return getMapped('/services/requests', (data) => toListPage(data, toServiceRequest, 'service requests'), {
    ...familySeniorScopeParams(seniorId),
  });
}

export function fetchFamilyMembership(seniorId: string): Promise<CurrentMembership> {
  return getMapped('/memberships/current', toCurrentMembership, familySeniorScopeParams(seniorId));
}

export function fetchFamilyMembershipUsage(seniorId: string): Promise<MembershipUsage[]> {
  return getMapped('/memberships/current/usage', toMembershipUsageList, familySeniorScopeParams(seniorId));
}

export function fetchFamilyEmergencyCases(seniorId: string): Promise<ListPage<EmergencyCase>> {
  return getMapped('/emergency/', (data) => toListPage(data, toEmergencyCase, 'emergency cases'), {
    ...familySeniorScopeParams(seniorId),
  });
}
