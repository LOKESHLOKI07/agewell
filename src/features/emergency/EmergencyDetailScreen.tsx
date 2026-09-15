import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { PrimaryButton } from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { EmergencyQueryView } from './components/EmergencyQueryView';
import { EmergencySubScreen } from './components/EmergencySubScreen';
import { useAcknowledgeEmergency, useEmergencyCase, useEmergencyEvents } from './hooks';
import {
  emergencyStatusLabel,
  formatEmergencyClock,
  formatEmergencyWhen,
  recipientStatusLabel,
  triggerSourceLabel,
} from './selectors';

export function EmergencyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const role = useAuthStore((state) => state.user?.role);
  const caseQuery = useEmergencyCase(id);
  const eventsQuery = useEmergencyEvents(id);
  const acknowledge = useAcknowledgeEmergency();
  const emergency = caseQuery.data;
  const canAcknowledge = role === 'FAMILY' || role === 'SENIOR';
  const myRole = role === 'FAMILY' ? 'FAMILY' : null;
  const mine = emergency?.recipients.find((item) => item.role === myRole);
  const alreadyResponded = mine?.status === 'RESPONDED';

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
            <Text style={styles.caseId}>{emergency.caseNumber ? `#${emergency.caseNumber}` : 'Emergency case'}</Text>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{emergencyStatusLabel(emergency.status)}</Text>
            <Text style={styles.label}>Triggered</Text>
            <Text style={styles.value}>
              {formatEmergencyWhen(emergency.triggeredAt ?? emergency.createdAt) ?? 'Time not on file'}
            </Text>
            <Text style={styles.label}>Triggered by</Text>
            <Text style={styles.value}>{triggerSourceLabel(emergency.triggerSource)}</Text>
            {emergency.seniorName ? (
              <>
                <Text style={styles.label}>Senior</Text>
                <Text style={styles.value}>{emergency.seniorName}</Text>
              </>
            ) : null}
            {emergency.locationText ? (
              <>
                <Text style={styles.label}>Location</Text>
                <Text style={styles.value}>{emergency.locationText}</Text>
              </>
            ) : null}

            <Text style={[styles.label, styles.sectionSpace]}>Alerts</Text>
            {emergency.recipients.map((item) => (
              <Text key={item.id} style={styles.recipientLine}>
                {item.label} — {recipientStatusLabel(item.status, item.respondedAt, item.notifiedAt)}
              </Text>
            ))}

            {emergency.whatHappened || emergency.actionTaken ? (
              <>
                <Text style={[styles.label, styles.sectionSpace]}>What happened</Text>
                <Text style={styles.value}>{emergency.whatHappened ?? 'On file after handling'}</Text>
                <Text style={styles.label}>Action taken</Text>
                <Text style={styles.value}>{emergency.actionTaken ?? '—'}</Text>
                <Text style={styles.label}>Hospital assistance</Text>
                <Text style={styles.value}>
                  {emergency.hospitalRequired == null ? '—' : emergency.hospitalRequired ? 'Yes' : 'No'}
                </Text>
              </>
            ) : null}

            {canAcknowledge && myRole && !alreadyResponded ? (
              <View style={styles.ackWrap}>
                <PrimaryButton
                  label={acknowledge.isPending ? 'Responding…' : 'Respond / Acknowledge'}
                  loading={acknowledge.isPending}
                  onPress={() => void acknowledge.mutateAsync(emergency.id)}
                />
              </View>
            ) : null}
            {alreadyResponded && mine?.respondedAt ? (
              <Text style={styles.responded}>You responded at {formatEmergencyClock(mine.respondedAt)}</Text>
            ) : null}
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
  caseId: {
    ...typography.title,
    color: colors.text,
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
  recipientLine: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.xs,
  },
  sectionSpace: {
    marginTop: spacing.xl,
  },
  ackWrap: {
    marginTop: spacing.xl,
  },
  responded: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginTop: spacing.lg,
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
