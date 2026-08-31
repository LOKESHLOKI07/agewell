import { isAxiosError } from 'axios';
import { apiClient } from '@/api/client';
import { ApiError, toApiError } from '@/api/errors';
import { COMMUNITY_FORBIDDEN_MESSAGE } from './selectors';
import {
  toCancelRegistrationBody,
  toCommunityEvent,
  toCommunityEventCreateBody,
  toCommunityEvents,
  toCommunityEventUpdateBody,
  toEventRegistration,
  toEventRegistrations,
  toRegisterBody,
} from './mappers';
import type { CommunityEvent, CommunityEventUpdate, CommunityEventWrite, EventRegistration } from './types';

function responseDetail(error: unknown): string | undefined {
  if (!isAxiosError(error)) {
    return undefined;
  }
  const detail = error.response?.data?.detail;
  return typeof detail === 'string' ? detail : undefined;
}

function toCommunityError(error: unknown): ApiError {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  const detail = responseDetail(error);
  if (status === 403) {
    return new ApiError(COMMUNITY_FORBIDDEN_MESSAGE, 403);
  }
  if (status === 409) {
    if (detail?.toLowerCase().includes('capacity')) {
      return new ApiError('This event is at capacity.', 409);
    }
    return new ApiError('You are already registered for this event.', 409);
  }
  return toApiError(error);
}

export async function fetchCommunityEvents(): Promise<ReturnType<typeof toCommunityEvents>> {
  try {
    const response = await apiClient.get('/community/');
    return toCommunityEvents(response.data);
  } catch (error) {
    throw toCommunityError(error);
  }
}

export async function fetchCommunityEvent(eventId: string): Promise<CommunityEvent> {
  try {
    const response = await apiClient.get(`/community/${eventId}`);
    return toCommunityEvent(response.data);
  } catch (error) {
    throw toCommunityError(error);
  }
}

export async function createCommunityEvent(input: CommunityEventWrite): Promise<CommunityEvent> {
  try {
    const response = await apiClient.post('/community/', toCommunityEventCreateBody(input));
    return toCommunityEvent(response.data);
  } catch (error) {
    throw toCommunityError(error);
  }
}

export async function updateCommunityEvent(eventId: string, input: CommunityEventUpdate): Promise<CommunityEvent> {
  try {
    const response = await apiClient.patch(`/community/${eventId}`, toCommunityEventUpdateBody(input));
    return toCommunityEvent(response.data);
  } catch (error) {
    throw toCommunityError(error);
  }
}

export async function deleteCommunityEvent(eventId: string): Promise<CommunityEvent> {
  try {
    const response = await apiClient.delete(`/community/${eventId}`);
    return toCommunityEvent(response.data);
  } catch (error) {
    throw toCommunityError(error);
  }
}

export async function registerForEvent(eventId: string, seniorId?: string): Promise<EventRegistration> {
  try {
    const response = await apiClient.post(`/community/${eventId}/register`, toRegisterBody(seniorId));
    return toEventRegistration(response.data);
  } catch (error) {
    throw toCommunityError(error);
  }
}

export async function fetchCommunityRegistrations(): Promise<ReturnType<typeof toEventRegistrations>> {
  try {
    const response = await apiClient.get('/community/registrations');
    return toEventRegistrations(response.data);
  } catch (error) {
    throw toCommunityError(error);
  }
}

export async function cancelRegistration(registrationId: string): Promise<EventRegistration> {
  try {
    const response = await apiClient.patch(
      `/community/registrations/${registrationId}`,
      toCancelRegistrationBody(),
    );
    return toEventRegistration(response.data);
  } catch (error) {
    throw toCommunityError(error);
  }
}
