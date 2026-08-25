import { toListPage } from '@/features/home/api/mappers';
import type { ListPage } from '@/features/home/types/home';
import type { TrackingPoint, TrackingPointCreate, TrackingPointResponse, TrackingSession, TrackingSessionResponse } from './types';

function asRecord(payload: unknown, label: string): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    throw new Error(`Invalid ${label}`);
  }
  return payload as Record<string, unknown>;
}

function asId(value: unknown, label: string): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  throw new Error(`Invalid ${label}`);
}

function asOptionalId(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  throw new Error('Invalid tracking user id');
}

function asOptionalString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  throw new Error('Invalid tracking field');
}

export function toTrackingSession(payload: unknown): TrackingSession {
  const data = asRecord(payload, 'tracking session') as unknown as TrackingSessionResponse;
  return {
    id: asId(data.id, 'session.id'),
    userId: asOptionalId(data.user_id),
  };
}

export function toTrackingSessions(payload: unknown): ListPage<TrackingSession> {
  return toListPage(payload, toTrackingSession, 'tracking sessions');
}

export function toTrackingPoint(payload: unknown): TrackingPoint {
  const data = asRecord(payload, 'tracking point') as unknown as TrackingPointResponse;
  return {
    id: asId(data.id, 'point.id'),
    sessionId: asId(data.session_id, 'point.session_id'),
    latitude: asOptionalString(data.latitude),
    longitude: asOptionalString(data.longitude),
    timestamp: asOptionalString(data.timestamp),
  };
}

export function toTrackingPointCreateBody(input: TrackingPointCreate) {
  return {
    latitude: input.latitude,
    longitude: input.longitude,
    timestamp: input.timestamp,
  };
}

export function toCreateSessionBody() {
  return {};
}
