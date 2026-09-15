import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';
import { toAppointment, toListPage, toVisit } from '@/features/home/api/mappers';
import type { Appointment, ListPage, Visit, VisitStatus } from '@/features/home/types/home';
import { toEmergencyCase } from '@/features/emergency/mappers';
import type { EmergencyCase, EmergencyStatus } from '@/features/emergency/types/emergency';
import {
  firstCareManager,
  toAttendanceRecord,
  toCareManagerProfileList,
  toDelivery,
  toTrainingHome,
  toVisitReport,
  toVisitReportList,
  toVisitTask,
  toVisitTaskList,
} from './mappers';
import type {
  AttendanceRecord,
  CareManagerProfile,
  Delivery,
  DeliveryStatus,
  TrainingHome,
  VisitReport,
  VisitTask,
} from './types';

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

export function fetchCareManagerVisits(): Promise<ListPage<Visit>> {
  return getMapped('/visits/', (data) => toListPage(data, toVisit, 'visits'));
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

export async function updateVisitStatus(visitId: string, status: VisitStatus, notes?: string | null): Promise<Visit> {
  try {
    const body: Record<string, unknown> = { status };
    if (notes !== undefined) {
      body.notes = notes;
    }
    const response = await apiClient.patch(`/visits/${visitId}`, body);
    return toVisit(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function updateVisitTask(
  visitId: string,
  taskId: string,
  isCompleted: boolean,
): Promise<VisitTask> {
  try {
    const response = await apiClient.patch(`/visits/${visitId}/tasks/${taskId}`, { is_completed: isCompleted });
    return toVisitTask(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function createVisitReport(
  visitId: string,
  input: { summary?: string | null; issuesNoted?: string | null },
): Promise<VisitReport> {
  try {
    const response = await apiClient.post(`/visits/${visitId}/reports`, {
      summary: input.summary ?? null,
      issues_noted: input.issuesNoted ?? null,
    });
    return toVisitReport(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export function fetchAttendanceToday(): Promise<AttendanceRecord | null> {
  return getMapped('/attendance/today', toAttendanceRecord);
}

export async function checkIn(location?: string | null): Promise<AttendanceRecord> {
  try {
    const response = await apiClient.post('/attendance/check-in', { location: location ?? null });
    const record = toAttendanceRecord(response.data);
    if (!record) {
      throw new Error('Invalid attendance');
    }
    return record;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function checkOut(location?: string | null): Promise<AttendanceRecord> {
  try {
    const response = await apiClient.post('/attendance/check-out', { location: location ?? null });
    const record = toAttendanceRecord(response.data);
    if (!record) {
      throw new Error('Invalid attendance');
    }
    return record;
  } catch (error) {
    throw toApiError(error);
  }
}

export function fetchDeliveries(params?: { status?: DeliveryStatus; today?: boolean }): Promise<ListPage<Delivery>> {
  return getMapped('/deliveries/', (data) => toListPage(data, toDelivery, 'deliveries'), {
    ...(params?.status ? { status: params.status } : {}),
    ...(params?.today ? { today: true } : {}),
  });
}

export function fetchDeliveryDetail(deliveryId: string): Promise<Delivery> {
  return getMapped(`/deliveries/${deliveryId}`, toDelivery);
}

export async function updateDeliveryStatus(deliveryId: string, status: DeliveryStatus): Promise<Delivery> {
  try {
    const response = await apiClient.patch(`/deliveries/${deliveryId}`, { status });
    return toDelivery(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export function fetchTrainingHome(): Promise<TrainingHome> {
  return getMapped('/training/', toTrainingHome);
}

export async function fetchStaffEmergencies(
  statuses: EmergencyStatus[] = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'],
): Promise<EmergencyCase[]> {
  try {
    const pages = await Promise.all(
      statuses.map(async (status) => {
        const response = await apiClient.get('/emergency/', { params: { status } });
        return toListPage(response.data, toEmergencyCase, 'emergency cases').items;
      }),
    );
    const seen = new Set<string>();
    const items: EmergencyCase[] = [];
    for (const page of pages) {
      for (const item of page) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          items.push(item);
        }
      }
    }
    return items.sort((a, b) => {
      const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
      return bTime - aTime;
    });
  } catch (error) {
    throw toApiError(error);
  }
}

export async function respondEmergency(emergencyId: string, status: EmergencyStatus): Promise<EmergencyCase> {
  try {
    const response = await apiClient.patch(`/emergency/${emergencyId}`, { status });
    return toEmergencyCase(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}
