import { apiClient } from '@/api/client';
import { ApiError } from '@/api/errors';
import { queryClient } from '@/api/queryClient';
import { createTrackingPoint, createTrackingSession, fetchLatestPoint, fetchTrackingSessions } from '../api';
import { toCreateSessionBody, toTrackingPoint, toTrackingPointCreateBody, toTrackingSession, toTrackingSessions } from '../mappers';
import { invalidateTrackingQueries, trackingQueryKeys } from '../queryKeys';
import {
  LOCATION_FORBIDDEN_MESSAGE,
  LOCATION_NOT_SHARED_MESSAGE,
  LOCATION_PERMISSION_MESSAGE,
  LOCATION_UNAVAILABLE_MESSAGE,
  canPostTrackingPoints,
  careTrackingHref,
  familyTrackingHref,
  formatCoordinate,
  formatCoordinatePair,
  newestSession,
  trackingHref,
  viewerLocationState,
} from '../selectors';
import { homeTrackingCopy } from '../live';
import { startLiveLocationShare } from '../sharing';
import { toTrackingPointCreate } from '../location';

jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockedGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockedPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

const sessionPayload = {
  id: '11111111-1111-4111-8111-111111111111',
  user_id: '22222222-2222-4222-8222-222222222222',
  status: 'should-not-map',
  started_at: '2026-08-21T12:00:00Z',
};

const pointPayload = {
  id: '33333333-3333-4333-8333-333333333333',
  session_id: sessionPayload.id,
  latitude: '12.9716',
  longitude: '77.5946',
  timestamp: '2026-08-21T12:05:00',
  accuracy: 12,
  speed: 4,
  heading: 90,
  altitude: 900,
  eta: '5 min',
};

const sessionPage = {
  items: [sessionPayload],
  total: 1,
  limit: 50,
  offset: 0,
};

describe('tracking API contracts', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('creates a session with an empty body and no user_id', async () => {
    mockedPost.mockResolvedValueOnce({ data: sessionPayload } as never);
    const session = await createTrackingSession();
    expect(session).toEqual({ id: sessionPayload.id, userId: sessionPayload.user_id });
    expect(session).not.toHaveProperty('status');
    expect(mockedPost).toHaveBeenCalledWith('/tracking/', {});
    expect(toCreateSessionBody()).toEqual({});
    expect(toCreateSessionBody()).not.toHaveProperty('user_id');
  });

  it('loads the authenticated senior sessions without a senior_id', async () => {
    mockedGet.mockResolvedValueOnce({ data: sessionPage } as never);
    const page = await fetchTrackingSessions();
    expect(page.items[0].id).toBe(sessionPayload.id);
    expect(mockedGet).toHaveBeenCalledWith('/tracking/', { params: undefined });
  });

  it('loads family or care sessions with senior_id from GET /families/seniors scope', async () => {
    mockedGet.mockResolvedValueOnce({ data: sessionPage } as never);
    await fetchTrackingSessions('senior-john');
    expect(mockedGet).toHaveBeenCalledWith('/tracking/', { params: { senior_id: 'senior-john' } });
  });

  it('posts only latitude, longitude, and timestamp', async () => {
    mockedPost.mockResolvedValueOnce({ data: pointPayload } as never);
    const point = await createTrackingPoint(sessionPayload.id, {
      latitude: '12.9716',
      longitude: '77.5946',
      timestamp: '2026-08-21T12:05:00.000Z',
    });
    expect(point.latitude).toBe('12.9716');
    expect(point).not.toHaveProperty('accuracy');
    expect(point).not.toHaveProperty('speed');
    expect(mockedPost).toHaveBeenCalledWith(`/tracking/${sessionPayload.id}/points`, {
      latitude: '12.9716',
      longitude: '77.5946',
      timestamp: '2026-08-21T12:05:00.000Z',
    });
    expect(Object.keys(toTrackingPointCreateBody({
      latitude: '12.9716',
      longitude: '77.5946',
      timestamp: '2026-08-21T12:05:00.000Z',
    })).sort()).toEqual(['latitude', 'longitude', 'timestamp']);
  });

  it('loads the latest point', async () => {
    mockedGet.mockResolvedValueOnce({ data: pointPayload } as never);
    const point = await fetchLatestPoint(sessionPayload.id);
    expect(point.sessionId).toBe(sessionPayload.id);
    expect(mockedGet).toHaveBeenCalledWith(`/tracking/${sessionPayload.id}/latest`);
  });

  it('maps FastAPI fields without invented GPS extras', () => {
    const session = toTrackingSession(sessionPayload);
    const point = toTrackingPoint(pointPayload);
    expect(Object.keys(session).sort()).toEqual(['id', 'userId']);
    expect(Object.keys(point).sort()).toEqual(['id', 'latitude', 'longitude', 'sessionId', 'timestamp']);
    expect(toTrackingSessions(sessionPage).items).toHaveLength(1);
  });
});

describe('tracking authorization copy', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('surfaces unauthorized family or care access as 403 location copy', async () => {
    mockedGet.mockRejectedValueOnce({ isAxiosError: true, response: { status: 403, data: {} } });
    await expect(fetchTrackingSessions('jane')).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
      message: LOCATION_FORBIDDEN_MESSAGE,
    });
  });

  it('surfaces a missing latest point as no live location shared yet', async () => {
    mockedGet.mockRejectedValueOnce({ isAxiosError: true, response: { status: 404, data: {} } });
    await expect(fetchLatestPoint(sessionPayload.id)).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: LOCATION_NOT_SHARED_MESSAGE,
    });
  });

  it('does not let Family or Care Manager write senior points', () => {
    expect(canPostTrackingPoints('SENIOR')).toBe(true);
    expect(canPostTrackingPoints('FAMILY')).toBe(false);
    expect(canPostTrackingPoints('CARE_MANAGER')).toBe(false);
    expect(canPostTrackingPoints('ADMIN')).toBe(false);
  });
});

describe('tracking viewer states', () => {
  const available = viewerLocationState({
    sessionsPending: false,
    sessionsError: null,
    sessions: { items: [toTrackingSession(sessionPayload)], total: 1, limit: 50, offset: 0 },
    latestPending: false,
    latestError: null,
    latest: toTrackingPoint(pointPayload),
  });

  it('shows live location when a latest point exists', () => {
    expect(available.kind).toBe('available');
    expect(available.point?.latitude).toBe('12.9716');
    expect(newestSession(available.point ? [toTrackingSession(sessionPayload)] : [])?.id).toBe(sessionPayload.id);
  });

  it('shows no session copy when the senior has not created a session', () => {
    const state = viewerLocationState({
      sessionsPending: false,
      sessionsError: null,
      sessions: { items: [], total: 0, limit: 50, offset: 0 },
      latestPending: false,
      latestError: null,
    });
    expect(state.kind).toBe('no_session');
    expect(state.message).toBe(LOCATION_UNAVAILABLE_MESSAGE);
  });

  it('shows no latest point copy', () => {
    const state = viewerLocationState({
      sessionsPending: false,
      sessionsError: null,
      sessions: { items: [toTrackingSession(sessionPayload)], total: 1, limit: 50, offset: 0 },
      latestPending: false,
      latestError: new ApiError(LOCATION_NOT_SHARED_MESSAGE, 404),
    });
    expect(state.kind).toBe('no_point');
    expect(state.message).toBe(LOCATION_NOT_SHARED_MESSAGE);
  });

  it('shows forbidden copy for an unauthorized or unassigned senior', () => {
    const state = viewerLocationState({
      sessionsPending: false,
      sessionsError: new ApiError(LOCATION_FORBIDDEN_MESSAGE, 403),
      latestPending: false,
      latestError: null,
    });
    expect(state.kind).toBe('forbidden');
    expect(state.message).toBe(LOCATION_FORBIDDEN_MESSAGE);
  });

  it('never uses fake care-associate-on-the-way copy', () => {
    const idle = homeTrackingCopy({
      isSharing: false,
      state: viewerLocationState({
        sessionsPending: false,
        sessionsError: null,
        sessions: { items: [], total: 0, limit: 50, offset: 0 },
        latestPending: false,
        latestError: null,
      }),
    });
    const sharing = homeTrackingCopy({ isSharing: true, state: available });
    const live = homeTrackingCopy({ isSharing: false, state: available });
    expect(idle.title).toBe('Share Live Location');
    expect(idle.action).toBe('Start Sharing');
    expect(sharing.title).toBe('Live Location Active');
    expect(sharing.action).toBe('View Location');
    expect(live.title).toBe('Live Location Active');
    expect(live.action).toBe('View Location');
    expect(`${idle.title} ${sharing.title} ${live.title} ${idle.subtitle}`).not.toMatch(/Care Associate is on the way/i);
  });

  it('formats coordinates without reverse geocoding', () => {
    expect(formatCoordinate('12.9716')).toBe('12.971600');
    expect(formatCoordinatePair('12.9716', '77.5946')).toBe('12.971600, 77.594600');
    expect(formatCoordinatePair('12.9716', '77.5946')).not.toMatch(/street|bengaluru|address/i);
  });
});

describe('senior start live location', () => {
  it('creates a session, posts the current point, and does not send user_id', async () => {
    const result = await startLiveLocationShare({
      requestPermission: async () => ({ state: 'granted', message: null }),
      readCoordinates: async () => ({ latitude: 12.97, longitude: 77.59, timestamp: 1_700_000_000_000 }),
      createSession: async () => toTrackingSession(sessionPayload),
      postPoint: async (sessionId, point) =>
        toTrackingPoint({
          ...pointPayload,
          session_id: sessionId,
          latitude: point.latitude,
          longitude: point.longitude,
          timestamp: point.timestamp,
        }),
      toPoint: toTrackingPointCreate,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sessionId).toBe(sessionPayload.id);
      expect(result.point.latitude).toBe('12.97');
    }
  });

  it('reuses an existing tracking session instead of creating another', async () => {
    const createSession = jest.fn(async () => toTrackingSession(sessionPayload));
    const result = await startLiveLocationShare({
      requestPermission: async () => ({ state: 'granted', message: null }),
      readCoordinates: async () => ({ latitude: 12.97, longitude: 77.59, timestamp: 1_700_000_000_000 }),
      createSession,
      existingSessionId: sessionPayload.id,
      postPoint: async (sessionId, point) =>
        toTrackingPoint({
          ...pointPayload,
          session_id: sessionId,
          latitude: point.latitude,
          longitude: point.longitude,
          timestamp: point.timestamp,
        }),
      toPoint: toTrackingPointCreate,
    });
    expect(createSession).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sessionId).toBe(sessionPayload.id);
    }
  });

  it('returns a permission denied result without posting points', async () => {
    const postPoint = jest.fn();
    const result = await startLiveLocationShare({
      requestPermission: async () => ({ state: 'denied', message: LOCATION_PERMISSION_MESSAGE }),
      readCoordinates: async () => ({ latitude: 1, longitude: 1, timestamp: Date.now() }),
      createSession: async () => toTrackingSession(sessionPayload),
      postPoint,
      toPoint: toTrackingPointCreate,
    });
    expect(result).toEqual({ ok: false, reason: 'denied', message: LOCATION_PERMISSION_MESSAGE });
    expect(postPoint).not.toHaveBeenCalled();
  });

  it('returns a session creation failure', async () => {
    const result = await startLiveLocationShare({
      requestPermission: async () => ({ state: 'granted', message: null }),
      readCoordinates: async () => ({ latitude: 1, longitude: 1, timestamp: Date.now() }),
      createSession: async () => {
        throw new ApiError('We could not start a live location session. Please try again.', 500);
      },
      postPoint: async () => toTrackingPoint(pointPayload),
      toPoint: toTrackingPointCreate,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('session');
    }
  });

  it('returns an API error when posting the point fails', async () => {
    const result = await startLiveLocationShare({
      requestPermission: async () => ({ state: 'granted', message: null }),
      readCoordinates: async () => ({ latitude: 1, longitude: 1, timestamp: Date.now() }),
      createSession: async () => toTrackingSession(sessionPayload),
      postPoint: async () => {
        throw new ApiError('We could not share your current location. Please try again.', 500);
      },
      toPoint: toTrackingPointCreate,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('api');
    }
  });
});

describe('tracking routing and query keys', () => {
  it('routes Senior, Family, and Care Manager tracking screens', () => {
    expect(trackingHref()).toBe('/tracking');
    expect(familyTrackingHref()).toBe('/family/tracking');
    expect(careTrackingHref('senior-1')).toEqual({ pathname: '/care/tracking', params: { seniorId: 'senior-1' } });
  });

  it('keeps family and care session keys distinct from the signed-in user', () => {
    expect(trackingQueryKeys.mine).toEqual(['tracking', 'sessions', 'me']);
    expect(trackingQueryKeys.senior('john')).toEqual(['tracking', 'sessions', 'senior', 'john']);
    expect(trackingQueryKeys.latest('sess-1')).toEqual(['tracking', 'latest', 'sess-1']);
    expect(trackingQueryKeys.senior('john')).not.toEqual(trackingQueryKeys.mine);
  });

  it('invalidates the tracking query family after mutations', async () => {
    const spy = jest.spyOn(queryClient, 'invalidateQueries');
    await invalidateTrackingQueries();
    expect(spy).toHaveBeenCalledWith({ queryKey: ['tracking'] });
    spy.mockRestore();
  });
});
