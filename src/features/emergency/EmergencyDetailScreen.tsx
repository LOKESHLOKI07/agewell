import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { EmergencyQueryView } from './components/EmergencyQueryView';
import { EmergencySubScreen } from './components/EmergencySubScreen';
import { useEmergencyCase, useEmergencyEvents } from './hooks';
import { emergencyStatusLabel, emergencyTypeLabel, formatEmergencyWhen } from './selectors';

export function EmergencyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const caseQuery = useEmergencyCase(id);
  const eventsQuery = useEmergencyEvents(id);
  const emergency = caseQuery.data;

  const caseState = getSectionState({
    isPending: caseQuery.isPending,
    isError: caseQuery.isError,
    isEmpty: caseQuery.isSuccess && !caseQuery.data,
  });
  const eventsState = getSectionState({
    isPending: eventsQuery.isPending,
    isError: eventsQuery.isError,
    isEmpty: (eventsQuery.data?.items.length ?? 0) === 0,
  });

  return (
    <EmergencySubScreen title="Emergency Assistance">
      <EmergencyQueryView
        state={caseState}
        error={caseQuery.error}
        onRetry={() => void caseQuery.refetch()}
        loadingMessage="Loading emergency request..."
        emptyIcon="document-text-outline"
        emptyTitle="Emergency request not found"
        emptyMessage="This emergency request is not available."
      >
        {emergency ? (
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.label}>Type</Text>
            <Text style={styles.value}>{emergencyTypeLabel(emergency.type)}</Text>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{emergencyStatusLabel(emergency.status)}</Text>
            <Text style={styles.label}>Created</Text>
            <Text style={styles.value}>{formatEmergencyWhen(emergency.createdAt) ?? 'Time not on file'}</Text>
          </View>
        ) : null}
      </EmergencyQueryView>

      <Text style={styles.section}>Emergency Timeline</Text>
      <EmergencyQueryView
        state={eventsState}
        error={eventsQuery.error}
        onRetry={() => void eventsQuery.refetch()}
        loadingMessage="Loading timeline..."
        emptyIcon="time-outline"
        emptyTitle="No timeline yet"
        emptyMessage="Timeline updates will appear here when they are on file."
      >
        <View style={styles.list}>
          {eventsQuery.data?.items.map((event) => (
            <View key={event.id} style={[styles.card, shadows.card]}>
              <Text style={styles.eventText}>{event.eventDescription ?? 'Update on file'}</Text>
              <Text style={styles.eventWhen}>{formatEmergencyWhen(event.createdAt) ?? 'Time not on file'}</Text>
            </View>
          ))}
        </View>
      </EmergencyQueryView>
    </EmergencySubScreen>
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
  eventText: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  eventWhen: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
