import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AppHeader, ErrorState, LoadingState, Screen, SectionHeader } from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { getVisitById, getVisitReport } from '@/services/visitService';
import { useLoad } from '@/hooks/useLoad';

export function VisitReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, loading, error, reload } = useLoad(async () => {
    const visit = await getVisitById(id);
    if (!visit) {
      throw new Error('This visit could not be found.');
    }
    const report = await getVisitReport(visit.id);
    return { visit, report };
  }, id);

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Full report" showBack />
        <LoadingState message="Loading the visit report..." />
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen>
        <AppHeader title="Full report" showBack />
        <ErrorState message={error ?? 'Report not found'} onRetry={reload} />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Full report" subtitle={data.visit.type} showBack />
      <Text style={styles.note}>
        This report is ready for a future backend connection. In Phase 1 it is assembled from mock visit data.
      </Text>

      <SectionHeader title="Care summary" />
      <View style={[styles.block, shadows.card]}>
        <Text style={styles.body}>{data.report?.careSummary}</Text>
      </View>

      <SectionHeader title="Observations" />
      <View style={[styles.block, shadows.card]}>
        {data.report?.observations.map((item) => (
          <Text key={item} style={styles.body}>
            • {item}
          </Text>
        ))}
      </View>

      <SectionHeader title="Next steps" />
      <View style={[styles.block, shadows.card]}>
        {data.report?.nextSteps.map((item) => (
          <Text key={item} style={styles.body}>
            • {item}
          </Text>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  block: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.text,
  },
});
