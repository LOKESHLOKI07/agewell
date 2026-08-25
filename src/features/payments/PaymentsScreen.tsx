import { StyleSheet, Text, View } from 'react-native';
import {
  AppHeader,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  StatusBadge,
} from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { getCurrentMembership, getPaymentHistory } from '@/services/paymentService';
import { useLoad } from '@/hooks/useLoad';
import { formatCurrencyInr, formatLongDate, formatShortDate } from '@/utils/date';
import { paymentStatusPresentation } from '@/utils/status';

export function PaymentsScreen() {
  const { data, loading, error, reload } = useLoad(async () => {
    const [membership, history] = await Promise.all([getCurrentMembership(), getPaymentHistory()]);
    return { membership, history };
  });

  return (
    <Screen>
      <AppHeader
        title="Payments"
        subtitle="Membership billing history. Razorpay is not connected in Phase 1."
        showBack
      />

      {loading ? <LoadingState message="Loading payments..." /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {data ? (
        <View style={styles.stack}>
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.label}>Current plan</Text>
            <Text style={styles.plan}>{data.membership.name}</Text>
            <Text style={styles.price}>{formatCurrencyInr(data.membership.priceInrPerMonth)}/month</Text>
            <Text style={styles.renewal}>Next renewal: {formatLongDate(data.membership.nextRenewalAt)}</Text>
          </View>

          <Text style={styles.section}>Payment history</Text>
          {data.history.length === 0 ? (
            <EmptyState
              icon="card-outline"
              title="No payments yet"
              message="Membership payments will appear here."
            />
          ) : (
            data.history.map((payment) => (
              <View key={payment.id} style={[styles.rowCard, shadows.card]}>
                <View>
                  <Text style={styles.rowTitle}>{formatShortDate(payment.paidAt)}</Text>
                  <Text style={styles.rowMeta}>{formatCurrencyInr(payment.amountInr)}</Text>
                </View>
                <StatusBadge presentation={paymentStatusPresentation(payment.status)} />
              </View>
            ))
          )}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  plan: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.sm,
  },
  price: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 4,
  },
  renewal: {
    ...typography.captionStrong,
    color: colors.primary,
    marginTop: spacing.lg,
  },
  section: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  rowCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  rowMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
