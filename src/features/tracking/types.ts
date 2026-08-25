export interface TrackingSessionResponse {
  id: string;
  user_id: string | null;
}

export interface TrackingPointResponse {
  id: string;
  session_id: string;
  latitude: string | null;
  longitude: string | null;
  timestamp: string | null;
}

export interface TrackingSession {
  id: string;
  userId: string | null;
}

export interface TrackingPoint {
  id: string;
  sessionId: string;
  latitude: string | null;
  longitude: string | null;
  timestamp: string | null;
}

export interface TrackingPointCreate {
  latitude: string;
  longitude: string;
  timestamp: string;
}

export type TrackingPermissionState = 'unknown' | 'granted' | 'denied' | 'unavailable';

export type ViewerLocationKind = 'loading' | 'forbidden' | 'error' | 'no_session' | 'no_point' | 'available';

export interface ViewerLocationState {
  kind: ViewerLocationKind;
  title: string;
  message: string;
  point: TrackingPoint | null;
  sessionId: string | null;
}
