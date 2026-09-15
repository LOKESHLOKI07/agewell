import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { PrimaryButton, SecondaryButton } from '@/components';
import { Icon } from '@/components/ui';
import { cardSurface, colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { CareQueryView } from './components/CareQueryView';
import { CareSubScreen } from './components/CareSubScreen';
import { useUpdateVisitTask, useVisitDetail, useVisitTasks } from './hooks';
import { taskDisplayName, visitCompleteHref, visitSeniorLabel } from './selectors';

function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function StaffTaskActiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const visitQuery = useVisitDetail(id);
  const tasksQuery = useVisitTasks(id);
  const updateTask = useUpdateVisitTask();
  const visit = visitQuery.data;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startedAt = visit?.startedAt ? Date.parse(visit.startedAt) : Date.now();
    const tick = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [visit?.startedAt, visit?.id]);

  const visitState = getSectionState({
    isPending: visitQuery.isPending || tasksQuery.isPending,
    isError: visitQuery.isError || tasksQuery.isError,
    isEmpty: visitQuery.isSuccess && !visitQuery.data,
  });

  const onToggle = async (taskId: string, isCompleted: boolean) => {
    if (!visit) {
      return;
    }
    try {
      await updateTask.mutateAsync({ visitId: visit.id, taskId, isCompleted: !isCompleted });
    } catch {
      Alert.alert('Update failed', 'Could not update this checklist item.');
    }
  };

  return (
    <CareSubScreen title="Active Task">
      <CareQueryView
        state={visitState}
        error={visitQuery.error ?? tasksQuery.error}
        onRetry={() => {
          void visitQuery.refetch();
          void tasksQuery.refetch();
        }}
        loadingMessage="Loading active task..."
        emptyIcon="clipboard-outline"
        emptyTitle="Task not found"
        emptyMessage="This visit is not available."
      >
        {visit ? (
          <>
            <View style={styles.timerCard}>
              <Text style={styles.timerLabel}>Time on task</Text>
              <Text style={styles.timerValue}>{formatElapsed(elapsed)}</Text>
              <Text style={styles.timerMeta}>{visitSeniorLabel(visit.seniorId)}</Text>
            </View>

            <Text style={styles.section}>Checklist</Text>
            <View style={styles.list}>
              {(tasksQuery.data ?? []).map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => void onToggle(task.id, task.isCompleted)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: task.isCompleted }}
                  accessibilityLabel={taskDisplayName(task)}
                  style={({ pressed }) => [styles.taskRow, pressed ? styles.pressed : null]}
                >
                  <Icon
                    name={task.isCompleted ? 'checkbox-outline' : 'checkbox-blank-outline'}
                    size={22}
                    color={task.isCompleted ? colors.safe : colors.textMuted}
                  />
                  <Text style={[styles.taskName, task.isCompleted ? styles.taskDone : null]}>
                    {taskDisplayName(task)}
                  </Text>
                </Pressable>
              ))}
              {(tasksQuery.data ?? []).length === 0 ? (
                <Text style={styles.emptyChecklist}>No checklist items for this visit.</Text>
              ) : null}
            </View>

            <View style={styles.actions}>
              <SecondaryButton
                label="Report Issue"
                onPress={() => Alert.alert('Report Issue', 'Note the issue in your visit report when you complete the task.')}
              />
              <PrimaryButton
                label="Complete Task"
                onPress={() => router.push(visitCompleteHref(visit.id) as unknown as Href)}
              />
            </View>
          </>
        ) : null}
      </CareQueryView>
    </CareSubScreen>
  );
}

const styles = StyleSheet.create({
  timerCard: {
    ...cardSurface,
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginBottom: spacing.xl,
  },
  timerLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  timerValue: {
    ...typography.title,
    color: colors.text,
    marginTop: spacing.sm,
  },
  timerMeta: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  section: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  taskRow: {
    ...cardSurface,
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  taskName: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  taskDone: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  emptyChecklist: {
    ...typography.body,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.92,
  },
});
