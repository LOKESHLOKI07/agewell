import { POINT_CREATE_FAILED_MESSAGE, SESSION_CREATE_FAILED_MESSAGE } from './selectors';
import type { TrackingPoint, TrackingPointCreate, TrackingSession } from './types';
import type { ForegroundCoordinates, PermissionCheck } from './location';

export type StartLiveLocationResult =
  | { ok: true; sessionId: string; point: TrackingPoint }
  | { ok: false; reason: 'denied' | 'unavailable' | 'session' | 'location' | 'api'; message: string };

interface StartLiveLocationDeps {
  requestPermission: () => Promise<PermissionCheck>;
  readCoordinates: () => Promise<ForegroundCoordinates>;
  createSession: () => Promise<TrackingSession>;
  postPoint: (sessionId: string, point: TrackingPointCreate) => Promise<TrackingPoint>;
  toPoint: (coords: ForegroundCoordinates) => TrackingPointCreate;
  existingSessionId?: string | null;
}

export async function startLiveLocationShare(deps: StartLiveLocationDeps): Promise<StartLiveLocationResult> {
  const permission = await deps.requestPermission();
  if (permission.state === 'denied') {
    return { ok: false, reason: 'denied', message: permission.message ?? 'Location permission is required to share your location.' };
  }
  if (permission.state !== 'granted') {
    return { ok: false, reason: 'unavailable', message: permission.message ?? 'Your location is unavailable right now.' };
  }

  let session: TrackingSession;
  try {
    session = deps.existingSessionId
      ? { id: deps.existingSessionId, userId: null }
      : await deps.createSession();
  } catch (error) {
    return {
      ok: false,
      reason: 'session',
      message: error instanceof Error ? error.message : SESSION_CREATE_FAILED_MESSAGE,
    };
  }

  let coords: ForegroundCoordinates;
  try {
    coords = await deps.readCoordinates();
  } catch {
    return { ok: false, reason: 'location', message: 'Your location is unavailable right now.' };
  }

  try {
    const point = await deps.postPoint(session.id, deps.toPoint(coords));
    return { ok: true, sessionId: session.id, point };
  } catch (error) {
    return {
      ok: false,
      reason: 'api',
      message: error instanceof Error ? error.message : POINT_CREATE_FAILED_MESSAGE,
    };
  }
}
