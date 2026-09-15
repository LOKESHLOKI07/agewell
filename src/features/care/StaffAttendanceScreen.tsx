import { Alert, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components';
import { Icon } from '@/components/ui';
import { cardSurface, colors, radius, spacing, typography } from '@/constants/theme';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { formatLongDate, formatTime } from '@/utils/date';
import { CareQueryView } from './components/CareQueryView';
import { CareSubScreen } from './components/CareSubScreen';
import { useAttendanceToday, useCheckIn, useCheckOut } from './hooks';
import { dutySinceLabelFromAttendance, isAttendanceOnDuty } from './staffHomeModel';

export function StaffAttendanceScreen() {
  const attendance = useAttendanceToday();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const onDuty = isAttendanceOnDuty(attendance.data);
  const sinceLabel = dutySinceLabelFromAttendance(attendance.data);
  const state = getSectionState({
    isPending: attendance.isPending,
    isError: attendance.isError,
    isEmpty: false,
  });
  const busy = checkIn.isPending || checkOut.isPending;

  const onCheckIn = async () => {
    try {
      await checkIn.mutateAsync('On site');
    } catch {
      Alert.alert('Check-in failed', 'Unable to check in right now. Please try again.');
    }
  };

  const onCheckOut = async () => {
    try {
      await checkOut.mutateAsync('Leaving site');
    } catch {
      Alert.alert('Check-out failed', 'Unable to check out right now. Please try again.');
    }
  };

  return (
    <CareSubScreen title="Attendance">
      <CareQueryView
        state={state}
        error={attendance.error}
        onRetry={() => void attendance.refetch()}
        loadingMessage="Loading attendance..."
        emptyIcon="time-outline"
        emptyTitle="No attendance"
        emptyMessage="Your duty check-in will appear here."
      >
        <View style={[styles.banner, onDuty ? styles.onDuty : styles.offDuty]}>
          <Icon
            name={onDuty ? 'shield-checkmark-outline' : 'alert-circle-outline'}
            size={24}
            color={onDuty ? colors.safe : colors.textSecondary}
          />
          <View style={styles.bannerText}>
            <Text style={[styles.bannerTitle, { color: onDuty ? colors.safe : colors.textSecondary }]}>
              {onDuty ? 'Checked In' : 'Not Checked In'}
            </Text>
            <Text style={styles.bannerBody}>
              {onDuty
                ? `On duty since ${sinceLabel ?? formatTime(attendance.data!.checkInAt)}`
                : 'Check in to start your duty shift.'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.value}>{attendance.data?.location?.trim() || 'Not shared yet'}</Text>
          {attendance.data?.checkInAt ? (
            <>
              <Text style={styles.label}>Check-in</Text>
              <Text style={styles.value}>
                {formatLongDate(attendance.data.checkInAt)} · {formatTime(attendance.data.checkInAt)}
              </Text>
            </>
          ) : null}
          {attendance.data?.checkOutAt ? (
            <>
              <Text style={styles.label}>Check-out</Text>
              <Text style={styles.value}>
                {formatLongDate(attendance.data.checkOutAt)} · {formatTime(attendance.data.checkOutAt)}
              </Text>
            </>
          ) : null}
        </View>

        <View style={styles.actions}>
          {onDuty ? (
            <PrimaryButton label="Check Out" onPress={() => void onCheckOut()} loading={busy} />
          ) : (
            <PrimaryButton label="Check In" onPress={() => void onCheckIn()} loading={busy} />
          )}
        </View>
      </CareQueryView>
    </CareSubScreen>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  onDuty: {
    backgroundColor: colors.safeSoft,
  },
  offDuty: {
    backgroundColor: colors.surfaceMuted,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    ...typography.subtitle,
  },
  bannerBody: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  card: {
    ...cardSurface,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  value: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.xs,
  },
  actions: {
    gap: spacing.md,
  },
});
