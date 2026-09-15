import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';
import type { ListPage } from '@/features/home/types/home';
import {
  toAssignedCareManagerPage,
  toCareActivity,
  toCareActivityPage,
  toCareVisitSlots,
} from './careManagerMappers';
import type {
  AssignedCareManagerPage,
  CareActivity,
  CareActivityUpdate,
  CareVisitSlot,
} from './careManagerTypes';

export function fetchAssignedCareManager(
  seniorId?: string | null,
  staffKind?: string | null,
): Promise<AssignedCareManagerPage> {
  const params: Record<string, string> = {};
  if (seniorId) {
    params.senior_id = seniorId;
  }
  if (staffKind) {
    params.staff_kind = staffKind;
  }
  return apiClient
    .get('/care/assigned', { params: Object.keys(params).length ? params : undefined })
    .then((response) => toAssignedCareManagerPage(response.data))
    .catch((error) => {
      throw toApiError(error);
    });
}

export function fetchCareActivities(seniorId?: string | null): Promise<ListPage<CareActivity>> {
  return apiClient
    .get('/care/activities', { params: seniorId ? { senior_id: seniorId } : undefined })
    .then((response) => toCareActivityPage(response.data))
    .catch((error) => {
      throw toApiError(error);
    });
}

export function fetchCareVisitSlots(onDate: string, seniorId?: string | null): Promise<CareVisitSlot[]> {
  return apiClient
    .get('/care/visit-slots', {
      params: { date: onDate, ...(seniorId ? { senior_id: seniorId } : {}) },
    })
    .then((response) => toCareVisitSlots(response.data))
    .catch((error) => {
      throw toApiError(error);
    });
}

export function createCareCall(seniorId?: string | null): Promise<CareActivity> {
  return apiClient
    .post('/care/activities/call', seniorId ? { senior_id: seniorId } : {})
    .then((response) => toCareActivity(response.data))
    .catch((error) => {
      throw toApiError(error);
    });
}

export function createCareMessage(seniorId?: string | null): Promise<CareActivity> {
  return apiClient
    .post('/care/activities/message', seniorId ? { senior_id: seniorId } : {})
    .then((response) => toCareActivity(response.data))
    .catch((error) => {
      throw toApiError(error);
    });
}

export function createCareVisitRequest(input: {
  scheduledAt: string;
  reason?: string | null;
  seniorId?: string | null;
}): Promise<CareActivity> {
  return apiClient
    .post('/care/activities/visit', {
      scheduled_at: input.scheduledAt,
      reason: input.reason ?? null,
      ...(input.seniorId ? { senior_id: input.seniorId } : {}),
    })
    .then((response) => toCareActivity(response.data))
    .catch((error) => {
      throw toApiError(error);
    });
}

export function updateCareActivity(activityId: string, input: CareActivityUpdate): Promise<CareActivity> {
  const body: Record<string, unknown> = {};
  if (input.activityType !== undefined) body.activity_type = input.activityType;
  if (input.status !== undefined) body.status = input.status;
  if (input.reason !== undefined) body.reason = input.reason;
  if (input.discussion !== undefined) body.discussion = input.discussion;
  if (input.actionTaken !== undefined) body.action_taken = input.actionTaken;
  if (input.servicesCoordinated !== undefined) body.services_coordinated = input.servicesCoordinated;
  if (input.followUpRequired !== undefined) body.follow_up_required = input.followUpRequired;
  if (input.followUpDate !== undefined) body.follow_up_date = input.followUpDate;
  if (input.followUpNotes !== undefined) body.follow_up_notes = input.followUpNotes;
  if (input.notes !== undefined) body.notes = input.notes;
  return apiClient
    .patch(`/care/activities/${activityId}`, body)
    .then((response) => toCareActivity(response.data))
    .catch((error) => {
      throw toApiError(error);
    });
}
