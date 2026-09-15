import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { PrimaryButton, TextField } from '@/components';
import { Icon } from '@/components/ui';
import { cardSurface, colors, spacing, typography } from '@/constants/theme';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { CareQueryView } from './components/CareQueryView';
import { CareSubScreen } from './components/CareSubScreen';
import { useCreateVisitReport, useUpdateVisitStatus, useVisitDetail } from './hooks';
import { visitSeniorLabel } from './selectors';

export function StaffTaskCompleteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const visitQuery = useVisitDetail(id);
  const createReport = useCreateVisitReport();
  const updateStatus = useUpdateVisitStatus();
  const [summary, setSummary] = useState('');
  const [issuesNoted, setIssuesNoted] = useState('');
  const visit = visitQuery.data;
  const busy = createReport.isPending || updateStatus.isPending;
  const state = getSectionState({
    isPending: visitQuery.isPending,
    isError: visitQuery.isError,
    isEmpty: visitQuery.isSuccess && !visitQuery.data,
  });

  const onSubmit = async () => {
    if (!visit) {
      return;
    }
    try {
      await createReport.mutateAsync({
        visitId: visit.id,
        summary: summary.trim() || 'Visit completed',
        issuesNoted: issuesNoted.trim() || null,
      });
      await updateStatus.mutateAsync({ visitId: visit.id, status: 'COMPLETED' });
      Alert.alert('Report submitted', 'This visit is marked complete.', [
        { text: 'Done', onPress: () => router.replace('/(care)/tasks' as Href) },
      ]);
    } catch {
      Alert.alert('Submit failed', 'Could not submit the visit report. Please try again.');
    }
  };

  return (
    <CareSubScreen title="Complete Task">
      <CareQueryView
        state={state}
        error={visitQuery.error}
        onRetry={() => void visitQuery.refetch()}
        loadingMessage="Loading visit..."
        emptyIcon="checkbox-outline"
        emptyTitle="Visit not found"
        emptyMessage="This visit is not available."
      >
        {visit ? (
          <>
            <View style={styles.success}>
              <Icon name="checkbox-outline" size={36} color={colors.safe} />
              <Text style={styles.successTitle}>Task ready to close</Text>
              <Text style={styles.successBody}>
                Add a short summary for {visitSeniorLabel(visit.seniorId)}, then submit your report.
              </Text>
            </View>

            <View style={styles.form}>
              <TextField
                label="Remarks / Summary"
                value={summary}
                onChangeText={setSummary}
                placeholder="What was completed during this visit?"
                multiline
              />
              <TextField
                label="Issues noted"
                value={issuesNoted}
                onChangeText={setIssuesNoted}
                placeholder="Optional issues or follow-ups"
                multiline
              />
            </View>

            <PrimaryButton label="Submit Report" onPress={() => void onSubmit()} loading={busy} />
          </>
        ) : null}
      </CareQueryView>
    </CareSubScreen>
  );
}

const styles = StyleSheet.create({
  success: {
    ...cardSurface,
    alignItems: 'center',
    padding: spacing.xxl,
    marginBottom: spacing.xl,
    backgroundColor: colors.safeSoft,
    borderColor: colors.safeSoft,
  },
  successTitle: {
    ...typography.subtitle,
    color: colors.safe,
    marginTop: spacing.md,
  },
  successBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
});
