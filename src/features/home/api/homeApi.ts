import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';
import {
  toAppointment,
  toCatalogServices,
  toCurrentMembership,
  toListPage,
  toMedication,
  toMembershipUsageList,
  toSeniorProfile,
  toServiceRequest,
  toVisit,
} from './mappers';
import type {
  Appointment,
  CatalogService,
  CurrentMembership,
  ListPage,
  Medication,
  MembershipUsage,
  SeniorProfile,
  ServiceRequest,
  Visit,
} from '../types/home';
import { fetchUnreadNotifications } from '@/features/notifications/api';

export { fetchUnreadNotifications };

async function getMapped<T>(path: string, map: (data: unknown) => T, params?: Record<string, unknown>): Promise<T> {
  try {
    const response = await apiClient.get(path, { params });
    return map(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export function fetchSeniorMe(): Promise<SeniorProfile> {
  return getMapped('/seniors/me', toSeniorProfile);
}

export function fetchTodayVisits(): Promise<ListPage<Visit>> {
  return getMapped('/visits/', (data) => toListPage(data, toVisit, 'visits'), { today: true });
}

export function fetchUpcomingVisits(): Promise<ListPage<Visit>> {
  return getMapped('/visits/', (data) => toListPage(data, toVisit, 'visits'), { upcoming: true });
}

export function fetchMyVisits(): Promise<ListPage<Visit>> {
  return getMapped('/visits/', (data) => toListPage(data, toVisit, 'visits'));
}

export function fetchUpcomingAppointments(): Promise<ListPage<Appointment>> {
  return getMapped('/appointments/', (data) => toListPage(data, toAppointment, 'appointments'), {
    upcoming: true,
  });
}

export function fetchMedications(): Promise<ListPage<Medication>> {
  return getMapped('/healthcare/medications', (data) => toListPage(data, toMedication, 'medications'));
}

export function fetchServiceRequests(): Promise<ListPage<ServiceRequest>> {
  return getMapped('/services/requests', (data) => toListPage(data, toServiceRequest, 'service requests'));
}

export function fetchServices(): Promise<CatalogService[]> {
  return getMapped('/services/', toCatalogServices);
}

export function fetchCurrentMembership(): Promise<CurrentMembership> {
  return getMapped('/memberships/current', toCurrentMembership);
}

export function fetchMembershipUsage(): Promise<MembershipUsage[]> {
  return getMapped('/memberships/current/usage', toMembershipUsageList);
}

