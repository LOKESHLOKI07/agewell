import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { StatusBadge } from '@/components';
import { cardSurface, colors, spacing, tones, typography } from '@/constants/theme';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { formatLongDate, formatTime } from '@/utils/date';
import { CareQueryView } from './components/CareQueryView';
import { CareSubScreen } from './components/CareSubScreen';
import { useCareManagerVisits } from './hooks';
import { COMPLETED_VISIT_STATUSES, visitDetailHref, visitSeniorLabel } from './selectors';
import { asVisitList, staffVisitStatusPresentation } from './staffHomeModel';

function isThisMonth(value: string | null | undefined, now = new Date()): boolean {
  if (!value) {
    return false;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export function ServiceHistoryScreen() {
  const visitsQuery = useCareManagerVisits();
  const visits = asVisitList(visitsQuery.data?.items);
  const completed = useMemo(
    () =>
      visits.filter(
        (visit) =>
          COMPLETED_VISIT_STATUSES.has(visit.status) &&
          isThisMonth(visit.completedAt ?? visit.scheduledAt),
      ),
    [visits],
  );
  const state = getSectionState({
    isPending: visitsQuery.isPending,
    isError: visitsQuery.isError,
    isEmpty: completed.length === 0,
  });

  return (
    <CareSubScreen title="Service History">
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{completed.length}</Text>
          <Text style={styles.statLabel}>This month</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{visits.filter((visit) => COMPLETED_VISIT_STATUSES.has(visit.status)).length}</Text>
          <Text style={styles.statLabel}>All completed</Text>
        </View>
      </View>

      <CareQueryView
        state={state}
        error={visitsQuery.error}
        onRetry={() => void visitsQuery.refetch()}
        loadingMessage="Loading history..."
        emptyIcon="time-outline"
        emptyTitle="No completed visits"
        emptyMessage="Completed visits for this month will appear here."
      >
        <View style={styles.list}>
          {completed.map((visit) => {
            const status = staffVisitStatusPresentation(visit.status);
            const palette = tones[status.tone === 'default' ? 'primary' : status.tone];
            return (
              <View key={visit.id} style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.body}>
                    <Text style={styles.title}>{visitSeniorLabel(visit.seniorId)}</Text>
                    <Text style={styles.meta}>
                      {visit.scheduledAt
                        ? `${formatLongDate(visit.scheduledAt)} · ${formatTime(visit.scheduledAt)}`
                        : 'Time not set'}
                    </Text>
                  </View>
                  <StatusBadge
                    presentation={{
                      label: status.label,
                      color: palette.fg,
                      background: palette.bg,
                    }}
                  />
                </View>
                <Text
                  style={styles.link}
                  onPress={() => router.push(visitDetailHref(visit.id) as unknown as Href)}
                  accessibilityRole="link"
                >
                  View details
                </Text>
              </View>
            );
          })}
        </View>
      </CareQueryView>
    </CareSubScreen>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    ...cardSurface,
    flex: 1,
    padding: spacing.lg,
  },
  statValue: {
    ...typography.title,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    ...cardSurface,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  link: {
    ...typography.captionStrong,
    color: colors.primary,
    marginTop: spacing.md,
  },
});
