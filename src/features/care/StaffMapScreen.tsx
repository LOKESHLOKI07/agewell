import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfirmDialog, ErrorState, LoadingState, PrimaryButton, SecondaryButton } from '@/components';
import { Icon } from '@/components/ui';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import { useCareManagerProfile, useCareManagerTodayVisits, useAttendanceToday } from '@/features/care/hooks';
import { summarizeCareToday, visitSeniorLabel } from '@/features/care/selectors';
import { dutySinceLabelFromAttendance, isAttendanceOnDuty } from '@/features/care/staffHomeModel';
import { FollowChip } from '@/features/tracking/components/FollowChip';
import { LiveMapView } from '@/features/tracking/components/LiveMapView';
import { TrackingBottomCard } from '@/features/tracking/components/TrackingBottomCard';
import {
  useCareAssociateLatestLocation,
  useDeviceMapCoordinate,
  useStartCareAssociateLocation,
} from '@/features/tracking/hooks';
import {
  ASSOCIATE_SHARE_CONFIRM_MESSAGE,
  ASSOCIATE_SHARE_CONFIRM_TITLE,
  LOCATION_PERMISSION_MESSAGE,
  careAssociateShareHref,
} from '@/features/tracking/selectors';
import {
  associateDisplayName,
  formatLastUpdated,
  liveLocationStatus,
  liveStatusMessage,
  parseMapCoordinate,
  pickTrackableVisit,
  type CameraFollowMode,
} from '@/features/tracking/live';
import { useTrackingShareStore } from '@/features/tracking/shareStore';

export function StaffMapScreen() {
  const insets = useSafeAreaInsets();
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const [followMode, setFollowMode] = useState<CameraFollowMode>('follow');
  const [mapReady, setMapReady] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const profile = useCareManagerProfile();
  const today = useCareManagerTodayVisits();
  const attendance = useAttendanceToday();
  const device = useDeviceMapCoordinate(focused);
  const startShare = useStartCareAssociateLocation();
  const isSharing = useTrackingShareStore((state) => state.isSharing);
  const shareKind = useTrackingShareStore((state) => state.kind);
  const stopShare = useTrackingShareStore((state) => state.stop);

  const nextVisit = useMemo(
    () => summarizeCareToday(today.data?.items ?? []).next ?? pickTrackableVisit(today.data?.items),
    [today.data?.items],
  );
  const latest = useCareAssociateLatestLocation(nextVisit?.id, { focused });
  const sharedCoord = parseMapCoordinate(latest.data?.latitude, latest.data?.longitude);
  const mapCoord = device.coordinate ?? sharedCoord;
  const onDuty = isAttendanceOnDuty(attendance.data);
  const sinceLabel = dutySinceLabelFromAttendance(attendance.data);
  const sharingActive = isSharing && shareKind === 'care-associate';
  const status = liveLocationStatus({
    isFetching: latest.isFetching,
    error: latest.error,
    point: latest.data,
  });
  const name = profile.data?.name?.trim() || associateDisplayName(nextVisit);

  const onConfirmStart = async () => {
    setConfirmOpen(false);
    setShareError(null);
    if (!nextVisit) {
      setShareError('Start or open a visit before sharing live location.');
      return;
    }
    const result = await startShare.mutateAsync();
    if (!result.ok) {
      setShareError(result.message);
    }
  };

  if ((today.isPending && !today.data) || (attendance.isPending && attendance.data === undefined)) {
    return (
      <View style={styles.root}>
        <LoadingState message="Loading map..." />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {mapCoord ? (
        <LiveMapView
          associate={mapCoord}
          associateName={name}
          live={sharingActive || Boolean(device.coordinate)}
          senior={null}
          home={null}
          showDeviceLocation
          followMode={followMode}
          onUserGesture={() => setFollowMode('free')}
          mapReady={mapReady}
          onMapReady={() => setMapReady(true)}
        />
      ) : (
        <View style={[styles.fallback, { paddingTop: insets.top + spacing.xl }]}>
          <ErrorState
            title="Location unavailable"
            message={device.permissionError ?? LOCATION_PERMISSION_MESSAGE}
            onRetry={() => {
              setMapReady(false);
              router.replace('/(care)/map' as Href);
            }}
          />
        </View>
      )}

      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={[styles.titleChip, shadows.float]}>
          <Text style={styles.title}>Live Location</Text>
        </View>
      </View>

      <View style={[styles.followWrap, { top: insets.top + 72 }]}>
        <FollowChip visible={followMode === 'free' && Boolean(mapCoord)} onPress={() => setFollowMode('follow')} />
      </View>

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        {shareError ? (
          <View style={styles.notice}>
            <ErrorState
              title="Could not share location"
              message={shareError}
              onRetry={() => {
                setShareError(null);
                setConfirmOpen(true);
              }}
            />
          </View>
        ) : null}

        <View style={[styles.statusCard, shadows.float]}>
          <View style={styles.statusRow}>
            <View style={styles.statusIcon}>
              <Icon name="shield-checkmark-outline" size={20} color={onDuty ? colors.safe : colors.textSecondary} />
            </View>
            <View style={styles.statusText}>
              <Text style={styles.statusLabel}>My Status</Text>
              <Text style={[styles.statusValue, { color: onDuty ? colors.safe : colors.textSecondary }]}>
                {onDuty ? 'On Duty' : 'Off Duty'}
              </Text>
              {onDuty && sinceLabel ? <Text style={styles.statusMeta}>Since {sinceLabel}</Text> : null}
              {attendance.data?.location ? <Text style={styles.statusMeta}>{attendance.data.location}</Text> : null}
              <Text style={styles.statusMeta}>
                {sharingActive
                  ? liveStatusMessage({ status, error: latest.error, timestamp: latest.data?.timestamp })
                  : device.coordinate
                    ? 'Showing your current GPS position'
                    : 'Waiting for GPS…'}
              </Text>
              {formatLastUpdated(latest.data?.timestamp) ? (
                <Text style={styles.statusMeta}>Last shared: {formatLastUpdated(latest.data?.timestamp)}</Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => router.push('/care/attendance' as Href)}
              accessibilityRole="button"
              accessibilityLabel="Open attendance"
              hitSlop={8}
            >
              <Icon name="chevron-down" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {nextVisit ? (
          <TrackingBottomCard
            status={sharingActive ? status : device.coordinate ? 'live' : 'unavailable'}
            name={name}
            visitTitle={visitSeniorLabel(nextVisit.seniorId)}
            visitMeta={nextVisit.notes?.trim() || "Today's visit"}
            employeeId={profile.data?.employeeId ?? null}
            lastUpdated={formatLastUpdated(latest.data?.timestamp)}
            message={
              sharingActive
                ? 'Seniors and family can see your live location for this visit.'
                : 'Share live location so the senior can track you on the way.'
            }
            followEnabled={followMode === 'follow'}
            onFollow={() => setFollowMode('follow')}
          />
        ) : null}

        <View style={styles.actions}>
          {sharingActive ? (
            <SecondaryButton label="Stop sharing" onPress={stopShare} />
          ) : (
            <PrimaryButton
              label={nextVisit ? 'Share Live Location' : 'No visit to share'}
              loading={startShare.isPending}
              disabled={!nextVisit || !device.coordinate}
              onPress={() => {
                setShareError(null);
                setConfirmOpen(true);
              }}
            />
          )}
          {nextVisit ? (
            <SecondaryButton
              label="Open visit map"
              onPress={() => router.push(careAssociateShareHref(nextVisit.id) as unknown as Href)}
            />
          ) : (
            <SecondaryButton label="Open Attendance" onPress={() => router.push('/care/attendance' as Href)} />
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
  fallback: {
    flex: 1,
    padding: spacing.xl,
  },
  header: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 3,
  },
  titleChip: {
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
  statusCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.safeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    flex: 1,
    gap: 2,
  },
  statusLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statusValue: {
    ...typography.subtitle,
  },
  statusMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  actions: {
    gap: spacing.sm,
  },
  notice: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
});
