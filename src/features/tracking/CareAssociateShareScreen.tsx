import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfirmDialog, ErrorState, LoadingState, PrimaryButton, SecondaryButton } from '@/components';
import { ApiError } from '@/api/errors';
import { Icon } from '@/components/ui';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import { useVisitDetail } from '@/features/care/hooks';
import { humanizeStatus } from '@/features/home/selectors/homeViewModel';
import { visitSeniorLabel } from '@/features/care/selectors';
import { FollowChip } from './components/FollowChip';
import { LiveMapView } from './components/LiveMapView';
import { TrackingBottomCard } from './components/TrackingBottomCard';
import { useCareAssociateLatestLocation, useStartCareAssociateLocation } from './hooks';
import {
  ASSOCIATE_SHARE_CONFIRM_MESSAGE,
  ASSOCIATE_SHARE_CONFIRM_TITLE,
  LOCATION_PERMISSION_MESSAGE,
} from './selectors';
import {
  associateDisplayName,
  formatLastUpdated,
  liveLocationStatus,
  liveStatusMessage,
  parseMapCoordinate,
  visitTimeLine,
  type CameraFollowMode,
} from './live';
import { useTrackingShareStore } from './shareStore';
import { useAuthStore } from '@/features/auth/authStore';
import { safeGoBack } from '@/utils/navigation';

interface CareAssociateShareScreenProps {
  visitId: string | undefined;
}

export function CareAssociateShareScreen({ visitId }: CareAssociateShareScreenProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const role = useAuthStore((state) => state.user?.role);
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [followMode, setFollowMode] = useState<CameraFollowMode>('follow');
  const [mapReady, setMapReady] = useState(false);
  const visitQuery = useVisitDetail(visitId);
  const latest = useCareAssociateLatestLocation(visitId, { focused });
  const startShare = useStartCareAssociateLocation();
  const isSharing = useTrackingShareStore((state) => state.isSharing);
  const stopShare = useTrackingShareStore((state) => state.stop);

  const visit = visitQuery.data;
  const associateCoord = parseMapCoordinate(latest.data?.latitude, latest.data?.longitude);
  const status = liveLocationStatus({
    isFetching: latest.isFetching,
    error: latest.error,
    point: latest.data,
  });
  const name = associateDisplayName(visit);
  const forbidden = visitQuery.error instanceof ApiError && visitQuery.error.status === 403;

  const onConfirmStart = async () => {
    setConfirmOpen(false);
    setShareError(null);
    const result = await startShare.mutateAsync();
    if (!result.ok) {
      setShareError(result.message);
    }
  };

  if (visitQuery.isPending && !visit) {
    return (
      <View style={styles.root}>
        <LoadingState message="Loading visit..." />
      </View>
    );
  }

  if (forbidden) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Pressable onPress={() => safeGoBack(navigation.canGoBack(), role)} style={styles.backPlain} accessibilityRole="button" accessibilityLabel="Back">
          <Icon name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.padded}>
          <ErrorState title="Visit unavailable" message="You don't have permission to access this information." />
        </View>
      </View>
    );
  }

  if (visitQuery.isError || !visit) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Pressable onPress={() => safeGoBack(navigation.canGoBack(), role)} style={styles.backPlain} accessibilityRole="button" accessibilityLabel="Back">
          <Icon name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.padded}>
          <ErrorState title="Visit unavailable" message="This visit could not be found." onRetry={() => void visitQuery.refetch()} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LiveMapView
        associate={associateCoord}
        associateName={name}
        live={status === 'live' && isSharing}
        senior={null}
        home={null}
        showDeviceLocation
        followMode={followMode}
        onUserGesture={() => setFollowMode('free')}
        mapReady={mapReady}
        onMapReady={() => setMapReady(true)}
      />
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
          <Text style={styles.title}>Share Live Location</Text>
        </View>
      </View>
      <View style={[styles.followWrap, { top: insets.top + 72 }]}>
        <FollowChip visible={followMode === 'free' && Boolean(associateCoord)} onPress={() => setFollowMode('follow')} />
      </View>
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        {shareError === LOCATION_PERMISSION_MESSAGE ? (
          <View style={styles.notice}>
            <ErrorState title="Permission denied" message={LOCATION_PERMISSION_MESSAGE} onRetry={() => setConfirmOpen(true)} />
          </View>
        ) : null}
        {shareError && shareError !== LOCATION_PERMISSION_MESSAGE ? (
          <View style={styles.notice}>
            <ErrorState title="Could not share location" message={shareError} onRetry={() => setConfirmOpen(true)} />
          </View>
        ) : null}
        <TrackingBottomCard
          status={isSharing ? status : associateCoord ? status : 'unavailable'}
          name={name}
          visitTitle={visitSeniorLabel(visit.seniorId)}
          visitMeta={visitTimeLine(visit) ?? humanizeStatus(visit.status)}
          employeeId={visit.employeeId}
          lastUpdated={formatLastUpdated(latest.data?.timestamp)}
          message={
            isSharing
              ? liveStatusMessage({ status, error: latest.error, timestamp: latest.data?.timestamp })
              : 'Share your live location with the senior and family for this visit.'
          }
          followEnabled={followMode === 'follow'}
          onFollow={() => setFollowMode('follow')}
        />
        <View style={styles.actions}>
          {isSharing ? (
            <SecondaryButton
              label="Stop sharing"
              onPress={stopShare}
              accessibilityHint="Stops sending your current location. This is only a local stop."
            />
          ) : (
            <PrimaryButton
              label="Share Live Location"
              loading={startShare.isPending}
              onPress={() => {
                setShareError(null);
                setConfirmOpen(true);
              }}
              accessibilityHint="Asks for location permission, then shares your current coordinates"
            />
          )}
        </View>
      </View>
      <ConfirmDialog
        visible={confirmOpen}
        title={ASSOCIATE_SHARE_CONFIRM_TITLE}
        message={ASSOCIATE_SHARE_CONFIRM_MESSAGE}
        confirmLabel="Start Sharing"
        cancelLabel="Cancel"
        onConfirm={() => {
          void onConfirmStart();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
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
  backPlain: {
    width: minTouchSize,
    height: minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
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
  },
  sheet: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 0,
    zIndex: 3,
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
  notice: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  padded: {
    flex: 1,
    padding: spacing.xl,
  },
});
