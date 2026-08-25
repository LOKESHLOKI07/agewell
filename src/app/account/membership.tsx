import { router } from 'expo-router';
import { SimpleInfoScreen } from '@/features/profile/SimpleInfoScreen';
import { ProgressBar } from '@/components/ui';
import { EmptyState, ErrorState, LoadingState, PrimaryButton } from '@/components';
import { colors, spacing, typography } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';
import { useCurrentMembership, useMembershipUsage } from '@/features/home/hooks/queries';
import { getSectionState, humanizeStatus } from '@/features/home/selectors/homeViewModel';
import { getApiErrorMessage } from '@/api/errors';

export default function MembershipScreen() {
  const membership = useCurrentMembership();
  const usage = useMembershipUsage();
  const membershipState = getSectionState({
    isPending: membership.isPending,
    isError: membership.isError,
    isEmpty: membership.isSuccess && !membership.data,
  });

  return (
    <SimpleInfoScreen title="Membership" subtitle="Your current AgeWell plan">
      {membershipState === 'loading' ? <LoadingState message="Loading membership..." /> : null}
      {membershipState === 'error' ? (
        <ErrorState message={getApiErrorMessage(membership.error)} onRetry={() => void membership.refetch()} />
      ) : null}
      {membershipState === 'empty' ? (
        <EmptyState
          icon="card-outline"
          title="No membership"
          message="Membership details will appear here when they are on file."
        />
      ) : null}
      {membershipState === 'ready' && membership.data ? (
        <View>
          <Text style={styles.plan}>{membership.data.planName}</Text>
          <Text style={styles.meta}>{humanizeStatus(membership.data.status)}</Text>
          <View style={styles.usage}>
            {(usage.data ?? []).map((item) => (
              <ProgressBar key={item.benefitId} label={item.benefitName} used={item.used} total={item.quota} />
            ))}
          </View>
        </View>
      ) : null}
      <PrimaryButton label="View payment history" onPress={() => router.push('/payments')} />
    </SimpleInfoScreen>
  );
}

const styles = StyleSheet.create({
  plan: {
    ...typography.heading,
    color: colors.text,
  },
  meta: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  usage: {
    gap: spacing.md,
  },
});
