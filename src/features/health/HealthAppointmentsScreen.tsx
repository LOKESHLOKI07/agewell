import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { SecondaryButton } from '@/components';
import { PillTabs } from '@/components/ui';
import { getSectionState, humanizeStatus } from '@/features/home/selectors/homeViewModel';
import { formatLongDate, formatTime } from '@/utils/date';
import { spacing } from '@/constants/theme';
import { HealthInfoCard } from './components/HealthInfoCard';
import { HealthQueryView } from './components/HealthQueryView';
import { HealthSubScreen } from './components/HealthSubScreen';
import { useAppointments } from './hooks';
import { APPOINTMENT_FILTER_STATUSES, healthAppointmentBookHref, healthAppointmentHref } from '@/features/appointments/selectors';

type AppointmentFilter = 'upcoming' | 'completed' | 'cancelled';

const TABS: { value: AppointmentFilter; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function HealthAppointmentsScreen() {
  const query = useAppointments();
  const [tab, setTab] = useState<AppointmentFilter>('upcoming');
  const items = useMemo(
    () => (query.data?.items ?? []).filter((item) => APPOINTMENT_FILTER_STATUSES[tab].includes(item.status)),
    [query.data?.items, tab],
  );
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: items.length === 0,
  });

  return (
    <HealthSubScreen title="Appointments">
      <View style={styles.book}>
        <SecondaryButton
          label="Book appointment"
          onPress={() => router.push(healthAppointmentBookHref() as Href)}
          accessibilityHint="Opens the booking form"
        />
      </View>
      <View style={styles.tabs}>
        <PillTabs value={tab} options={TABS} onChange={setTab} accessibilityLabel="Appointment filters" />
      </View>
      <HealthQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading appointments..."
        emptyIcon="calendar-outline"
        emptyTitle="No appointments"
        emptyMessage="Doctor appointments in this filter will appear here."
      >
        <View style={styles.list}>
          {items.map((item) => {
            const when = item.scheduledAt ? `${formatLongDate(item.scheduledAt)} · ${formatTime(item.scheduledAt)}` : null;
            const lines = [humanizeStatus(item.status), when].filter((line): line is string => Boolean(line));
            return (
              <Pressable
                key={item.id}
                onPress={() => router.push(healthAppointmentHref(item.id) as unknown as Href)}
                accessibilityRole="button"
                accessibilityLabel={`${item.doctorName ?? 'Appointment'}. ${lines.join('. ')}`}
                accessibilityHint="Opens this appointment"
              >
                <HealthInfoCard
                  title={item.doctorName ?? 'Appointment'}
                  icon="calendar"
                  tone="warning"
                  lines={lines}
                />
              </Pressable>
            );
          })}
        </View>
      </HealthQueryView>
    </HealthSubScreen>
  );
}

const styles = StyleSheet.create({
  book: {
    marginBottom: spacing.lg,
  },
  tabs: {
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
});
