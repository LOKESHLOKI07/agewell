import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfirmDialog, ErrorState, LoadingState, PrimaryButton, SecondaryButton } from '@/components';
import { Icon } from '@/components/ui';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import { useDeliveryDetail } from '@/features/care/hooks';
import { humanizeStatus } from '@/features/home/selectors/homeViewModel';
import { formatLongDate, formatTime } from '@/utils/date';
import { safeGoBack } from '@/utils/navigation';
import { FollowChip } from './components/FollowChip';
import { LiveMapView } from './components/LiveMapView';
import { TrackingBottomCard } from './components/TrackingBottomCard';
import { useDeliveryExecutiveLatestLocation, useStartCareAssociateLocation } from './hooks';
import {
  DELIVERY_SHARE_CONFIRM_MESSAGE,
  DELIVERY_SHARE_CONFIRM_TITLE,
  LOCATION_PERMISSION_MESSAGE,
  isLocationPermissionDeniedMessage,
} from './selectors';
import {
  formatLastUpdated,
  liveLocationStatus,
  liveStatusMessage,
  parseMapCoordinate,
  type CameraFollowMode,
} from './live';
import { useTrackingShareStore } from './shareStore';

interface DeliveryExecutiveShareScreenProps {
  deliveryId: string | undefined;
}

export function DeliveryExecutiveShareScreen({ deliveryId }: DeliveryExecutiveShareScreenProps) {
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
  const deliveryQuery = useDeliveryDetail(deliveryId);
  const latest = useDeliveryExecutiveLatestLocation(deliveryId, { focused });
  const startShare = useStartCareAssociateLocation();
  const isSharing = useTrackingShareStore((state) => state.isSharing);
  const stopShare = useTrackingShareStore((state) => state.stop);

  const delivery = deliveryQuery.data;
  const associateCoord = parseMapCoordinate(latest.data?.latitude, latest.data?.longitude);
  const status = liveLocationStatus({
    isFetching: latest.isFetching,
    error: latest.error,
    point: latest.data,
  });

  const onConfirmStart = async () => {
    setConfirmOpen(false);
    setShareError(null);
    const result = await startShare.mutateAsync();
    if (!result.ok) {
      setShareError(result.message);
    }
  };

  if (deliveryQuery.isPending && !delivery) {
    return (
      <View style={styles.root}>
        <LoadingState message="Loading delivery..." />
      </View>
    );
  }

  if (deliveryQuery.isError || !delivery) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Pressable onPress={() => safeGoBack(navigation.canGoBack(), role)} style={styles.backPlain} accessibilityRole="button" accessibilityLabel="Back">
          <Icon name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.padded}>
          <ErrorState title="Delivery unavailable" message="This delivery could not be found." onRetry={() => void deliveryQuery.refetch()} />
        </View>
      </View>
    );
  }

  const meta = [
    delivery.customerName,
    delivery.scheduledAt ? `${formatLongDate(delivery.scheduledAt)} · ${formatTime(delivery.scheduledAt)}` : null,
    humanizeStatus(delivery.status),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.root}>
      <LiveMapView
        associate={associateCoord}
        associateName="You"
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
        <Pressable onPress={() => safeGoBack(navigation.canGoBack(), role)} style={[styles.back, shadows.float]} accessibilityRole="button" accessibilityLabel="Back">
          <Icon name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={[styles.titleChip, shadows.float]}>
          <Text style={styles.title}>Share Delivery Location</Text>
        </View>
      </View>
      <View style={[styles.followWrap, { top: insets.top + 72 }]}>
        <FollowChip visible={followMode === 'free' && Boolean(associateCoord)} onPress={() => setFollowMode('follow')} />
      </View>
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        {isLocationPermissionDeniedMessage(shareError) ? (
          <View style={styles.notice}>
            <ErrorState
              title="Permission denied"
              message={shareError ?? LOCATION_PERMISSION_MESSAGE}
              onRetry={() => setConfirmOpen(true)}
            />
          </View>
        ) : null}
        {shareError && !isLocationPermissionDeniedMessage(shareError) ? (
          <View style={styles.notice}>
            <ErrorState title="Could not share location" message={shareError} onRetry={() => setConfirmOpen(true)} />
          </View>
        ) : null}
        <TrackingBottomCard
          status={isSharing ? status : associateCoord ? status : 'unavailable'}
          name={delivery.title}
          visitTitle={delivery.customerName ?? 'Customer delivery'}
          visitMeta={meta}
          employeeId={null}
          lastUpdated={formatLastUpdated(latest.data?.timestamp)}
          message={
            isSharing
              ? liveStatusMessage({ status, error: latest.error, timestamp: latest.data?.timestamp })
              : 'Share your live location so the senior can track this delivery on the map.'
          }
          followEnabled={followMode === 'follow'}
          onFollow={() => setFollowMode('follow')}
        />
        <View style={styles.actions}>
          {isSharing ? (
            <SecondaryButton label="Stop sharing" onPress={stopShare} />
          ) : (
            <PrimaryButton
              label="Share Live Location"
              loading={startShare.isPending}
              onPress={() => {
                setShareError(null);
                setConfirmOpen(true);
              }}
            />
          )}
        </View>
      </View>
      <ConfirmDialog
        visible={confirmOpen}
        title={DELIVERY_SHARE_CONFIRM_TITLE}
        message={DELIVERY_SHARE_CONFIRM_MESSAGE}
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
  root: { flex: 1, backgroundColor: colors.background },
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
  title: { ...typography.subtitle, color: colors.text },
  followWrap: { position: 'absolute', right: spacing.lg, zIndex: 3 },
  sheet: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: 0, zIndex: 3, gap: spacing.md },
  actions: { gap: spacing.sm },
  notice: { backgroundColor: colors.surfaceElevated, borderRadius: radius.xl, overflow: 'hidden' },
  padded: { flex: 1, padding: spacing.xl },
});
