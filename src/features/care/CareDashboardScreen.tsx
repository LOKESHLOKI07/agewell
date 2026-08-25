import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { AppCard, PrimaryButton, SectionTitle, StatTile } from '@/components';
import { getSectionState, humanizeStatus } from '@/features/home/selectors/homeViewModel';
import { queryClient } from '@/api/queryClient';
import { formatLongDate, formatTime } from '@/utils/date';
import { CareQueryView } from './components/CareQueryView';
import { CareScreen } from './components/CareScreen';
import { CareVisitCard } from './components/CareVisitCard';
import { TrackCareAssociateCard } from '@/features/tracking/components/TrackCareAssociateCard';
import { careAssociateShareHref } from '@/features/tracking/selectors';
import { invalidateTrackingQueries } from '@/features/tracking/queryKeys';
import { useCareManagerProfile, useCareManagerTodayVisits, useCareManagerUpcomingVisits, useVisitTasks } from './hooks';
import { careQueryKeys } from './queryKeys';
import { summarizeCareToday, taskDisplayName, taskStatusLabel, visitDetailHref, visitSeniorLabel } from './selectors';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { useUnreadNotifications } from '@/features/notifications/hooks';
import { notificationQueryKeys } from '@/features/notifications/queryKeys';

export function CareDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const profile = useCareManagerProfile();
  const today = useCareManagerTodayVisits();
  const upcoming = useCareManagerUpcomingVisits();
  const notifications = useUnreadNotifications();
  const summary = summarizeCareToday(today.data?.items ?? []);
  const tasks = useVisitTasks(summary.next?.id);

  const name = profile.data?.name ?? 'Care manager';
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
  const tasksState = getSectionState({
    isPending: tasks.isPending,
    isError: tasks.isError,
    isEmpty: (tasks.data?.length ?? 0) === 0,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: careQueryKeys.profile }),
        queryClient.invalidateQueries({ queryKey: careQueryKeys.visitsToday }),
        queryClient.invalidateQueries({ queryKey: careQueryKeys.visitsUpcoming }),
        queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all }),
        invalidateTrackingQueries(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const nextWhen = summary.next?.scheduledAt
    ? `${formatLongDate(summary.next.scheduledAt)} · ${formatTime(summary.next.scheduledAt)}`
    : 'Time not set';

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <CareScreen
        title="Care Manager Dashboard"
        subtitle={`Hi ${name}`}
        trailing={<NotificationBell unreadCount={notifications.data?.total ?? 0} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.primary} />
        }
      >
        <View style={styles.stats}>
          <StatTile compact title="Completed" value={String(summary.completed)} tone="safe" icon="checkmark-circle-outline" />
          <StatTile compact title="In Progress" value={String(summary.inProgress)} tone="warning" icon="time-outline" />
          <StatTile compact title="Upcoming" value={String(summary.upcoming)} tone="primary" icon="calendar-outline" />
        </View>

        {summary.next ? (
          <>
            <AppCard>
              <Text style={styles.nextLabel}>Next visit</Text>
              <Text style={styles.nextTitle}>{visitSeniorLabel(summary.next.seniorId)}</Text>
              <Text style={styles.nextMeta}>{nextWhen}</Text>
              <Text style={styles.nextMeta}>{humanizeStatus(summary.next.status)}</Text>
              <View style={styles.nextAction}>
                <PrimaryButton
                  label={summary.next.status === 'SCHEDULED' ? 'Start Visit' : 'Open Visit'}
                  onPress={() => {
                    if (!summary.next) {
                      return;
                    }
                    router.push(visitDetailHref(summary.next.id) as unknown as Href);
                  }}
                  accessibilityHint="Opens this visit"
                />
              </View>
            </AppCard>
            <SectionTitle title="Live location" />
            <TrackCareAssociateCard
              visit={summary.next}
              href={careAssociateShareHref(summary.next.id)}
              title="Share Live Location"
              actionLabel="Share"
            />
          </>
        ) : null}

        {summary.next ? (
          <>
            <SectionTitle title="Today's tasks" />
            <CareQueryView
              state={tasksState}
              error={tasks.error}
              onRetry={() => void tasks.refetch()}
              loadingMessage="Loading tasks..."
              emptyIcon="checkbox-outline"
              emptyTitle="No tasks"
              emptyMessage="Tasks for the next visit will appear here when they are on file."
            >
              <View style={styles.list}>
                {tasks.data?.map((task) => (
                  <AppCard key={task.id}>
                    <Text style={styles.taskName}>
                      {task.isCompleted ? '✓ ' : ''}
                      {taskDisplayName(task)}
                    </Text>
                    <Text style={styles.line}>{taskStatusLabel(task.isCompleted)}</Text>
                  </AppCard>
                ))}
              </View>
            </CareQueryView>
          </>
        ) : null}

        <SectionTitle title="Today's visits" />
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

        <SectionTitle title="Upcoming visits" />
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

        <Pressable
          style={styles.link}
          onPress={() => router.push('/(care)/visits' as Href)}
          accessibilityRole="button"
          accessibilityLabel="View all assigned visits"
        >
          <Text style={styles.linkLabel}>View all visits</Text>
        </Pressable>
      </CareScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  nextLabel: {
    ...typography.label,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  nextTitle: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.sm,
  },
  nextMeta: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  nextAction: {
    marginTop: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  taskName: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  line: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  link: {
    minHeight: minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  linkLabel: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
});
