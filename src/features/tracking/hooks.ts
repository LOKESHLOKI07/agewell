import { useEffect, useState } from 'react';
import { useMutation, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import type { ListPage } from '@/features/home/types/home';
import {
  createCareAssociatePoint,
  createCareAssociateSession,
  createTrackingPoint,
  createTrackingSession,
  fetchCareAssociateLatest,
  fetchCareAssociateSession,
  fetchLatestPoint,
  fetchTrackingSessions,
} from './api';
import {
  readForegroundCoordinates,
  checkForegroundPermission,
  requestForegroundPermission,
  toTrackingPointCreate,
  watchForegroundCoordinates,
} from './location';
import { invalidateTrackingQueries, trackingQueryKeys } from './queryKeys';
import { newestSession, viewerLocationState } from './selectors';
import { useTrackingShareStore } from './shareStore';
import { startLiveLocationShare } from './sharing';
import { CARE_ASSOCIATE_POLL_MS, hasGpsCoordinate, locationAgeMs, STALE_LOCATION_AGE_MS } from './live';
import {
  DEMO_TICK_MS,
  getDemoTripSnapshot,
  isDemoSeniorEmail,
  withDemoCareAssociatePoint,
} from './demoLocation';
import type { TrackingPointCreate, TrackingSession } from './types';

function useAuthedQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  enabled = true,
): UseQueryResult<T> {
  const isAuthenticated = useAuthStore((state) => state.status === 'AUTHENTICATED');
  return useQuery({
    queryKey,
    queryFn,
    enabled: isAuthenticated && enabled,
  });
}

export function useMyTrackingSessions() {
  return useAuthedQuery<ListPage<TrackingSession>>(trackingQueryKeys.mine, () => fetchTrackingSessions());
}

export function useSeniorTrackingSessions(seniorId: string | null | undefined) {
  return useAuthedQuery<ListPage<TrackingSession>>(
    trackingQueryKeys.senior(seniorId ?? ''),
    () => fetchTrackingSessions(seniorId as string),
    Boolean(seniorId),
  );
}

export function useViewerLocationFromSessions(
  sessions: UseQueryResult<ListPage<TrackingSession>>,
) {
  const session = newestSession(sessions.data?.items);
  const latest = useLatestPoint(session?.id);
  return {
    sessions,
    latest,
    session,
    state: viewerLocationState({
      sessionsPending: sessions.isPending,
      sessionsError: sessions.error,
      sessions: sessions.data,
      latestPending: latest.isPending && Boolean(session?.id),
      latestError: latest.error,
      latest: latest.data,
    }),
  };
}

export function useOwnViewerLocation() {
  return useViewerLocationFromSessions(useMyTrackingSessions());
}

export function useSeniorViewerLocation(seniorId: string | null | undefined) {
  return useViewerLocationFromSessions(useSeniorTrackingSessions(seniorId));
}

export function useLatestPoint(sessionId: string | null | undefined) {
  const isAuthenticated = useAuthStore((state) => state.status === 'AUTHENTICATED');
  return useQuery({
    queryKey: trackingQueryKeys.latest(sessionId ?? ''),
    queryFn: () => fetchLatestPoint(sessionId as string),
    enabled: isAuthenticated && Boolean(sessionId),
    refetchInterval: sessionId ? CARE_ASSOCIATE_POLL_MS : false,
  });
}

export function useCreateTrackingSession() {
  return useMutation({
    mutationFn: createTrackingSession,
    onSuccess: async () => {
      await invalidateTrackingQueries();
    },
  });
}

export function useCreateTrackingPoint() {
  return useMutation({
    mutationFn: ({ sessionId, point }: { sessionId: string; point: TrackingPointCreate }) =>
      createTrackingPoint(sessionId, point),
    onSuccess: async () => {
      await invalidateTrackingQueries();
    },
  });
}

export function useStartLiveLocation(existingSessionId?: string | null) {
  const startShare = useTrackingShareStore((state) => state.start);

  return useMutation({
    mutationFn: () =>
      startLiveLocationShare({
        requestPermission: requestForegroundPermission,
        readCoordinates: readForegroundCoordinates,
        createSession: createTrackingSession,
        postPoint: createTrackingPoint,
        toPoint: toTrackingPointCreate,
        existingSessionId: existingSessionId ?? null,
      }),
    onSuccess: async (result) => {
      if (!result.ok) {
        return;
      }
      startShare(result.sessionId, 'senior');
      await invalidateTrackingQueries();
    },
  });
}

export function useStartCareAssociateLocation() {
  const startShare = useTrackingShareStore((state) => state.start);

  return useMutation({
    mutationFn: () =>
      startLiveLocationShare({
        requestPermission: requestForegroundPermission,
        readCoordinates: readForegroundCoordinates,
        createSession: createCareAssociateSession,
        postPoint: createCareAssociatePoint,
        toPoint: toTrackingPointCreate,
      }),
    onSuccess: async (result) => {
      if (!result.ok) {
        return;
      }
      startShare(result.sessionId, 'care-associate');
      await invalidateTrackingQueries();
    },
  });
}

export function useCareAssociateSession(visitId: string | null | undefined, enabled = true) {
  return useAuthedQuery<TrackingSession>(
    trackingQueryKeys.careAssociateSession(visitId ?? ''),
    () => fetchCareAssociateSession(visitId as string),
    Boolean(visitId) && enabled,
  );
}

export function useCareAssociateLatestLocation(
  visitId: string | null | undefined,
  options?: { focused?: boolean },
) {
  const focused = options?.focused ?? true;
  const isAuthenticated = useAuthStore((state) => state.status === 'AUTHENTICATED');
  const email = useAuthStore((state) => state.user?.email);
  const isDemo = isDemoSeniorEmail(email);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!isDemo || !focused) {
      return undefined;
    }
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), DEMO_TICK_MS);
    return () => clearInterval(id);
  }, [isDemo, focused]);

  const query = useQuery({
    queryKey: trackingQueryKeys.careAssociateLatest(visitId ?? ''),
    queryFn: () => fetchCareAssociateLatest(visitId as string),
    enabled: isAuthenticated && Boolean(visitId) && focused && !isDemo,
    refetchInterval: !isDemo && focused ? CARE_ASSOCIATE_POLL_MS : false,
  });
  const now = new Date(nowMs);
  const demoTrip = getDemoTripSnapshot({ email, now });
  return {
    ...query,
    data: withDemoCareAssociatePoint({ email, point: query.data, now }),
    error: isDemo ? null : query.error,
    isFetching: isDemo ? false : query.isFetching,
    isPending: isDemo ? false : query.isPending,
    demoTrip,
  };
}

export function useResumeSeniorLiveLocation() {
  const role = useAuthStore((state) => state.user?.role);
  const isSharing = useTrackingShareStore((state) => state.isSharing);
  const stoppedSessionId = useTrackingShareStore((state) => state.stoppedSessionId);
  const startShare = useTrackingShareStore((state) => state.start);
  const viewer = useOwnViewerLocation();
  const sessionId = viewer.state.sessionId;

  useEffect(() => {
    if (role !== 'SENIOR' || isSharing || !sessionId || sessionId === stoppedSessionId) {
      return undefined;
    }
    if (!hasGpsCoordinate(viewer.state.point)) {
      return undefined;
    }
    const age = locationAgeMs(viewer.state.point?.timestamp);
    if (age === null || age >= STALE_LOCATION_AGE_MS) {
      return undefined;
    }

    let cancelled = false;
    void checkForegroundPermission().then((permission) => {
      if (cancelled || permission.state !== 'granted') {
        return;
      }
      startShare(sessionId, 'senior');
    });
    return () => {
      cancelled = true;
    };
  }, [role, isSharing, sessionId, stoppedSessionId, startShare, viewer.state.point]);
}

export function useForegroundLocationWatch(enabled: boolean, sessionId: string | null) {
  const kind = useTrackingShareStore((state) => state.kind);
  useEffect(() => {
    if (!enabled || !sessionId) {
      return undefined;
    }

    let cancelled = false;
    let stop: (() => void) | undefined;
    const postPoint = kind === 'care-associate' ? createCareAssociatePoint : createTrackingPoint;

    void (async () => {
      stop = await watchForegroundCoordinates((coords) => {
        if (cancelled) {
          return;
        }
        void postPoint(sessionId, toTrackingPointCreate(coords))
          .then(() => invalidateTrackingQueries())
          .catch(() => undefined);
      });
    })();

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [enabled, sessionId, kind]);
}
