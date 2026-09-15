import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { PrimaryButton, SecondaryButton, StatusBadge } from '@/components';
import { cardSurface, colors, spacing, tones, typography } from '@/constants/theme';
import { getSectionState, humanizeStatus } from '@/features/home/selectors/homeViewModel';
import { formatLongDate, formatTime } from '@/utils/date';
import { CareQueryView } from './components/CareQueryView';
import { CareSubScreen } from './components/CareSubScreen';
import { useVisitDetail, useVisitTasks } from './hooks';
import {
  taskDisplayName,
  taskStatusLabel,
  visitActiveHref,
  visitSeniorLabel,
  visitStartHref,
} from './selectors';

export function StaffTaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const visitQuery = useVisitDetail(id);
  const tasksQuery = useVisitTasks(id);
  const visit = visitQuery.data;
  const status = visit?.status?.toUpperCase() ?? '';
  const canStart = status === 'SCHEDULED' || status === 'CHECKED_IN';
  const canResume = status === 'IN_PROGRESS';
  const isDone = status === 'COMPLETED' || status === 'CHECKED_OUT';

  const visitState = getSectionState({
    isPending: visitQuery.isPending,
    isError: visitQuery.isError,
    isEmpty: visitQuery.isSuccess && !visitQuery.data,
  });
  const when = visit?.scheduledAt ? `${formatLongDate(visit.scheduledAt)} · ${formatTime(visit.scheduledAt)}` : null;
  const statusTone = isDone ? tones.safe : canResume ? tones.warning : tones.info;

  return (
    <CareSubScreen title="Task Details">
      <CareQueryView
        state={visitState}
        error={visitQuery.error}
        onRetry={() => void visitQuery.refetch()}
        loadingMessage="Loading task..."
        emptyIcon="document-text-outline"
        emptyTitle="Task not found"
        emptyMessage="This visit is not available."
      >
        {visit ? (
          <>
            <View style={styles.card}>
              <View style={styles.statusRow}>
                <Text style={styles.heading}>{visitSeniorLabel(visit.seniorId)}</Text>
                <StatusBadge
                  presentation={{
                    label: humanizeStatus(visit.status),
                    color: statusTone.fg,
                    background: statusTone.bg,
                  }}
                />
              </View>
              <Text style={styles.label}>Scheduled</Text>
              <Text style={styles.value}>{when ?? 'Time not set'}</Text>
              <Text style={styles.label}>Notes</Text>
              <Text style={styles.value}>{visit.notes ?? 'No notes on file'}</Text>
              <Text style={styles.label}>Tasks</Text>
              <Text style={styles.value}>
                {(tasksQuery.data ?? []).length > 0
                  ? `${tasksQuery.data!.filter((task) => task.isCompleted).length}/${tasksQuery.data!.length} completed`
                  : 'No checklist yet'}
              </Text>
            </View>

            {(tasksQuery.data ?? []).length > 0 ? (
              <View style={styles.list}>
                {tasksQuery.data!.map((task) => (
                  <View key={task.id} style={styles.taskRow}>
                    <Text style={styles.taskName}>{taskDisplayName(task)}</Text>
                    <Text style={styles.taskMeta}>{taskStatusLabel(task.isCompleted)}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.actions}>
              <SecondaryButton
                label="Share Live Location"
                onPress={() => {
                  if (!visit) {
                    return;
                  }
                  router.push({ pathname: '/care/visits/[id]/share', params: { id: visit.id } } as unknown as Href);
                }}
              />
              <SecondaryButton
                label="Navigate"
                onPress={() => {
                  const query = visit?.notes?.trim() || 'Kandivali West Mumbai';
                  void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
                }}
              />
              {canStart ? (
                <PrimaryButton
                  label="Start Task"
                  onPress={() => router.push(visitStartHref(visit.id) as unknown as Href)}
                />
              ) : null}
              {canResume ? (
                <PrimaryButton
                  label="Resume Task"
                  onPress={() => router.push(visitActiveHref(visit.id) as unknown as Href)}
                />
              ) : null}
              {isDone ? (
                <PrimaryButton
                  label="View Completion"
                  onPress={() => Alert.alert('Completed', 'This task is already marked complete.')}
                />
              ) : null}
            </View>
          </>
        ) : null}
      </CareQueryView>
    </CareSubScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardSurface,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  heading: {
    ...typography.subtitle,
    color: colors.text,
    flex: 1,
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
  list: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  taskRow: {
    ...cardSurface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  taskName: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  taskMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    gap: spacing.md,
  },
});
