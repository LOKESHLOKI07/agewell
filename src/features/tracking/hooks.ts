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
  fetchDeliveryExecutiveLatest,
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
import { newestSession, viewerLocationState, LOCATION_NO_FIX_MESSAGE } from './selectors';
import { useTrackingShareStore } from './shareStore';
import { startLiveLocationShare } from './sharing';
import {
  CARE_ASSOCIATE_POLL_MS,
  hasGpsCoordinate,
  locationAgeMs,
  STALE_LOCATION_AGE_MS,
  type MapCoordinate,
} from './live';
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

  return useQuery({
    queryKey: trackingQueryKeys.careAssociateLatest(visitId ?? ''),
    queryFn: () => fetchCareAssociateLatest(visitId as string),
    enabled: isAuthenticated && Boolean(visitId) && focused,
    refetchInterval: focused ? CARE_ASSOCIATE_POLL_MS : false,
  });
}

export function useDeliveryExecutiveLatestLocation(
  deliveryId: string | null | undefined,
  options?: { focused?: boolean },
) {
  const focused = options?.focused ?? true;
  const isAuthenticated = useAuthStore((state) => state.status === 'AUTHENTICATED');

  return useQuery({
    queryKey: trackingQueryKeys.deliveryExecutiveLatest(deliveryId ?? ''),
    queryFn: () => fetchDeliveryExecutiveLatest(deliveryId as string),
    enabled: isAuthenticated && Boolean(deliveryId) && focused,
    refetchInterval: focused ? CARE_ASSOCIATE_POLL_MS : false,
  });
}

/** Watches the device GPS for map pins. Real coordinates only — no demo fallback. */
export function useDeviceMapCoordinate(enabled: boolean) {
  const [coordinate, setCoordinate] = useState<MapCoordinate | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;
    let stop: (() => void) | undefined;

    void (async () => {
      const permission = await requestForegroundPermission();
      if (cancelled) {
        return;
      }
      if (permission.state !== 'granted') {
        setPermissionError(permission.message);
        setReady(true);
        return;
      }
      setPermissionError(null);
      try {
        const first = await readForegroundCoordinates();
        if (!cancelled) {
          setCoordinate({ latitude: first.latitude, longitude: first.longitude });
          setReady(true);
        }
      } catch (error) {
        if (!cancelled) {
          setPermissionError(error instanceof Error ? error.message : LOCATION_NO_FIX_MESSAGE);
          setReady(true);
        }
      }
      stop = await watchForegroundCoordinates((coords) => {
        if (cancelled) {
          return;
        }
        setCoordinate({ latitude: coords.latitude, longitude: coords.longitude });
      });
    })();

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [enabled]);

  return { coordinate, permissionError, ready };
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
