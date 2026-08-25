import { isAxiosError } from 'axios';
import { apiClient } from '@/api/client';
import { ApiError, toApiError } from '@/api/errors';
import { toCreateSessionBody, toTrackingPoint, toTrackingPointCreateBody, toTrackingSession, toTrackingSessions } from './mappers';
import {
  LOCATION_FORBIDDEN_MESSAGE,
  LOCATION_NOT_SHARED_MESSAGE,
  SESSION_CREATE_FAILED_MESSAGE,
  ASSOCIATE_NOT_ASSIGNED_MESSAGE,
  ASSOCIATE_NOT_SHARING_MESSAGE,
} from './selectors';
import type { TrackingPoint, TrackingPointCreate, TrackingSession } from './types';

function responseDetail(error: unknown): string | undefined {
  if (!isAxiosError(error)) {
    return undefined;
  }
  const detail = error.response?.data?.detail;
  return typeof detail === 'string' ? detail : undefined;
}

function toTrackingError(error: unknown, fallback?: string): ApiError {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  if (status === 403) {
    return new ApiError(LOCATION_FORBIDDEN_MESSAGE, 403);
  }
  if (status === 404) {
    return new ApiError(LOCATION_NOT_SHARED_MESSAGE, 404);
  }
  if (fallback) {
    return new ApiError(fallback, status);
  }
  const mapped = toApiError(error);
  const detail = responseDetail(error);
  if (detail && mapped.status === 400) {
    return new ApiError(detail, 400);
  }
  return mapped;
}

export async function createTrackingSession(): Promise<TrackingSession> {
  try {
    const response = await apiClient.post('/tracking/', toCreateSessionBody());
    return toTrackingSession(response.data);
  } catch (error) {
    throw toTrackingError(error, SESSION_CREATE_FAILED_MESSAGE);
  }
}

export async function fetchTrackingSessions(seniorId?: string): Promise<ReturnType<typeof toTrackingSessions>> {
  try {
    const response = await apiClient.get('/tracking/', {
      params: seniorId ? { senior_id: seniorId } : undefined,
    });
    return toTrackingSessions(response.data);
  } catch (error) {
    throw toTrackingError(error);
  }
}

export async function fetchLatestPoint(sessionId: string): Promise<TrackingPoint> {
  try {
    const response = await apiClient.get(`/tracking/${sessionId}/latest`);
    return toTrackingPoint(response.data);
  } catch (error) {
    throw toTrackingError(error);
  }
}

export async function createTrackingPoint(sessionId: string, input: TrackingPointCreate): Promise<TrackingPoint> {
  try {
    const response = await apiClient.post(
      `/tracking/${sessionId}/points`,
      toTrackingPointCreateBody(input),
    );
    return toTrackingPoint(response.data);
  } catch (error) {
    throw toTrackingError(error);
  }
}

function toCareAssociateError(error: unknown): ApiError {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  const detail = responseDetail(error);
  if (status === 403) {
    return new ApiError(LOCATION_FORBIDDEN_MESSAGE, 403);
  }
  if (status === 404) {
    if (detail === 'Care manager is not assigned to this visit') {
      return new ApiError(ASSOCIATE_NOT_ASSIGNED_MESSAGE, 404);
    }
    if (detail === 'Visit not found') {
      return new ApiError('This visit could not be found.', 404);
    }
    if (detail === 'Location point not found') {
      return new ApiError(ASSOCIATE_NOT_SHARING_MESSAGE, 404);
    }
    return new ApiError(ASSOCIATE_NOT_SHARING_MESSAGE, 404);
  }
  return toTrackingError(error);
}

export async function createCareAssociateSession(): Promise<TrackingSession> {
  try {
    const response = await apiClient.post('/tracking/care-associate/', toCreateSessionBody());
    return toTrackingSession(response.data);
  } catch (error) {
    throw toCareAssociateError(error);
  }
}

export async function createCareAssociatePoint(sessionId: string, input: TrackingPointCreate): Promise<TrackingPoint> {
  try {
    const response = await apiClient.post(
      `/tracking/care-associate/${sessionId}/points`,
      toTrackingPointCreateBody(input),
    );
    return toTrackingPoint(response.data);
  } catch (error) {
    throw toCareAssociateError(error);
  }
}

export async function fetchCareAssociateSession(visitId: string): Promise<TrackingSession> {
  try {
    const response = await apiClient.get(`/tracking/visits/${visitId}/care-associate`);
    return toTrackingSession(response.data);
  } catch (error) {
    throw toCareAssociateError(error);
  }
}

export async function fetchCareAssociateLatest(visitId: string): Promise<TrackingPoint> {
  try {
    const response = await apiClient.get(`/tracking/visits/${visitId}/care-associate/latest`);
    return toTrackingPoint(response.data);
  } catch (error) {
    throw toCareAssociateError(error);
  }
}
