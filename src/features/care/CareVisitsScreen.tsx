import { StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/constants/theme';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { CareQueryView } from './components/CareQueryView';
import { CareScreen } from './components/CareScreen';
import { CareVisitCard } from './components/CareVisitCard';
import { useCareManagerTodayVisits, useCareManagerUpcomingVisits } from './hooks';
import { visitDetailHref } from './selectors';

export function CareVisitsScreen() {
  const insets = useSafeAreaInsets();
  const today = useCareManagerTodayVisits();
  const upcoming = useCareManagerUpcomingVisits();
  const todayState = getSectionState({
    isPending: today.isPending,
    isError: today.isError,
    isEmpty: (today.data?.items.length ?? 0) === 0,
  });
  const upcomingState = getSectionState({
    isPending: upcoming.isPending,
    isError: upcoming.isError,
    isEmpty: (upcoming.data?.items.length ?? 0) === 0,
  });

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <CareScreen title="Visits" subtitle="Assigned visits for today and upcoming.">
        <Text style={styles.sectionTitle}>Today</Text>
        <CareQueryView
          state={todayState}
          error={today.error}
          onRetry={() => void today.refetch()}
          loadingMessage="Loading today's visits..."
          emptyIcon="calendar-outline"
          emptyTitle="No visits today"
          emptyMessage="Assigned visits for today will appear here."
        >
          <View style={styles.list}>
            {today.data?.items.map((visit) => (
              <CareVisitCard
                key={visit.id}
                visit={visit}
                onPress={() => router.push(visitDetailHref(visit.id) as unknown as Href)}
              />
            ))}
          </View>
        </CareQueryView>

        <Text style={styles.sectionTitle}>Upcoming</Text>
        <CareQueryView
          state={upcomingState}
          error={upcoming.error}
          onRetry={() => void upcoming.refetch()}
          loadingMessage="Loading upcoming visits..."
          emptyIcon="time-outline"
          emptyTitle="No upcoming visits"
          emptyMessage="Upcoming assigned visits will appear here."
        >
          <View style={styles.list}>
            {upcoming.data?.items.map((visit) => (
              <CareVisitCard
                key={visit.id}
                visit={visit}
                onPress={() => router.push(visitDetailHref(visit.id) as unknown as Href)}
              />
            ))}
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
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
});
