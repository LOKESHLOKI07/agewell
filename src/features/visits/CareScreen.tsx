import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  ParentCard,
  Screen,
  SectionHeader,
  StatusBadge,
  VisitCard,
} from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { mockCareManager } from '@/mock/careManagers';
import { getMembershipById } from '@/services/seniorService';
import { getLatestCompletedVisit, getUpcomingVisit, getVisitsBySeniorId } from '@/services/visitService';
import { useSeniorStore } from '@/store/seniorStore';
import { useLoad } from '@/hooks/useLoad';
import { formatCurrencyInr, formatRelativeDay, formatTime } from '@/utils/date';
import { fullName } from '@/utils/greeting';
import { careStatusPresentation } from '@/utils/status';

export function CareScreen() {
  const senior = useSeniorStore((state) => state.selectedSenior);

  const { data, loading, error, reload } = useLoad(async () => {
    const [membership, visits, nextVisit, latestVisit] = await Promise.all([
      getMembershipById(senior.membershipId),
      getVisitsBySeniorId(senior.id),
      getUpcomingVisit(senior.id),
      getLatestCompletedVisit(senior.id),
    ]);
    return { membership, visits, nextVisit, latestVisit };
  });

  return (
    <Screen>
      <Text style={styles.title}>Care</Text>
      <Text style={styles.subtitle}>Care management for {senior.firstName}.</Text>

      <ParentCard
        senior={senior}
        onPress={() => router.push({ pathname: '/parent/[id]', params: { id: senior.id } })}
      />

      {loading ? <LoadingState message="Loading the care plan..." /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {data && !loading ? (
        <View style={styles.stack}>
          <View style={[styles.planCard, shadows.card]}>
            <Text style={styles.label}>Current care plan</Text>
            <Text style={styles.planName}>{data.membership?.name ?? 'AgeWell Family'}</Text>
            <Text style={styles.planPrice}>
              {data.membership ? `${formatCurrencyInr(data.membership.priceInrPerMonth)}/month` : ''}
            </Text>
            <View style={styles.badge}>
              <StatusBadge presentation={careStatusPresentation(senior.careStatus)} />
            </View>
          </View>

          <View>
            <SectionHeader title="Next visit" />
            {data.nextVisit ? (
              <VisitCard
                visit={data.nextVisit}
                careManager={mockCareManager}
                onPress={() =>
                  router.push({ pathname: '/visits/[id]', params: { id: data.nextVisit!.id } })
                }
              />
            ) : (
              <EmptyState
                icon="calendar-outline"
                title="No upcoming visit"
                message="Your next wellbeing visit will appear here once it is scheduled."
              />
            )}
          </View>

          <View style={[styles.noteCard, shadows.card]}>
            <Text style={styles.label}>Care Manager</Text>
            <Text style={styles.noteTitle}>{fullName(mockCareManager.firstName, mockCareManager.lastName)}</Text>
            <Text style={styles.noteBody}>AgeWell Care Manager</Text>
          </View>

          <View style={[styles.noteCard, shadows.card]}>
            <Text style={styles.label}>Recent visit</Text>
            {data.latestVisit ? (
              <>
                <Text style={styles.noteTitle}>
                  {formatRelativeDay(data.latestVisit.scheduledAt)} · {formatTime(data.latestVisit.scheduledAt)}
                </Text>
                <Text style={styles.noteBody}>{data.latestVisit.summary}</Text>
              </>
            ) : (
              <Text style={styles.noteBody}>No completed visits yet.</Text>
            )}
          </View>

          <View style={[styles.noteCard, shadows.card]}>
            <Text style={styles.label}>Care notes</Text>
            <Text style={styles.noteBody}>
              Lakshmi is following her usual routine. Family can review visit reports for observations. Sensitive
              medical details stay in the parent profile and visit reports.
            </Text>
          </View>

          <View>
            <SectionHeader title="Visit history" />
            {data.visits.length === 0 ? (
              <EmptyState
                icon="heart-outline"
                title="No visits yet"
                message="Visit history will appear here after the first AgeWell visit."
              />
            ) : (
              <View style={styles.list}>
                {data.visits.map((visit) => (
                  <VisitCard
                    key={visit.id}
                    visit={visit}
                    careManager={mockCareManager}
                    onPress={() => router.push({ pathname: '/visits/[id]', params: { id: visit.id } })}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
  stack: {
    marginTop: spacing.xxl,
    gap: spacing.xxl,
  },
  planCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  planName: {
    ...typography.heading,
    color: colors.text,
  },
  planPrice: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 4,
  },
  badge: {
    marginTop: spacing.lg,
  },
  noteCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  noteTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  noteBody: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
});
