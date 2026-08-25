import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';
import { toAppointment, toListPage, toVisit } from '@/features/home/api/mappers';
import type { Appointment, ListPage, Visit } from '@/features/home/types/home';
import { firstCareManager, toCareManagerProfileList, toVisitReportList, toVisitTaskList } from './mappers';
import type { CareManagerProfile, VisitReport, VisitTask } from './types';

async function getMapped<T>(path: string, map: (data: unknown) => T, params?: Record<string, unknown>): Promise<T> {
  try {
    const response = await apiClient.get(path, { params });
    return map(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export function fetchCareManagerProfile(): Promise<CareManagerProfile | null> {
  return getMapped('/care/', (data) => firstCareManager(toCareManagerProfileList(data)));
}

export function fetchCareManagerTodayVisits(): Promise<ListPage<Visit>> {
  return getMapped('/visits/', (data) => toListPage(data, toVisit, 'visits'), { today: true });
}

export function fetchCareManagerUpcomingVisits(): Promise<ListPage<Visit>> {
  return getMapped('/visits/', (data) => toListPage(data, toVisit, 'visits'), { upcoming: true });
}

export function fetchVisitDetail(visitId: string): Promise<Visit> {
  return getMapped(`/visits/${visitId}`, toVisit);
}

export function fetchVisitTasks(visitId: string): Promise<VisitTask[]> {
  return getMapped(`/visits/${visitId}/tasks`, toVisitTaskList);
}

export function fetchVisitReports(visitId: string): Promise<VisitReport[]> {
  return getMapped(`/visits/${visitId}/reports`, toVisitReportList);
}

export function fetchCareManagerAppointments(): Promise<ListPage<Appointment>> {
  return getMapped('/appointments/', (data) => toListPage(data, toAppointment, 'appointments'));
}
