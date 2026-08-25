import { View, Text, StyleSheet } from 'react-native';
import { router, type Href } from 'expo-router';
import { colors, typography, spacing } from '@/constants/theme';
import { SectionTitle } from '@/components/ui';
import { ProgressCard } from '@/components/premium';
import { humanizeStatus } from '../selectors/homeViewModel';
import type { CurrentMembership, HomeSectionState, MembershipUsage } from '../types/home';
import { HomeInlineError, HomeSkeletonRow } from './HomeInlineStatus';
import { formatLongDate } from '@/utils/date';
import { useI18n } from '@/i18n';

type MembershipSummaryProps = {
  planName: string | null;
  status: string | null;
  startDate?: string | null;
  endDate?: string | null;
  usage: MembershipUsage[];
  membershipState: HomeSectionState;
  membershipError: unknown;
  onRetryMembership: () => void;
  usageState: HomeSectionState;
  usageError: unknown;
  onRetryUsage: () => void;
};

function validityLabel(startDate: string | null | undefined, endDate: string | null | undefined): string | null {
  const start = startDate ? formatLongDate(startDate) : null;
  const end = endDate ? formatLongDate(endDate) : null;
  if (start && end) {
    return `Valid ${start} – ${end}`;
  }
  if (end) {
    return `Valid until ${end}`;
  }
  if (start) {
    return `Started ${start}`;
  }
  return null;
}

export function MembershipSummary({
  planName,
  status,
  startDate,
  endDate,
  usage,
  membershipState,
  membershipError,
  onRetryMembership,
  usageState,
  usageError,
  onRetryUsage,
}: MembershipSummaryProps) {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <SectionTitle title={t('home.membership')} actionLabel="Details" onAction={() => router.push('/account/membership')} />
      {membershipState === 'loading' ? (
        <HomeSkeletonRow />
      ) : membershipState === 'error' ? (
        <HomeInlineError error={membershipError} onRetry={onRetryMembership} />
      ) : membershipState === 'empty' || !planName ? (
        <Text style={styles.empty}>No membership on file</Text>
      ) : usageState === 'error' ? (
        <HomeInlineError error={usageError} onRetry={onRetryUsage} />
      ) : (
        <ProgressCard
          planName={planName}
          status={status ? humanizeStatus(status) : null}
          validityLabel={validityLabel(startDate, endDate)}
          usage={
            usageState === 'loading'
              ? []
              : usage.map((item) => ({
                  id: item.benefitId,
                  label: item.benefitName,
                  used: item.used,
                  quota: item.quota,
                }))
          }
          onPressPlan={() => router.push('/account/membership')}
          onAddMore={() => router.push('/addons' as Href)}
          addMoreLabel={t('membership.requestMore')}
        />
      )}
      {usageState === 'loading' && membershipState === 'ready' ? <HomeSkeletonRow /> : null}
      {membershipState === 'ready' && usageState === 'ready' && usage.length === 0 ? (
        <Text style={styles.emptyNote}>{t('membership.noUsage')}</Text>
      ) : null}
      {membershipState === 'ready' ? (
        <Text style={styles.paymentNote}>{t('addons.noPayment')}</Text>
      ) : null}
    </View>
  );
}

export type MembershipSummaryMembership = Pick<CurrentMembership, 'planName' | 'status' | 'startDate' | 'endDate'>;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  emptyNote: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  paymentNote: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
