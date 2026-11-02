import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AppHeader, EmptyState, ErrorState, LoadingState, Screen } from '@/components';
import { Icon, IconWell } from '@/components/ui';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import { getApiErrorMessage } from '@/api/errors';
import { formatTime } from '@/utils/date';
import { fetchCreditTransactions } from './api';
import {
  creditCategoryLabel,
  transactionIcon,
  transactionSignedAmount,
  transactionTitle,
  transactionWhen,
} from './creditViewModel';
import { creditQueryKeys } from './queryKeys';

export function CreditHistoryScreen() {
  const isAuthenticated = useAuthStore((state) => state.status === 'AUTHENTICATED');
  const history = useQuery({
    queryKey: creditQueryKeys.transactions({ limit: 100, screen: 'history' }),
    queryFn: () => fetchCreditTransactions({ limit: 100, offset: 0 }),
    enabled: isAuthenticated,
  });

  return (
    <Screen>
      <AppHeader title="Transaction History" subtitle="Service Credit and Emergency Credit ledger." showBack />
      {history.isPending ? <LoadingState message="Loading history..." /> : null}
      {history.error ? (
        <ErrorState message={getApiErrorMessage(history.error)} onRetry={() => void history.refetch()} />
      ) : null}
      {history.data && history.data.items.length === 0 ? (
        <EmptyState icon="card-outline" title="No transactions" message="Credit activity will appear here." />
      ) : null}
      {history.data?.items.map((row) => {
        const debit = row.transactionType === 'DEDUCTION';
        return (
          <View key={row.id} style={[styles.row, shadows.card]}>
            <IconWell tone={row.category === 'EMERGENCY' ? 'emergency' : 'primary'} size={40}>
              <Icon
                name={transactionIcon(row)}
                size={18}
                color={row.category === 'EMERGENCY' ? colors.emergency : colors.primary}
              />
            </IconWell>
            <View style={styles.copy}>
              <Text style={styles.title}>{transactionTitle(row)}</Text>
              <Text style={styles.meta}>
                {creditCategoryLabel(row.category)} · {row.status}
              </Text>
              <Text style={styles.meta}>
                {[transactionWhen(row), row.createdAt ? formatTime(row.createdAt) : null].filter(Boolean).join(', ')}
              </Text>
            </View>
            <Text style={[styles.amount, debit ? styles.debit : styles.credit]}>{transactionSignedAmount(row)}</Text>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  copy: {
    flex: 1,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  amount: {
    ...typography.bodyStrong,
  },
  debit: {
    color: colors.emergency,
  },
  credit: {
    color: colors.safe,
  },
});
