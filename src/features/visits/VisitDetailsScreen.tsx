import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import {
  AppHeader,
  ErrorState,
  LoadingState,
  PrimaryButton,
  Screen,
  SectionHeader,
  StatusBadge,
} from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { getCareManagerById, getVisitById, getVisitReport } from '@/services/visitService';
import { useLoad } from '@/hooks/useLoad';
import { formatLongDate, formatTime } from '@/utils/date';
import { fullName } from '@/utils/greeting';
import { visitStatusPresentation } from '@/utils/status';
import { TrackCareAssociateCard } from '@/features/tracking/components/TrackCareAssociateCard';
import { seniorAssociateTrackHref } from '@/features/tracking/selectors';
import { useMyVisits } from '@/features/home/hooks/queries';
import { pickTrackableVisit } from '@/features/tracking/live';

export function VisitDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const myVisits = useMyVisits();
  const liveVisit = pickTrackableVisit(myVisits.data?.items);

  const { data, loading, error, reload } = useLoad(async () => {
    const visit = await getVisitById(id);
    if (!visit) {
      throw new Error('This visit could not be found.');
    }
    const [report, careManager] = await Promise.all([
      getVisitReport(visit.id),
      getCareManagerById(visit.careManagerId),
    ]);
    return { visit, report, careManager };
  }, id);

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Visit details" showBack />
        <LoadingState message="Loading visit details..." />
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen>
        <AppHeader title="Visit details" showBack />
        <ErrorState message={error ?? 'Visit not found'} onRetry={reload} />
      </Screen>
    );
  }

  const { visit, report, careManager } = data;
  const managerName = careManager ? fullName(careManager.firstName, careManager.lastName) : 'Assigned Care Manager';

  return (
    <Screen>
      <AppHeader title={visit.type} subtitle={`${formatLongDate(visit.scheduledAt)} · ${formatTime(visit.scheduledAt)}`} showBack />

      <View style={[styles.metaCard, shadows.card]}>
        <Row label="Visit type" value={visit.type} />
        <Row label="Date" value={formatLongDate(visit.scheduledAt)} />
        <Row label="Time" value={formatTime(visit.scheduledAt)} />
        <Row label="Care Manager" value={managerName} />
        <Row label="Duration" value={`${visit.durationMinutes} minutes`} />
        <View style={styles.statusRow}>
          <Text style={styles.rowLabel}>Status</Text>
          <StatusBadge presentation={visitStatusPresentation(visit.status)} />
        </View>
      </View>

      <SectionHeader title="Care summary" />
      <View style={[styles.block, shadows.card]}>
        <Text style={styles.body}>{report?.careSummary ?? 'A care summary will appear after this visit is completed.'}</Text>
      </View>

      <SectionHeader title="Observations" />
      <View style={[styles.block, shadows.card]}>
        {(report?.observations ?? ['No observations yet.']).map((item) => (
          <View key={item} style={styles.observation}>
            <View style={styles.bullet} />
            <Text style={styles.body}>{item}</Text>
          </View>
        ))}
      </View>

      {liveVisit ? (
        <>
          <SectionHeader title="Live tracking" />
          <View style={styles.trackWrap}>
            <TrackCareAssociateCard visit={liveVisit} href={seniorAssociateTrackHref(liveVisit.id)} />
          </View>
        </>
      ) : null}

      <PrimaryButton
        label="View Full Report"
        onPress={() =>
          router.push({
            pathname: '/visits/[id]/report',
            params: { id: visit.id },
          })
        }
        accessibilityHint="Opens the full visit report"
      />
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metaCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    gap: spacing.md,
  },
  row: {
    gap: 2,
  },
  rowLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  rowValue: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  statusRow: {
    gap: spacing.sm,
  },
  block: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
  },
  body: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  observation: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  trackWrap: {
    marginBottom: spacing.xxl,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginTop: 8,
  },
});
