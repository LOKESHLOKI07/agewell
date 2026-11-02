import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';
import { toAppointment, toListPage, toServiceRequest, toVisit } from '@/features/home/api/mappers';
import type {
  Appointment,
  ListPage,
  ServiceRequest,
  ServiceRequestStatus,
  Visit,
  VisitStatus,
} from '@/features/home/types/home';
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

async function sendMapped<T>(
  method: 'post' | 'patch',
  path: string,
  map: (data: unknown) => T,
  body?: unknown,
): Promise<T> {
  try {
    const response = await apiClient.request({ method, url: path, data: body });
    return map(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export function fetchCareManagerProfile(): Promise<CareManagerProfile | null> {
  return getMapped('/care/', (data) => firstCareManager(toCareManagerProfileList(data)));
}

export function fetchAssignableCareStaff(): Promise<CareManagerProfile[]> {
  return getMapped('/care/', toCareManagerProfileList, { for_assign: true });
}

export function fetchCareServiceRequests(params: {
  limit?: number;
  offset?: number;
  status?: ServiceRequestStatus;
  serviceSlug?: string;
}): Promise<ListPage<ServiceRequest>> {
  return getMapped('/services/requests', (data) => toListPage(data, toServiceRequest, 'service requests'), {
    limit: params.limit ?? 50,
    offset: params.offset ?? 0,
    ...(params.status ? { status: params.status } : {}),
    ...(params.serviceSlug ? { service_slug: params.serviceSlug } : {}),
  });
}

export async function fetchCareUnassignedServiceRequestCounts(): Promise<Record<string, number>> {
  const data = await getMapped('/services/requests/unassigned-counts', (payload) => payload);
  if (!data || typeof data !== 'object') {
    return {};
  }
  const counts: Record<string, number> = {};
  for (const [slug, value] of Object.entries(data as Record<string, unknown>)) {
    if (typeof value === 'number' && value > 0) {
      counts[slug] = value;
    }
  }
  return counts;
}

export function assignCareServiceRequest(
  id: string,
  careManagerIds: readonly string[],
): Promise<ServiceRequest> {
  return sendMapped('post', `/services/requests/${id}/assign`, toServiceRequest, {
    care_manager_ids: [...careManagerIds],
  });
}

export function autoAssignCareServiceRequest(id: string): Promise<ServiceRequest> {
  return sendMapped('post', `/services/requests/${id}/auto-assign`, toServiceRequest);
}

export function fetchCareDispatchQueue(): Promise<ListPage<ServiceRequest>> {
  return getMapped('/services/requests', (data) => toListPage(data, toServiceRequest, 'service requests'), {
    awaiting_dispatch: true,
    limit: 20,
    offset: 0,
    status: 'ASSIGNED',
  });
}

export function takeCareServiceRequest(id: string): Promise<ServiceRequest> {
  return sendMapped('post', `/services/requests/${id}/take`, toServiceRequest);
}

export function assignCareServiceCompanion(
  id: string,
  serviceCompanionId: string,
): Promise<ServiceRequest> {
  return sendMapped('post', `/services/requests/${id}/assign-service-companion`, toServiceRequest, {
    care_manager_id: serviceCompanionId,
  });
}

export function assignVisitServiceCompanion(
  visitId: string,
  serviceCompanionId: string,
): Promise<ServiceRequest> {
  return sendMapped('post', `/visits/${visitId}/assign-service-companion`, toServiceRequest, {
    care_manager_id: serviceCompanionId,
  });
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

export async function updateVisitStatus(
  visitId: string,
  status: VisitStatus,
  notes?: string | null,
  proofPhoto?: string | null,
): Promise<Visit> {
  try {
    const body: Record<string, unknown> = { status };
    if (notes !== undefined) {
      body.notes = notes;
    }
    if (proofPhoto) {
      body.proof_photo = proofPhoto;
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
  input: { summary?: string | null; issuesNoted?: string | null; proofPhoto?: string | null },
): Promise<VisitReport> {
  try {
    const response = await apiClient.post(`/visits/${visitId}/reports`, {
      summary: input.summary ?? null,
      issues_noted: input.issuesNoted ?? null,
      proof_photo: input.proofPhoto ?? null,
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

export async function updateDeliveryStatus(
  deliveryId: string,
  status: DeliveryStatus,
  extra: { proofPhoto?: string | null } = {},
): Promise<Delivery> {
  try {
    const response = await apiClient.patch(`/deliveries/${deliveryId}`, {
      status,
      proof_photo: extra.proofPhoto ?? null,
    });
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
