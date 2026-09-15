import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import { Icon } from '@/components/ui';
import { ErrorState, LoadingState } from '@/components';
import { useAuthStore } from '@/features/auth/authStore';
import { useMemberDelivery } from '@/features/deliveries/hooks';
import { deliveryExecutiveDisplayName } from '@/features/deliveries/selectors';
import { useSeniorProfile } from '@/features/home/hooks/queries';
import { humanizeStatus } from '@/features/home/selectors/homeViewModel';
import { formatLongDate, formatTime } from '@/utils/date';
import { safeGoBack } from '@/utils/navigation';
import { FollowChip } from './components/FollowChip';
import { LiveMapView } from './components/LiveMapView';
import { MapLegend } from './components/MapLegend';
import { TrackingBottomCard } from './components/TrackingBottomCard';
import { useDeliveryExecutiveLatestLocation, useOwnViewerLocation } from './hooks';
import {
  formatLastUpdated,
  liveLocationStatus,
  liveStatusMessage,
  parseMapCoordinate,
  parseSavedHomeCoordinate,
  type CameraFollowMode,
} from './live';
import { DELIVERY_NOT_SHARING_MESSAGE } from './selectors';

interface DeliveryLiveMapScreenProps {
  deliveryId: string | undefined;
}

function deliveryMeta(delivery: { scheduledAt: string | null; location: string | null; status: string }): string | null {
  const when = delivery.scheduledAt
    ? `${formatLongDate(delivery.scheduledAt)} · ${formatTime(delivery.scheduledAt)}`
    : null;
  const parts = [when, delivery.location, humanizeStatus(delivery.status)].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

export function DeliveryLiveMapScreen({ deliveryId }: DeliveryLiveMapScreenProps) {
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
  const [followMode, setFollowMode] = useState<CameraFollowMode>('follow');
  const [mapReady, setMapReady] = useState(false);
  const deliveryQuery = useMemberDelivery(deliveryId);
  const senior = useSeniorProfile();
  const latest = useDeliveryExecutiveLatestLocation(deliveryId, { focused });
  const ownLocation = useOwnViewerLocation();

  const delivery = deliveryQuery.data;
  const associateCoord = parseMapCoordinate(latest.data?.latitude, latest.data?.longitude);
  const seniorCoord = parseMapCoordinate(ownLocation.state.point?.latitude, ownLocation.state.point?.longitude);
  const homeCoord = parseSavedHomeCoordinate(senior.data?.address);
  const status = liveLocationStatus({
    isFetching: latest.isFetching,
    error: latest.error,
    point: latest.data,
  });
  const name = deliveryExecutiveDisplayName(delivery);
  const lastUpdated = formatLastUpdated(latest.data?.timestamp);
  const message = liveStatusMessage({
    status,
    error: latest.error,
    timestamp: latest.data?.timestamp,
  });
  const trackable = delivery?.status === 'EN_ROUTE';

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
          <Text style={styles.title}>Track Delivery</Text>
        </View>
      </View>
    ),
    [insets.top, navigation, role],
  );

  if (deliveryQuery.isPending && !delivery) {
    return (
      <View style={styles.root}>
        {header}
        <LoadingState message="Loading delivery..." />
      </View>
    );
  }

  if (deliveryQuery.isError || !delivery) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.padded}>
          <ErrorState
            title="Delivery unavailable"
            message="This delivery could not be found."
            onRetry={() => void deliveryQuery.refetch()}
          />
        </View>
      </View>
    );
  }

  const emptyMessage = trackable ? DELIVERY_NOT_SHARING_MESSAGE : 'This order is not out for delivery yet.';

  return (
    <View style={styles.root}>
      <LiveMapView
        associate={associateCoord}
        associateName={name}
        live={status === 'live' && trackable}
        senior={seniorCoord}
        seniorLive={Boolean(seniorCoord)}
        home={homeCoord}
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
          status={trackable ? status : 'unavailable'}
          name={name}
          visitTitle={delivery.title}
          visitMeta={deliveryMeta(delivery)}
          employeeId={null}
          lastUpdated={trackable ? lastUpdated : null}
          message={trackable ? (associateCoord ? message : emptyMessage) : emptyMessage}
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
    justifyContent: 'center',
  },
});
