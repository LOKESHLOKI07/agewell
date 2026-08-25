import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfirmDialog, ErrorState, Icon, PrimaryButton, SecondaryButton } from '@/components';
import { cardSurface, colors, layout, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { useSeniorProfile } from '@/features/home/hooks/queries';
import { GpsStatusCard } from './components/GpsStatusCard';
import { LiveMapView } from './components/LiveMapView';
import { useOwnViewerLocation, useStartLiveLocation } from './hooks';
import {
  LOCATION_PERMISSION_MESSAGE,
  SHARING_CONFIRM_MESSAGE,
  SHARING_CONFIRM_TITLE,
} from './selectors';
import {
  hasGpsCoordinate,
  homeTrackingCopy,
  liveLocationStatus,
  parseMapCoordinate,
  parseSavedHomeCoordinate,
  type CameraFollowMode,
} from './live';
import { useTrackingShareStore } from './shareStore';

export function SeniorTrackingScreen() {
  const insets = useSafeAreaInsets();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [followMode, setFollowMode] = useState<CameraFollowMode>('follow');
  const [mapReady, setMapReady] = useState(false);
  const [fitToken, setFitToken] = useState(0);
  const isSharing = useTrackingShareStore((state) => state.isSharing);
  const stopShare = useTrackingShareStore((state) => state.stop);
  const viewer = useOwnViewerLocation();
  const startShare = useStartLiveLocation(viewer.session?.id);
  const senior = useSeniorProfile();
  const copy = homeTrackingCopy({ isSharing, state: viewer.state });
  const seniorCoord = parseMapCoordinate(viewer.state.point?.latitude, viewer.state.point?.longitude);
  const homeCoord = parseSavedHomeCoordinate(senior.data?.address);
  const seniorLive =
    liveLocationStatus({
      isFetching: viewer.latest.isFetching,
      error: viewer.latest.error,
      point: viewer.state.point,
    }) === 'live';

  const onRefresh = async () => {
    await Promise.allSettled([viewer.sessions.refetch(), viewer.latest.refetch(), senior.refetch()]);
  };

  const onConfirmStart = async () => {
    setConfirmOpen(false);
    setShareError(null);
    const result = await startShare.mutateAsync();
    if (!result.ok) {
      setShareError(result.message);
    }
  };

  const onRecenter = () => {
    setFollowMode('follow');
    setFitToken((token) => token + 1);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Live Tracking" showBack showProfile={false} centerTitle />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        nestedScrollEnabled
        refreshControl={
          <RefreshControl
            refreshing={viewer.sessions.isRefetching || viewer.latest.isRefetching}
            onRefresh={() => void onRefresh()}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.intro}>
          Share your current location with authorized family members and assigned care staff. A saved home pin stays
          fixed and is never treated as live GPS.
        </Text>

        {shareError === LOCATION_PERMISSION_MESSAGE ? (
          <ErrorState
            title="Permission denied"
            message={LOCATION_PERMISSION_MESSAGE}
            onRetry={() => setConfirmOpen(true)}
          />
        ) : null}

        {shareError && shareError !== LOCATION_PERMISSION_MESSAGE ? (
          <ErrorState title="Could not share location" message={shareError} onRetry={() => setConfirmOpen(true)} />
        ) : null}

        {viewer.state.kind === 'error' && !shareError ? (
          <ErrorState
            title={viewer.state.title}
            message={viewer.state.message}
            onRetry={() => {
              void viewer.sessions.refetch();
              void viewer.latest.refetch();
            }}
          />
        ) : null}

        <View style={styles.card}>
          <View style={styles.mapArea} collapsable={false}>
            <LiveMapView
              associate={null}
              associateName="Care Associate"
              live={false}
              senior={seniorCoord}
              seniorLive={seniorLive}
              home={homeCoord}
              showDeviceLocation={false}
              followMode={followMode}
              onUserGesture={() => setFollowMode('free')}
              mapReady={mapReady}
              onMapReady={() => setMapReady(true)}
              fitToken={fitToken}
            />
            {seniorCoord ? (
              <View style={[styles.seniorPill, shadows.float]} accessibilityRole="text" accessibilityLabel="Senior">
                <Icon name="location" size={14} color={colors.emergency} />
                <Text style={styles.seniorPillLabel}>Senior</Text>
              </View>
            ) : null}
            <Pressable
              onPress={onRecenter}
              style={({ pressed }) => [styles.gear, pressed ? styles.gearPressed : null]}
              accessibilityRole="button"
              accessibilityLabel="Recenter map"
              accessibilityHint="Fits the map on your location and home pin"
            >
              <Icon name="settings-outline" size={18} color={colors.white} />
            </Pressable>
          </View>
          <View style={styles.coords}>
            <GpsStatusCard
              variant="coords"
              title={copy.title}
              message={copy.subtitle}
              point={viewer.state.point}
              sharing={isSharing || hasGpsCoordinate(viewer.state.point)}
            />
          </View>
        </View>

        <View style={styles.actions}>
          {isSharing ? (
            <SecondaryButton
              label="Stop sharing"
              pill
              onPress={stopShare}
              accessibilityHint="Stops sending your current location from this device."
            />
          ) : (
            <PrimaryButton
              label="Start Sharing"
              pill
              loading={startShare.isPending}
              onPress={() => {
                setShareError(null);
                setConfirmOpen(true);
              }}
              accessibilityHint="Asks for location permission, then shares your current coordinates"
            />
          )}
        </View>
      </ScrollView>
      <ConfirmDialog
        visible={confirmOpen}
        title={SHARING_CONFIRM_TITLE}
        message={SHARING_CONFIRM_MESSAGE}
        confirmLabel="Share location"
        cancelLabel="Not now"
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.huge,
    gap: spacing.lg,
  },
  intro: {
    ...typography.body,
    color: colors.textSecondary,
    paddingTop: spacing.sm,
  },
  card: {
    ...cardSurface,
    overflow: 'hidden',
  },
  mapArea: {
    height: 240,
    backgroundColor: colors.surfaceMuted,
    position: 'relative',
  },
  seniorPill: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 28,
  },
  seniorPillLabel: {
    ...typography.captionStrong,
    color: colors.text,
  },
  gear: {
    position: 'absolute',
    right: spacing.md,
    top: 108,
    width: minTouchSize,
    height: minTouchSize,
    borderRadius: radius.full,
    backgroundColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearPressed: {
    opacity: 0.88,
  },
  coords: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  actions: {
    marginTop: spacing.sm,
  },
});
