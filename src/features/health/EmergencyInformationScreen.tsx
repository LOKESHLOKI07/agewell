import { StyleSheet, Text, View } from 'react-native';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { HealthQueryView } from './components/HealthQueryView';
import { HealthSubScreen } from './components/HealthSubScreen';
import { useSeniorProfile } from '@/features/home/hooks/queries';

export function EmergencyInformationScreen() {
  const query = useSeniorProfile();
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && !query.data?.emergencyContact,
  });

  return (
    <HealthSubScreen title="Emergency Information">
      <Text style={styles.note}>
        This is the contact number on file. It is not an emergency help button.
      </Text>
      <HealthQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading emergency information..."
        emptyIcon="call-outline"
        emptyTitle="No emergency contact"
        emptyMessage="An emergency contact number will appear here when it is on file."
      >
        <View style={[styles.card, shadows.card]} accessibilityRole="text">
          <Text style={styles.label}>Emergency Contact</Text>
          <Text style={styles.value}>{query.data?.emergencyContact}</Text>
        </View>
      </HealthQueryView>
    </HealthSubScreen>
  );
}

const styles = StyleSheet.create({
  note: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
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
  },
  value: {
    ...typography.title,
    color: colors.text,
    marginTop: spacing.sm,
  },
});
