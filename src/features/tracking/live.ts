import type { Visit } from '@/features/home/types/home';
import { humanizeStatus } from '@/features/home/selectors/homeViewModel';
import { formatTime } from '@/utils/date';
import { ApiError } from '@/api/errors';
import {
  ASSOCIATE_NOT_ASSIGNED_MESSAGE,
  ASSOCIATE_NOT_SHARING_MESSAGE,
  ASSOCIATE_ON_THE_WAY_MESSAGE,
  LOCATION_FORBIDDEN_MESSAGE,
  getTrackingErrorMessage,
} from './selectors';
import type { TrackingPoint, ViewerLocationState } from './types';

export const CARE_ASSOCIATE_POLL_MS = 5000;
export const LIVE_LOCATION_MAX_AGE_MS = 30_000;
export const STALE_LOCATION_AGE_MS = 90_000;
export const MARKER_ANIMATION_MS = 1000;
export const COORDINATE_EPSILON = 1e-7;

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type LiveLocationStatus = 'live' | 'updating' | 'unavailable' | 'stale' | 'forbidden' | 'error';

export type MarkerMotion = 'place' | 'animate' | 'ignore';

export type CameraFollowMode = 'fit' | 'follow' | 'free';

/**
 * Saved home is a fixed pin. Only use coordinates already stored on the profile
 * (e.g. "12.9716, 80.2201"). Never geocode a street address or invent a pin.
 */
export function parseSavedHomeCoordinate(address: string | null | undefined): MapCoordinate | null {
  if (!address) {
    return null;
  }
  const match = address.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) {
    return null;
  }
  return parseMapCoordinate(match[1], match[2]);
}

export function parseMapCoordinate(
  latitude: string | null | undefined,
  longitude: string | null | undefined,
): MapCoordinate | null {
  if (latitude == null || longitude == null || latitude.trim() === '' || longitude.trim() === '') {
    return null;
  }
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  return { latitude: lat, longitude: lng };
}

export function coordinatesEqual(left: MapCoordinate | null, right: MapCoordinate | null, epsilon = COORDINATE_EPSILON): boolean {
  if (!left || !right) {
    return left === right;
  }
  return Math.abs(left.latitude - right.latitude) < epsilon && Math.abs(left.longitude - right.longitude) < epsilon;
}

export function nextMarkerMotion(previous: MapCoordinate | null, next: MapCoordinate | null): MarkerMotion {
  if (!next) {
    return 'ignore';
  }
  if (!previous) {
    return 'place';
  }
  if (coordinatesEqual(previous, next)) {
    return 'ignore';
  }
  return 'animate';
}

export function interpolateCoordinate(from: MapCoordinate, to: MapCoordinate, progress: number): MapCoordinate {
  const t = Math.min(1, Math.max(0, progress));
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * t,
    longitude: from.longitude + (to.longitude - from.longitude) * t,
  };
}

export function locationAgeMs(timestamp: string | null | undefined, now: number = Date.now()): number | null {
  if (!timestamp) {
    return null;
  }
  const parsed = new Date(timestamp).getTime();
  if (Number.isNaN(parsed)) {
    return null;
  }
  return Math.max(0, now - parsed);
}

export function formatLastUpdated(timestamp: string | null | undefined, now: number = Date.now()): string | null {
  const age = locationAgeMs(timestamp, now);
  if (age === null) {
    return null;
  }
  if (age < 8_000) {
    return 'Updated just now';
  }
  if (age < 60_000) {
    const seconds = Math.max(1, Math.floor(age / 1000));
    return `Updated ${seconds} sec ago`;
  }
  const minutes = Math.max(1, Math.floor(age / 60_000));
  return `Updated ${minutes} min ago`;
}

export function liveLocationStatus(input: {
  isFetching: boolean;
  error: unknown;
  point: TrackingPoint | null | undefined;
  now?: number;
}): LiveLocationStatus {
  const status = input.error instanceof ApiError ? input.error.status : undefined;
  if (status === 403) {
    return 'forbidden';
  }
  if (input.error && !input.point) {
    return status === 404 ? 'unavailable' : 'error';
  }
  const coordinate = input.point ? parseMapCoordinate(input.point.latitude, input.point.longitude) : null;
  if (!coordinate) {
    if (input.isFetching) {
      return 'updating';
    }
    return input.error ? 'error' : 'unavailable';
  }
  const age = locationAgeMs(input.point?.timestamp, input.now);
  if (age !== null && age >= STALE_LOCATION_AGE_MS) {
    return 'stale';
  }
  if (input.isFetching) {
    return 'updating';
  }
  if (age !== null && age >= LIVE_LOCATION_MAX_AGE_MS) {
    return 'updating';
  }
  return 'live';
}

export function liveStatusLabel(status: LiveLocationStatus): string {
  switch (status) {
    case 'live':
      return 'LIVE';
    case 'updating':
      return 'UPDATING';
    case 'stale':
      return 'LOCATION STALE';
    case 'forbidden':
      return 'LOCATION UNAVAILABLE';
    case 'error':
      return 'LOCATION UNAVAILABLE';
    default:
      return 'LOCATION UNAVAILABLE';
  }
}

export function liveStatusMessage(input: {
  status: LiveLocationStatus;
  error: unknown;
  timestamp: string | null | undefined;
  now?: number;
}): string {
  if (input.status === 'live') {
    return ASSOCIATE_ON_THE_WAY_MESSAGE;
  }
  if (input.status === 'updating') {
    return 'Waiting for the latest location.';
  }
  if (input.status === 'stale') {
    return formatLastUpdated(input.timestamp, input.now) ?? 'Last location is too old.';
  }
  if (input.status === 'forbidden') {
    return LOCATION_FORBIDDEN_MESSAGE;
  }
  if (input.error instanceof ApiError) {
    return input.error.message;
  }
  if (input.error) {
    return getTrackingErrorMessage(input.error);
  }
  return ASSOCIATE_NOT_SHARING_MESSAGE;
}

export function mayClaimAssociateOnTheWay(status: LiveLocationStatus): boolean {
  return status === 'live';
}

export function associateUnavailableCopy(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return LOCATION_FORBIDDEN_MESSAGE;
    }
    return error.message;
  }
  return ASSOCIATE_NOT_SHARING_MESSAGE;
}

export function visitHasAssignedAssociate(visit: Pick<Visit, 'careManagerId'> | null | undefined): boolean {
  return Boolean(visit?.careManagerId);
}

export function pickTrackableVisit(...lists: Array<Visit[] | undefined | null>): Visit | null {
  const seen = new Set<string>();
  const merged: Visit[] = [];
  for (const list of lists) {
    for (const visit of list ?? []) {
      if (seen.has(visit.id)) {
        continue;
      }
      seen.add(visit.id);
      merged.push(visit);
    }
  }
  if (merged.length === 0) {
    return null;
  }
  return merged.find((visit) => visitHasAssignedAssociate(visit)) ?? merged[0] ?? null;
}

export function associateDisplayName(visit: Pick<Visit, 'careManagerName'> | null | undefined): string {
  const name = visit?.careManagerName?.trim();
  return name && name.length > 0 ? name : 'Care Associate';
}

export function visitTimeLine(visit: Pick<Visit, 'scheduledAt' | 'status'> | null | undefined): string | null {
  if (!visit) {
    return null;
  }
  const time = visit.scheduledAt ? formatTime(visit.scheduledAt) : null;
  const status = humanizeStatus(visit.status);
  if (time && status) {
    return `${time} · ${status}`;
  }
  return time ?? status ?? null;
}

export function nextFollowModeAfterGesture(current: CameraFollowMode): CameraFollowMode {
  return current === 'free' ? 'free' : 'free';
}

export function shouldFollowCamera(mode: CameraFollowMode): boolean {
  return mode === 'follow';
}

export function shouldFitCamera(mode: CameraFollowMode): boolean {
  return mode === 'fit';
}

export function careAssociateLatestQueryOptions(visitId: string, focused: boolean) {
  return {
    queryKey: ['tracking', 'careAssociate', visitId, 'latest'] as const,
    enabled: Boolean(visitId) && focused,
    refetchInterval: focused ? CARE_ASSOCIATE_POLL_MS : false,
  };
}

export { ASSOCIATE_NOT_ASSIGNED_MESSAGE, ASSOCIATE_NOT_SHARING_MESSAGE };

export function hasGpsCoordinate(point: TrackingPoint | null | undefined): boolean {
  return Boolean(point && parseMapCoordinate(point.latitude, point.longitude));
}

export function homeTrackingCopy(input: {
  isSharing: boolean;
  state: ViewerLocationState;
}): { title: string; subtitle: string; action: string } {
  if (input.state.kind === 'forbidden') {
    return {
      title: 'Location unavailable',
      subtitle: LOCATION_FORBIDDEN_MESSAGE,
      action: 'View Location',
    };
  }
  if (input.state.kind === 'error') {
    return {
      title: 'Location unavailable',
      subtitle: input.state.message,
      action: 'Try again',
    };
  }
  if (input.state.kind === 'loading') {
    return {
      title: 'Checking live location',
      subtitle: 'Looking for an active tracking session.',
      action: 'View Location',
    };
  }
  if (input.isSharing || hasGpsCoordinate(input.state.point)) {
    return {
      title: 'Live Location Active',
      subtitle: formatLastUpdated(input.state.point?.timestamp) ?? 'Latest GPS from your tracking session.',
      action: 'View Location',
    };
  }
  return {
    title: 'Share Live Location',
    subtitle: 'Share your current coordinates with family and care staff.',
    action: 'Start Sharing',
  };
}

export function viewerLiveLocationCopy(state: ViewerLocationState): { title: string; subtitle: string; action: string } {
  if (state.kind === 'forbidden') {
    return {
      title: 'Location unavailable',
      subtitle: LOCATION_FORBIDDEN_MESSAGE,
      action: 'View Location',
    };
  }
  if (state.kind === 'error') {
    return {
      title: 'Location unavailable',
      subtitle: state.message,
      action: 'Try again',
    };
  }
  if (hasGpsCoordinate(state.point)) {
    return {
      title: 'Live Location Active',
      subtitle: formatLastUpdated(state.point?.timestamp) ?? 'Latest GPS from the tracking session.',
      action: 'View Location',
    };
  }
  return {
    title: 'Location unavailable',
    subtitle: state.message,
    action: 'View Location',
  };
}
