import { ApiError, getApiErrorMessage } from '@/api/errors';
import type { AuthRole } from '@/features/auth/authTypes';
import type { ListPage } from '@/features/home/types/home';
import { formatLongDate, formatTime } from '@/utils/date';
import type { TrackingPoint, TrackingSession, ViewerLocationState } from './types';

export const LOCATION_FORBIDDEN_MESSAGE = "You don't have access to this senior's location.";
export const LOCATION_UNAVAILABLE_MESSAGE = "Live location isn't available.";
export const LOCATION_NOT_SHARED_MESSAGE = 'No live location has been shared yet.';
export const ASSOCIATE_NOT_ASSIGNED_MESSAGE = "Care Associate location isn't available for this visit.";
export const ASSOCIATE_NOT_SHARING_MESSAGE = "Live location isn't available yet.";
export const ASSOCIATE_ON_THE_WAY_MESSAGE = 'Care Associate is on the way';
export const ASSOCIATE_SHARE_CONFIRM_TITLE = 'Share Live Location';
export const ASSOCIATE_SHARE_CONFIRM_MESSAGE =
  'Share your live location with the senior and family for this visit? AgeWell will read your current location while this screen is open. Sharing is not saved as a Start/Stop status on the server.';
export const LOCATION_PERMISSION_MESSAGE = 'Location permission is required to share your location.';
export const LOCATION_SERVICES_MESSAGE = 'Your location is unavailable right now.';
export const SESSION_CREATE_FAILED_MESSAGE = 'We could not start a live location session. Please try again.';
export const POINT_CREATE_FAILED_MESSAGE = 'We could not share your current location. Please try again.';
export const SHARING_ACTIVE_MESSAGE = 'Your live location is being shared.';
export const SHARING_CONFIRM_TITLE = 'Share live location?';
export const SHARING_CONFIRM_MESSAGE =
  'AgeWell will read your current location while this screen is open and share it with authorized family and care staff. Sharing is not saved as a Start/Stop status on the server.';

export function canPostTrackingPoints(role: AuthRole | null | undefined): boolean {
  return role === 'SENIOR';
}

export function canShareCareAssociateLocation(role: AuthRole | null | undefined): boolean {
  return role === 'CARE_MANAGER';
}

export function trackingHref() {
  return '/tracking' as const;
}

export function familyTrackingHref() {
  return '/family/tracking' as const;
}

export function careTrackingHref(seniorId: string) {
  return { pathname: '/care/tracking' as const, params: { seniorId } };
}

export function seniorAssociateTrackHref(visitId: string) {
  return { pathname: '/visits/[id]/track' as const, params: { id: visitId } };
}

export function familyAssociateTrackHref(visitId: string) {
  return { pathname: '/family/visits/[id]/track' as const, params: { id: visitId } };
}

export function careAssociateShareHref(visitId: string) {
  return { pathname: '/care/visits/[id]/share' as const, params: { id: visitId } };
}

export function newestSession(sessions: TrackingSession[] | undefined): TrackingSession | null {
  return sessions?.[0] ?? null;
}

export function formatCoordinate(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value.trim() === '') {
    return null;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return value;
  }
  return number.toFixed(6);
}

export function formatPointTimestamp(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${formatLongDate(value)} · ${formatTime(value)}`;
}

export function formatCoordinatePair(latitude: string | null | undefined, longitude: string | null | undefined): string | null {
  const lat = formatCoordinate(latitude);
  const lng = formatCoordinate(longitude);
  if (!lat || !lng) {
    return null;
  }
  return `${lat}, ${lng}`;
}

export function toPointTimestamp(value: number | Date = Date.now()): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
}

export function viewerLocationState(input: {
  sessionsPending: boolean;
  sessionsError: unknown;
  sessions?: ListPage<TrackingSession>;
  latestPending: boolean;
  latestError: unknown;
  latest?: TrackingPoint;
}): ViewerLocationState {
  if (input.sessionsPending) {
    return {
      kind: 'loading',
      title: 'Checking live location',
      message: 'Looking for a shared location session.',
      point: null,
      sessionId: null,
    };
  }

  const sessionsError = trackingStatus(input.sessionsError);
  if (sessionsError === 403) {
    return {
      kind: 'forbidden',
      title: 'Location unavailable',
      message: LOCATION_FORBIDDEN_MESSAGE,
      point: null,
      sessionId: null,
    };
  }
  if (input.sessionsError) {
    return {
      kind: 'error',
      title: 'Could not load live location',
      message: getTrackingErrorMessage(input.sessionsError),
      point: null,
      sessionId: null,
    };
  }

  const session = newestSession(input.sessions?.items);
  if (!session) {
    return {
      kind: 'no_session',
      title: 'Location unavailable',
      message: LOCATION_UNAVAILABLE_MESSAGE,
      point: null,
      sessionId: null,
    };
  }

  if (input.latestPending) {
    return {
      kind: 'loading',
      title: 'Checking live location',
      message: 'Looking for the latest shared coordinates.',
      point: null,
      sessionId: session.id,
    };
  }

  const latestError = trackingStatus(input.latestError);
  if (latestError === 403) {
    return {
      kind: 'forbidden',
      title: 'Location unavailable',
      message: LOCATION_FORBIDDEN_MESSAGE,
      point: null,
      sessionId: session.id,
    };
  }
  if (latestError === 404) {
    return {
      kind: 'no_point',
      title: 'Location unavailable',
      message: LOCATION_NOT_SHARED_MESSAGE,
      point: null,
      sessionId: session.id,
    };
  }
  if (input.latestError) {
    return {
      kind: 'error',
      title: 'Could not load live location',
      message: getTrackingErrorMessage(input.latestError),
      point: null,
      sessionId: session.id,
    };
  }

  if (!input.latest) {
    return {
      kind: 'no_point',
      title: 'Location unavailable',
      message: LOCATION_NOT_SHARED_MESSAGE,
      point: null,
      sessionId: session.id,
    };
  }

  return {
    kind: 'available',
    title: 'Live location available',
    message: 'Latest shared coordinates from the tracking API.',
    point: input.latest,
    sessionId: session.id,
  };
}

export function getTrackingErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return LOCATION_FORBIDDEN_MESSAGE;
    }
    if (error.status === 404) {
      return LOCATION_NOT_SHARED_MESSAGE;
    }
    return error.message;
  }
  return getApiErrorMessage(error);
}

function trackingStatus(error: unknown): number | undefined {
  return error instanceof ApiError ? error.status : undefined;
}
