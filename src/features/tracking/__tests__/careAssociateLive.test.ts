import { apiClient } from '@/api/client';
import { ApiError } from '@/api/errors';
import {
  createCareAssociatePoint,
  createCareAssociateSession,
  fetchCareAssociateLatest,
  fetchCareAssociateSession,
} from '../api';
import { trackingQueryKeys } from '../queryKeys';
import {
  ASSOCIATE_NOT_ASSIGNED_MESSAGE,
  ASSOCIATE_NOT_SHARING_MESSAGE,
  ASSOCIATE_ON_THE_WAY_MESSAGE,
  LOCATION_FORBIDDEN_MESSAGE,
  LOCATION_PERMISSION_MESSAGE,
  canPostTrackingPoints,
  canShareCareAssociateLocation,
  careAssociateShareHref,
  familyAssociateTrackHref,
  seniorAssociateTrackHref,
} from '../selectors';
import { startLiveLocationShare } from '../sharing';
import { toTrackingPoint, toTrackingSession } from '../mappers';
import { toTrackingPointCreate } from '../location';
import {
  DEMO_DGP_APARTMENT,
  DEMO_SENIOR_HOME,
  DEMO_TICK_MS,
  demoTripAt,
  demoTripDurationMs,
  haversineMeters,
  withDemoCareAssociatePoint,
} from '../demoLocation';
import {
  CARE_ASSOCIATE_POLL_MS,
  STALE_LOCATION_AGE_MS,
  careAssociateLatestQueryOptions,
  coordinatesEqual,
  formatLastUpdated,
  interpolateCoordinate,
  liveLocationStatus,
  liveStatusLabel,
  liveStatusMessage,
  mayClaimAssociateOnTheWay,
  nextFollowModeAfterGesture,
  nextMarkerMotion,
  parseMapCoordinate,
  parseSavedHomeCoordinate,
  pickTrackableVisit,
  shouldFollowCamera,
  visitHasAssignedAssociate,
} from '../live';
import type { Visit } from '@/features/home/types/home';

jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockedGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockedPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

const sessionPayload = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
};

const pointPayload = {
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  session_id: sessionPayload.id,
  latitude: '12.9716',
  longitude: '77.5946',
  timestamp: '2026-08-21T12:05:00',
  eta: '5 min',
  speed: 12,
};

const visit: Visit = {
  id: 'visit-1',
  seniorId: 'senior-john',
  careManagerId: 'cm-1',
  employeeId: 'CM01',
  careManagerName: 'Rohit Sharma',
  status: 'SCHEDULED',
  scheduledAt: '2026-08-21T12:00:00Z',
  notes: null,
};

describe('care associate tracking API', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('creates a care associate session without client ownership ids', async () => {
    mockedPost.mockResolvedValueOnce({ data: sessionPayload } as never);
    const session = await createCareAssociateSession();
    expect(session.userId).toBe(sessionPayload.user_id);
    expect(mockedPost).toHaveBeenCalledWith('/tracking/care-associate/', {});
  });

  it('writes points only to the care-associate session path', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { ...pointPayload, latitude: '12.9720', longitude: '77.5950' },
    } as never);
    const point = await createCareAssociatePoint(sessionPayload.id, {
      latitude: '12.9720',
      longitude: '77.5950',
      timestamp: '2026-08-21T12:06:00.000Z',
    });
    expect(point.latitude).toBe('12.9720');
    expect(point).not.toHaveProperty('eta');
    expect(mockedPost).toHaveBeenCalledWith(`/tracking/care-associate/${sessionPayload.id}/points`, {
      latitude: '12.9720',
      longitude: '77.5950',
      timestamp: '2026-08-21T12:06:00.000Z',
    });
  });

  it('loads visit-scoped latest location from the associate endpoint', async () => {
    mockedGet.mockResolvedValueOnce({ data: pointPayload } as never);
    const point = await fetchCareAssociateLatest('visit-1');
    expect(point.sessionId).toBe(sessionPayload.id);
    expect(mockedGet).toHaveBeenCalledWith('/tracking/visits/visit-1/care-associate/latest');
  });

  it('loads the visit associate session', async () => {
    mockedGet.mockResolvedValueOnce({ data: sessionPayload } as never);
    await fetchCareAssociateSession('visit-1');
    expect(mockedGet).toHaveBeenCalledWith('/tracking/visits/visit-1/care-associate');
  });

  it('maps unauthorized family or unassigned care manager to 403 copy', async () => {
    mockedGet.mockRejectedValueOnce({ response: { status: 403, data: { detail: 'nope' } }, isAxiosError: true });
    await expect(fetchCareAssociateLatest('visit-1')).rejects.toMatchObject({
      status: 403,
      message: LOCATION_FORBIDDEN_MESSAGE,
    });
  });

  it('maps unassigned visit to associate-unavailable copy', async () => {
    mockedGet.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 404, data: { detail: 'Care manager is not assigned to this visit' } },
    });
    await expect(fetchCareAssociateLatest('visit-1')).rejects.toMatchObject({
      status: 404,
      message: ASSOCIATE_NOT_ASSIGNED_MESSAGE,
    });
  });

  it('maps missing session or point to not-sharing copy', async () => {
    mockedGet.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 404, data: { detail: 'Care associate tracking is unavailable' } },
    });
    await expect(fetchCareAssociateLatest('visit-1')).rejects.toMatchObject({
      status: 404,
      message: ASSOCIATE_NOT_SHARING_MESSAGE,
    });
  });
});

describe('care associate sharing', () => {
  it('allows only care managers to create associate sessions', () => {
    expect(canShareCareAssociateLocation('CARE_MANAGER')).toBe(true);
    expect(canShareCareAssociateLocation('SENIOR')).toBe(false);
    expect(canShareCareAssociateLocation('FAMILY')).toBe(false);
    expect(canPostTrackingPoints('CARE_MANAGER')).toBe(false);
  });

  it('starts sharing through care-associate session and point functions', async () => {
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
  });

  it('returns permission denied without posting points', async () => {
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
});

describe('live map logic', () => {
  const now = Date.parse('2026-08-21T12:05:10Z');

  it('parses valid coordinates and ignores invalid ones', () => {
    expect(parseMapCoordinate('12.9716', '80.2201')).toEqual({ latitude: 12.9716, longitude: 80.2201 });
    expect(parseSavedHomeCoordinate('12.9716, 80.2201')).toEqual({ latitude: 12.9716, longitude: 80.2201 });
    expect(parseSavedHomeCoordinate('123')).toBeNull();
    expect(parseSavedHomeCoordinate('Velachery, Chennai')).toBeNull();
    expect(parseMapCoordinate('91', '0')).toBeNull();
    expect(parseMapCoordinate('abc', '77')).toBeNull();
    expect(parseMapCoordinate(null, '77')).toBeNull();
  });

  it('animates between distinct coordinates and places the first point', () => {
    const from = { latitude: 12.9716, longitude: 80.2201 };
    const to = { latitude: 12.972, longitude: 80.2208 };
    expect(nextMarkerMotion(null, to)).toBe('place');
    expect(nextMarkerMotion(from, to)).toBe('animate');
    expect(nextMarkerMotion(from, from)).toBe('ignore');
    expect(nextMarkerMotion(from, null)).toBe('ignore');
    const mid = interpolateCoordinate(from, to, 0.5);
    expect(mid.latitude).toBeCloseTo(12.9718);
    expect(coordinatesEqual(from, to)).toBe(false);
  });

  it('does not invent fake coordinates', () => {
    expect(parseMapCoordinate(undefined, undefined)).toBeNull();
    expect(pickTrackableVisit([])).toBeNull();
  });

  it('shows live, stale, and last-updated copy from the GPS timestamp', () => {
    const fresh = liveLocationStatus({
      isFetching: false,
      error: null,
      point: { ...toTrackingPoint(pointPayload), timestamp: '2026-08-21T12:05:08Z' },
      now,
    });
    expect(fresh).toBe('live');
    expect(liveStatusLabel(fresh)).toBe('LIVE');
    expect(mayClaimAssociateOnTheWay(fresh)).toBe(true);
    expect(formatLastUpdated('2026-08-21T12:05:08Z', now)).toBe('Updated just now');
    expect(formatLastUpdated('2026-08-21T12:04:50Z', now)).toBe('Updated 20 sec ago');

    const stale = liveLocationStatus({
      isFetching: false,
      error: null,
      point: { ...toTrackingPoint(pointPayload), timestamp: new Date(now - STALE_LOCATION_AGE_MS - 1000).toISOString() },
      now,
    });
    expect(stale).toBe('stale');
    expect(mayClaimAssociateOnTheWay(stale)).toBe(false);
    expect(liveStatusLabel(stale)).toBe('LOCATION STALE');
  });

  it('does not claim the associate is on the way without a fresh location', () => {
    const unavailable = liveLocationStatus({ isFetching: false, error: null, point: null });
    expect(unavailable).toBe('unavailable');
    expect(liveStatusMessage({ status: unavailable, error: null, timestamp: null })).toBe(ASSOCIATE_NOT_SHARING_MESSAGE);
    expect(mayClaimAssociateOnTheWay(unavailable)).toBe(false);
    expect(ASSOCIATE_ON_THE_WAY_MESSAGE).toMatch(/on the way/i);
  });

  it('maps network and API errors without fake markers', () => {
    const error = liveLocationStatus({
      isFetching: false,
      error: new ApiError('Unable to connect to AgeWell. Please check your internet connection.', undefined),
      point: null,
    });
    expect(error).toBe('error');
    expect(liveStatusMessage({ status: error, error: new ApiError('Unable to connect to AgeWell. Please check your internet connection.'), timestamp: null })).toMatch(/internet/i);
    const forbidden = liveLocationStatus({
      isFetching: false,
      error: new ApiError(LOCATION_FORBIDDEN_MESSAGE, 403),
      point: null,
    });
    expect(forbidden).toBe('forbidden');
  });

  it('pauses follow after a manual map gesture and resumes on follow', () => {
    expect(shouldFollowCamera('follow')).toBe(true);
    expect(nextFollowModeAfterGesture('follow')).toBe('free');
    expect(shouldFollowCamera('free')).toBe(false);
  });

  it('polls latest location only while focused', () => {
    const focused = careAssociateLatestQueryOptions('visit-1', true);
    const blurred = careAssociateLatestQueryOptions('visit-1', false);
    expect(focused.enabled).toBe(true);
    expect(focused.refetchInterval).toBe(CARE_ASSOCIATE_POLL_MS);
    expect(focused.queryKey).toEqual(['tracking', 'careAssociate', 'visit-1', 'latest']);
    expect(blurred.enabled).toBe(false);
    expect(blurred.refetchInterval).toBe(false);
    expect(trackingQueryKeys.careAssociateLatest('visit-1')).toEqual(focused.queryKey);
  });

  it('routes Senior, Family, and Care Manager from a real visit', () => {
    expect(seniorAssociateTrackHref('visit-1')).toEqual({ pathname: '/visits/[id]/track', params: { id: 'visit-1' } });
    expect(familyAssociateTrackHref('visit-1')).toEqual({ pathname: '/family/visits/[id]/track', params: { id: 'visit-1' } });
    expect(careAssociateShareHref('visit-1')).toEqual({ pathname: '/care/visits/[id]/share', params: { id: 'visit-1' } });
    expect(visitHasAssignedAssociate(visit)).toBe(true);
    expect(visitHasAssignedAssociate({ ...visit, careManagerId: null })).toBe(false);
    expect(pickTrackableVisit([{ ...visit, careManagerId: null }, visit])?.id).toBe('visit-1');
  });
});

describe('seed senior demo location', () => {
  it('starts at DGP Apartment in Velachery and moves toward the senior home every second', () => {
    const startedAt = new Date('2026-08-21T10:00:00Z');
    const start = withDemoCareAssociatePoint({
      email: 'senior@example.com',
      point: null,
      now: startedAt,
      tripStartedAt: startedAt,
    });
    expect(Number(start?.latitude)).toBeCloseTo(12.964608, 4);
    expect(Number(start?.longitude)).toBeCloseTo(80.244226, 4);

    const later = withDemoCareAssociatePoint({
      email: 'senior@example.com',
      point: null,
      now: new Date('2026-08-21T10:00:45Z'),
      tripStartedAt: startedAt,
    });
    expect(Number(later?.latitude)).toBeGreaterThan(Number(start?.latitude));
    expect(Number(later?.longitude)).toBeLessThan(Number(start?.longitude));

    const arrived = withDemoCareAssociatePoint({
      email: 'senior@example.com',
      point: null,
      now: new Date(startedAt.getTime() + demoTripDurationMs() + 1_000),
      tripStartedAt: startedAt,
    });
    expect(Number(arrived?.latitude)).toBeCloseTo(12.9884, 3);
    expect(Number(arrived?.longitude)).toBeCloseTo(80.2171, 3);
  });

  it('feeds a new point every second and gets closer to the Velachery home', () => {
    expect(DEMO_TICK_MS).toBe(1000);
    const first = demoTripAt(0);
    const second = demoTripAt(DEMO_TICK_MS);
    expect(haversineMeters(first.coordinate, DEMO_DGP_APARTMENT)).toBeLessThan(5);
    expect(haversineMeters(first.coordinate, second.coordinate)).toBeGreaterThan(10);
    expect(haversineMeters(second.coordinate, DEMO_SENIOR_HOME)).toBeLessThan(
      haversineMeters(first.coordinate, DEMO_SENIOR_HOME),
    );
    expect(demoTripDurationMs()).toBeGreaterThan(60_000);
    expect(first.remainingLabel).toMatch(/Arriving in \d+ min/);
  });

  it('does not give a demo pin to any other login', () => {
    expect(withDemoCareAssociatePoint({ email: 'senior2@example.com', point: null })).toBeNull();
    expect(withDemoCareAssociatePoint({ email: 'family@example.com', point: null })).toBeNull();
    expect(withDemoCareAssociatePoint({ email: 'care@example.com', point: null })).toBeNull();
    expect(withDemoCareAssociatePoint({ email: 'admin@example.com', point: null })).toBeNull();
  });

  it('leaves other users on the real API point', () => {
    const real = toTrackingPoint(pointPayload);
    const point = withDemoCareAssociatePoint({ email: 'family@example.com', point: real });
    expect(point?.id).toBe(pointPayload.id);
  });
});
