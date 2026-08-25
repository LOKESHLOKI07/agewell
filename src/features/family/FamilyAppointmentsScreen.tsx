import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import { EmptyState, SecondaryButton } from '@/components';
import { PillTabs } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { AppointmentDetailScreen } from '@/features/appointments/AppointmentDetailScreen';
import { BookAppointmentScreen } from '@/features/appointments/BookAppointmentScreen';
import {
  APPOINTMENT_FILTER_STATUSES,
  familyAppointmentBookHref,
  familyAppointmentHref,
} from '@/features/appointments/selectors';
import { HealthInfoCard } from '@/features/health/components/HealthInfoCard';
import { seniorDisplayName } from '@/features/home/api/mappers';
import { getSectionState, humanizeStatus } from '@/features/home/selectors/homeViewModel';
import { formatLongDate, formatTime } from '@/utils/date';
import { FamilyQueryView } from './components/FamilyQueryView';
import { FamilySubScreen } from './components/FamilySubScreen';
import { useFamilyAppointments, useFamilyProviders, useFamilyScope } from './hooks';

type AppointmentFilter = 'upcoming' | 'completed' | 'cancelled';

const TABS: { value: AppointmentFilter; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function FamilyAppointmentsScreen() {
  const { selectedSeniorId } = useFamilyScope();
  const query = useFamilyAppointments(selectedSeniorId, false);
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

  if (!selectedSeniorId) {
    return (
      <FamilySubScreen title="Appointments">
        <EmptyState
          icon="people-outline"
          title="No senior selected"
          message="Choose a senior from the Health tab first."
        />
      </FamilySubScreen>
    );
  }

  return (
    <FamilySubScreen title="Appointments">
      <View style={styles.book}>
        <SecondaryButton
          label="Book appointment"
          onPress={() => router.push(familyAppointmentBookHref() as Href)}
          accessibilityHint="Opens the booking form"
        />
      </View>
      <View style={styles.tabs}>
        <PillTabs value={tab} options={TABS} onChange={setTab} accessibilityLabel="Appointment filters" />
      </View>
      <FamilyQueryView
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
                onPress={() => router.push(familyAppointmentHref(item.id) as unknown as Href)}
                accessibilityRole="button"
                accessibilityLabel={`${item.doctorName ?? 'Appointment'}. ${lines.join('. ')}`}
                accessibilityHint="Opens this appointment"
              >
                <HealthInfoCard title={item.doctorName ?? 'Appointment'} lines={lines} />
              </Pressable>
            );
          })}
        </View>
      </FamilyQueryView>
    </FamilySubScreen>
  );
}

export function FamilyBookAppointmentScreen() {
  const { selectedSeniorId, selectedSenior, seniorsQuery } = useFamilyScope();
  const providersQuery = useFamilyProviders(selectedSeniorId);
  return (
    <BookAppointmentScreen
      subtitle={selectedSenior ? `For ${seniorDisplayName(selectedSenior)}` : null}
      seniorId={selectedSeniorId}
      seniorPending={seniorsQuery.isPending}
      providersQuery={providersQuery}
      successHref="/family/health/appointments"
      Shell={FamilySubScreen}
    />
  );
}

export function FamilyAppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AppointmentDetailScreen appointmentId={id} Shell={FamilySubScreen} />;
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
