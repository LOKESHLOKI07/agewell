import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { getSectionState, humanizeStatus } from '@/features/home/selectors/homeViewModel';
import { formatLongDate, formatTime } from '@/utils/date';
import { seniorDisplayName } from '@/features/home/api/mappers';
import { taskDisplayName, taskStatusLabel } from '@/features/care/selectors';
import { FamilyQueryView } from './components/FamilyQueryView';
import { FamilySubScreen } from './components/FamilySubScreen';
import { TrackCareAssociateCard } from '@/features/tracking/components/TrackCareAssociateCard';
import { familyAssociateTrackHref } from '@/features/tracking/selectors';
import { useFamilyScope, useFamilyVisitDetail, useFamilyVisitReports, useFamilyVisitTasks } from './hooks';

export function FamilyVisitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedSenior } = useFamilyScope();
  const visitQuery = useFamilyVisitDetail(id);
  const tasksQuery = useFamilyVisitTasks(id);
  const reportsQuery = useFamilyVisitReports(id);
  const visit = visitQuery.data;
  const when = visit?.scheduledAt ? `${formatLongDate(visit.scheduledAt)} · ${formatTime(visit.scheduledAt)}` : null;
  const parentName = selectedSenior ? seniorDisplayName(selectedSenior) : 'Selected senior';

  const visitState = getSectionState({
    isPending: visitQuery.isPending,
    isError: visitQuery.isError,
    isEmpty: visitQuery.isSuccess && !visitQuery.data,
  });
  const tasksState = getSectionState({
    isPending: tasksQuery.isPending,
    isError: tasksQuery.isError,
    isEmpty: (tasksQuery.data?.length ?? 0) === 0,
  });
  const reportsState = getSectionState({
    isPending: reportsQuery.isPending,
    isError: reportsQuery.isError,
    isEmpty: (reportsQuery.data?.length ?? 0) === 0,
  });

  return (
    <FamilySubScreen title="Visit">
      <FamilyQueryView
        state={visitState}
        error={visitQuery.error}
        onRetry={() => void visitQuery.refetch()}
        loadingMessage="Loading visit..."
        emptyIcon="document-text-outline"
        emptyTitle="Visit not found"
        emptyMessage="This visit is not available."
      >
        {visit ? (
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.label}>Senior</Text>
            <Text style={styles.value}>{parentName}</Text>
            <Text style={styles.label}>Time</Text>
            <Text style={styles.value}>{when ?? 'Time not set'}</Text>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{humanizeStatus(visit.status)}</Text>
            <Text style={styles.label}>Care manager</Text>
            <Text style={styles.value}>{visit.careManagerName ?? 'Not assigned'}</Text>
            <Text style={styles.label}>Employee ID</Text>
            <Text style={styles.value}>{visit.employeeId ?? 'Not on file'}</Text>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.value}>{visit.notes ?? 'No notes on file'}</Text>
          </View>
        ) : null}
      </FamilyQueryView>

      {visit ? (
        <>
          <Text style={styles.section}>Live tracking</Text>
          <TrackCareAssociateCard visit={visit} href={familyAssociateTrackHref(visit.id)} />
        </>
      ) : null}

      <Text style={styles.section}>Tasks</Text>
      <FamilyQueryView
        state={tasksState}
        error={tasksQuery.error}
        onRetry={() => void tasksQuery.refetch()}
        loadingMessage="Loading tasks..."
        emptyIcon="checkbox-outline"
        emptyTitle="No tasks"
        emptyMessage="Visit tasks will appear here when they are on file."
      >
        <View style={styles.list}>
          {tasksQuery.data?.map((task) => (
            <View key={task.id} style={[styles.card, shadows.card]}>
              <Text style={styles.taskName}>
                {task.isCompleted ? '✓ ' : ''}
                {taskDisplayName(task)}
              </Text>
              <Text style={styles.line}>{taskStatusLabel(task.isCompleted)}</Text>
            </View>
          ))}
        </View>
      </FamilyQueryView>

      <Text style={styles.section}>Visit report</Text>
      <FamilyQueryView
        state={reportsState}
        error={reportsQuery.error}
        onRetry={() => void reportsQuery.refetch()}
        loadingMessage="Loading reports..."
        emptyIcon="document-outline"
        emptyTitle="No report"
        emptyMessage="Visit reports will appear here when they are on file."
      >
        <View style={styles.list}>
          {reportsQuery.data?.map((report) => (
            <View key={report.id} style={[styles.card, shadows.card]}>
              <Text style={styles.label}>Summary</Text>
              <Text style={styles.value}>{report.summary ?? 'No summary on file'}</Text>
              <Text style={styles.label}>Issues noted</Text>
              <Text style={styles.value}>{report.issuesNoted ?? 'No issues noted'}</Text>
            </View>
          ))}
        </View>
      </FamilyQueryView>
    </FamilySubScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
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
  section: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  taskName: {
    ...typography.subtitle,
    color: colors.text,
  },
  line: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
