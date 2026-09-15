import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { PrimaryButton } from '@/components';
import { Icon } from '@/components/ui';
import { cardSurface, colors, radius, spacing, typography } from '@/constants/theme';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { CareQueryView } from './components/CareQueryView';
import { CareSubScreen } from './components/CareSubScreen';
import { useUpdateVisitStatus, useVisitDetail } from './hooks';
import { visitActiveHref, visitSeniorLabel } from './selectors';

export function StaffTaskStartScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const visitQuery = useVisitDetail(id);
  const updateStatus = useUpdateVisitStatus();
  const visit = visitQuery.data;
  const state = getSectionState({
    isPending: visitQuery.isPending,
    isError: visitQuery.isError,
    isEmpty: visitQuery.isSuccess && !visitQuery.data,
  });

  const onStart = async () => {
    if (!visit) {
      return;
    }
    try {
      await updateStatus.mutateAsync({ visitId: visit.id, status: 'IN_PROGRESS' });
      router.replace(visitActiveHref(visit.id) as unknown as Href);
    } catch {
      Alert.alert('Unable to start', 'Could not mark this visit in progress. Please try again.');
    }
  };

  return (
    <CareSubScreen title="Start Task">
      <CareQueryView
        state={state}
        error={visitQuery.error}
        onRetry={() => void visitQuery.refetch()}
        loadingMessage="Loading visit..."
        emptyIcon="location"
        emptyTitle="Visit not found"
        emptyMessage="This visit is not available."
      >
        {visit ? (
          <>
            <View style={styles.arrived}>
              <Icon name="location" size={28} color={colors.safe} />
              <View style={styles.arrivedText}>
                <Text style={styles.arrivedTitle}>You have arrived</Text>
                <Text style={styles.arrivedBody}>
                  Confirm you are with {visitSeniorLabel(visit.seniorId)} before starting the task.
                </Text>
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.label}>Senior</Text>
              <Text style={styles.value}>{visitSeniorLabel(visit.seniorId)}</Text>
              <Text style={styles.label}>Notes</Text>
              <Text style={styles.value}>{visit.notes ?? 'No notes on file'}</Text>
            </View>
            <PrimaryButton label="Start Task" onPress={() => void onStart()} loading={updateStatus.isPending} />
          </>
        ) : null}
      </CareQueryView>
    </CareSubScreen>
  );
}

const styles = StyleSheet.create({
  arrived: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.safeSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  arrivedText: {
    flex: 1,
  },
  arrivedTitle: {
    ...typography.subtitle,
    color: colors.safe,
  },
  arrivedBody: {
    ...typography.body,
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
});
