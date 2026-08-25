import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import { Icon } from '@/components/ui';
import { ApiError } from '@/api/errors';
import { ErrorState, LoadingState } from '@/components';
import { useAuthStore } from '@/features/auth/authStore';
import { useVisitDetail } from '@/features/care/hooks';
import { useSeniorViewerLocation, useCareAssociateLatestLocation, useOwnViewerLocation } from './hooks';
import { FollowChip } from './components/FollowChip';
import { LiveMapView } from './components/LiveMapView';
import { MapLegend } from './components/MapLegend';
import { TrackingBottomCard } from './components/TrackingBottomCard';
import {
  associateDisplayName,
  formatLastUpdated,
  liveLocationStatus,
  liveStatusMessage,
  parseMapCoordinate,
  parseSavedHomeCoordinate,
  visitHasAssignedAssociate,
  visitTimeLine,
  type CameraFollowMode,
} from './live';
import { ASSOCIATE_NOT_ASSIGNED_MESSAGE, ASSOCIATE_NOT_SHARING_MESSAGE } from './selectors';
import { isDemoSeniorEmail, startDemoCareAssociateTrip } from './demoLocation';
import { safeGoBack } from '@/utils/navigation';

interface CareAssociateLiveMapScreenProps {
  visitId: string | undefined;
  viewer: 'senior' | 'family';
  homeAddress?: string | null;
}

export function CareAssociateLiveMapScreen({ visitId, viewer, homeAddress }: CareAssociateLiveMapScreenProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const email = useAuthStore((state) => state.user?.email);
  const role = useAuthStore((state) => state.user?.role);
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      if (isDemoSeniorEmail(email)) {
        startDemoCareAssociateTrip();
      }
      setFocused(true);
      return () => setFocused(false);
    }, [email]),
  );
  const [followMode, setFollowMode] = useState<CameraFollowMode>('follow');
  const [mapReady, setMapReady] = useState(false);
  const visitQuery = useVisitDetail(visitId);
  const latest = useCareAssociateLatestLocation(visitId, { focused });
  const ownLocation = useOwnViewerLocation();
  const seniorLocation = useSeniorViewerLocation(viewer === 'family' ? visitQuery.data?.seniorId : null);

  const visit = visitQuery.data;
  const demoTrip = latest.demoTrip;
  const associateCoord =
    demoTrip?.coordinate ?? parseMapCoordinate(latest.data?.latitude, latest.data?.longitude);
  const seniorPoint = viewer === 'family' ? seniorLocation.state.point : ownLocation.state.point;
  const seniorCoord = parseMapCoordinate(seniorPoint?.latitude, seniorPoint?.longitude);
  const homeCoord = parseSavedHomeCoordinate(homeAddress);
  const status = liveLocationStatus({
    isFetching: latest.isFetching,
    error: latest.error,
    point: latest.data,
  });
  const name = associateDisplayName(visit);
  const lastUpdated = formatLastUpdated(latest.data?.timestamp);
  const message = liveStatusMessage({
    status,
    error: latest.error,
    timestamp: latest.data?.timestamp,
  });

  const assigned = visitHasAssignedAssociate(visit);
  const forbidden = status === 'forbidden' || (visitQuery.error instanceof ApiError && visitQuery.error.status === 403);

  const header = useMemo(
    () => (
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => safeGoBack(navigation.canGoBack(), role)}
          style={[styles.back, shadows.float]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Icon name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={[styles.titleChip, shadows.float]}>
          <Text style={styles.title}>Track Care Associate</Text>
        </View>
      </View>
    ),
    [insets.top, navigation, role],
  );

  if (visitQuery.isPending && !visit) {
    return (
      <View style={styles.root}>
        {header}
        <LoadingState message="Loading visit..." />
      </View>
    );
  }

  if (forbidden) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.padded}>
          <ErrorState
            title="Location unavailable"
            message="You don't have access to this senior's location."
            onRetry={() => {
              void visitQuery.refetch();
              void latest.refetch();
            }}
          />
        </View>
      </View>
    );
  }

  if (visitQuery.isError || !visit) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.padded}>
          <ErrorState
            title="Visit unavailable"
            message="This visit could not be found."
            onRetry={() => void visitQuery.refetch()}
          />
        </View>
      </View>
    );
  }

  const emptyMessage = !assigned ? ASSOCIATE_NOT_ASSIGNED_MESSAGE : ASSOCIATE_NOT_SHARING_MESSAGE;

  return (
    <View style={styles.root}>
      <LiveMapView
        associate={associateCoord}
        associateName={name}
        live={status === 'live'}
        heading={demoTrip?.heading}
        senior={seniorCoord}
        seniorLive={Boolean(seniorCoord)}
        home={homeCoord}
        traveledPath={demoTrip?.traveled}
        remainingPath={demoTrip?.remaining}
        showDeviceLocation={false}
        followMode={followMode}
        onUserGesture={() => setFollowMode('free')}
        mapReady={mapReady}
        onMapReady={() => setMapReady(true)}
      />
      {header}
      <View style={[styles.followWrap, { top: insets.top + 72 }]}>
        <FollowChip visible={followMode === 'free' && Boolean(associateCoord)} onPress={() => setFollowMode('follow')} />
        <MapLegend home={Boolean(homeCoord)} senior={Boolean(seniorCoord)} associate={Boolean(associateCoord)} />
      </View>
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <TrackingBottomCard
          status={assigned ? status : 'unavailable'}
          name={name}
          visitTitle="Today's Care Visit"
          visitMeta={demoTrip ? 'DGP Apartment, Velachery → Home' : visitTimeLine(visit)}
          employeeId={visit.employeeId}
          lastUpdated={assigned ? (demoTrip?.remainingLabel ?? lastUpdated) : null}
          message={assigned ? (associateCoord ? message : emptyMessage) : emptyMessage}
          followEnabled={followMode === 'follow'}
          onFollow={() => setFollowMode('follow')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    zIndex: 3,
  },
  back: {
    width: minTouchSize,
    height: minTouchSize,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleChip: {
    flex: 1,
    minHeight: minTouchSize,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.subtitle,
    color: colors.text,
  },
  followWrap: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 3,
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  sheet: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 0,
    zIndex: 3,
  },
  padded: {
    flex: 1,
    padding: spacing.xl,
    paddingTop: 96,
  },
});
