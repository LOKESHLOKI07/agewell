import { router, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SimpleInfoScreen } from '@/features/profile/SimpleInfoScreen';
import { ProgressBar } from '@/components/ui';
import { EmptyState, ErrorState, LoadingState, PrimaryButton, SecondaryButton } from '@/components';
import { colors, spacing, typography } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '@/features/auth/authStore';
import { useCurrentMembership, useMembershipUsage } from '@/features/home/hooks/queries';
import { getSectionState, humanizeStatus } from '@/features/home/selectors/homeViewModel';
import { getApiErrorMessage } from '@/api/errors';
import { isMembershipNotFound } from '@/features/membership/membershipAccess';
import { fetchMembershipRequests } from '@/features/membership/membershipApi';
import { membershipQueryKeys } from '@/features/membership/queryKeys';
import {
  displayApplicationId,
  formatApplicationWhen,
} from '@/features/membership/applicationStatus';

export default function MembershipScreen() {
  const isAuthenticated = useAuthStore((state) => state.status === 'AUTHENTICATED');
  const membership = useCurrentMembership();
  const usage = useMembershipUsage();
  const pendingApplication = useQuery({
    queryKey: membershipQueryKeys.requests({ status: 'REQUESTED', screen: 'account-membership' }),
    queryFn: () => fetchMembershipRequests({ status: 'REQUESTED', limit: 1, offset: 0 }),
    enabled: isAuthenticated,
  });

  const notFound = isMembershipNotFound(membership.error);
  const membershipState = getSectionState({
    isPending: membership.isPending,
    isError: membership.isError && !notFound,
    isEmpty: (membership.isSuccess && !membership.data) || notFound,
  });
  const pending = pendingApplication.data?.items[0] ?? null;

  return (
    <SimpleInfoScreen title="Membership" subtitle="Your current AgeWell plan">
      {membershipState === 'loading' ? <LoadingState message="Loading membership..." /> : null}
      {membershipState === 'error' ? (
        <ErrorState message={getApiErrorMessage(membership.error)} onRetry={() => void membership.refetch()} />
      ) : null}
      {membershipState === 'empty' ? (
        pending ? (
          <View style={styles.pendingBox}>
            <Text style={styles.pendingTitle}>Application in progress</Text>
            <Text style={styles.pendingBody}>
              {displayApplicationId(pending)} · {pending.planName}
            </Text>
            {pending.createdAt ? (
              <Text style={styles.pendingMeta}>
                Submitted {formatApplicationWhen(pending.createdAt)}
              </Text>
            ) : null}
            <Text style={styles.pendingHint}>
              Your membership is not active yet. Track visit, review, and payment from application
              status.
            </Text>
            <PrimaryButton
              label="View application status"
              onPress={() => router.push('/account/application-status' as Href)}
            />
          </View>
        ) : (
          <EmptyState
            icon="card-outline"
            title="No membership yet"
            message="Apply for Single or Couple membership. After visit and approval, your plan will show here."
          />
        )
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
      {pending && membershipState === 'ready' ? (
        <SecondaryButton
          label="View application status"
          onPress={() => router.push('/account/application-status' as Href)}
        />
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
  pendingBox: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  pendingTitle: {
    ...typography.heading,
    color: colors.text,
  },
  pendingBody: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  pendingMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  pendingHint: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
});
