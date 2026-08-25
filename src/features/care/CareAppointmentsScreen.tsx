import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';
import { getSectionState, humanizeStatus } from '@/features/home/selectors/homeViewModel';
import { formatLongDate, formatTime } from '@/utils/date';
import { HealthInfoCard } from '@/features/health/components/HealthInfoCard';
import { CareQueryView } from './components/CareQueryView';
import { CareScreen } from './components/CareScreen';
import { useCareManagerAppointments } from './hooks';

export function CareAppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const query = useCareManagerAppointments();
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: (query.data?.items.length ?? 0) === 0,
  });

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <CareScreen title="Appointments" subtitle="Appointments the server allows you to see.">
        <CareQueryView
          state={state}
          error={query.error}
          onRetry={() => void query.refetch()}
          loadingMessage="Loading appointments..."
          emptyIcon="calendar-outline"
          emptyTitle="No appointments"
          emptyMessage="Appointments will appear here if you have access."
        >
          <View style={styles.list}>
            {query.data?.items.map((item) => {
              const when = item.scheduledAt
                ? `${formatLongDate(item.scheduledAt)} · ${formatTime(item.scheduledAt)}`
                : null;
              return (
                <HealthInfoCard
                  key={item.id}
                  title={item.doctorName ?? 'Appointment'}
                  lines={[humanizeStatus(item.status), when].filter((line): line is string => Boolean(line))}
                />
              );
            })}
          </View>
        </CareQueryView>
      </CareScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    gap: spacing.md,
  },
});
