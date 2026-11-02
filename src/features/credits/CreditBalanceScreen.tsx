import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AppHeader, ErrorState, LoadingState, Screen } from '@/components';
import { Icon, IconWell, type IconName } from '@/components/ui';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { useAuthStore } from '@/features/auth/authStore';
import { getApiErrorMessage } from '@/api/errors';
import { formatTime } from '@/utils/date';
import { fetchCreditBalances, fetchCreditTransactions } from './api';
import {
  RECHARGE_UNAVAILABLE_HINT,
  RECHARGE_UNAVAILABLE_LABEL,
  creditCategoryLabel,
  creditProgress,
  formatCreditAmount,
  transactionIcon,
  transactionSignedAmount,
  transactionTitle,
  transactionWhen,
} from './creditViewModel';
import { creditQueryKeys } from './queryKeys';
import type { CreditAccountBalance, CreditTransaction } from './types';

function CreditPotCard({
  account,
  title,
  subtitle,
  icon,
  tone,
  actionLabel,
  onAction,
}: {
  account: CreditAccountBalance;
  title: string;
  subtitle: string;
  icon: IconName;
  tone: 'service' | 'emergency';
  actionLabel: string;
  onAction: () => void;
}) {
  const accent = tone === 'emergency' ? familyHome.red : familyHome.green;
  const wash = tone === 'emergency' ? familyHome.redSoft : familyHome.greenCard;
  const soft = tone === 'emergency' ? '#FDECEC' : '#E7F6EA';
  const progress = creditProgress(account);

  return (
    <View style={[styles.pot, { backgroundColor: wash }]}>
      <View style={styles.potHeader}>
        <View style={[styles.potIcon, { backgroundColor: soft }]}>
          <Icon name={icon} size={18} color={accent} />
        </View>
        <View style={styles.potCopy}>
          <View style={styles.potTitleRow}>
            <View style={styles.potTitleWrap}>
              <Text
                style={styles.potTitle}
                numberOfLines={1}
                ellipsizeMode="clip"
                adjustsFontSizeToFit
                minimumFontScale={0.9}
              >
                {title}
              </Text>
              <Icon name="help-circle-outline" size={14} color={colors.textMuted} />
            </View>
            <Pressable
              onPress={onAction}
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
              hitSlop={8}
              style={styles.potLink}
            >
              <Text style={[styles.potLinkText, { color: accent }]} numberOfLines={1}>
                {actionLabel}
              </Text>
              <Icon name="chevron-forward" size={12} color={accent} />
            </Pressable>
          </View>
          <Text
            style={styles.potSubtitle}
            numberOfLines={1}
            ellipsizeMode="clip"
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {subtitle}
          </Text>
        </View>
      </View>

      <Text style={styles.potAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
        {formatCreditAmount(account.availableBalance)}
        <Text style={styles.potAllocated}> / {formatCreditAmount(account.allocatedAmount)}</Text>
      </Text>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: accent }]} />
      </View>

      <View style={styles.potMeta}>
        <Text style={styles.potMetaText} numberOfLines={1}>
          Used: {formatCreditAmount(account.spentAmount)}
        </Text>
        <Text style={styles.potMetaText} numberOfLines={1}>
          Available: {formatCreditAmount(account.availableBalance)}
        </Text>
      </View>
    </View>
  );
}

function TransactionRow({ row }: { row: CreditTransaction }) {
  const debit = row.transactionType === 'DEDUCTION';
  return (
    <View style={styles.txRow}>
      <IconWell tone={row.category === 'EMERGENCY' ? 'emergency' : 'primary'} size={40}>
        <Icon
          name={transactionIcon(row)}
          size={18}
          color={row.category === 'EMERGENCY' ? colors.emergency : colors.primary}
        />
      </IconWell>
      <View style={styles.txCopy}>
        <Text style={styles.txTitle} numberOfLines={1}>
          {transactionTitle(row)}
        </Text>
        <Text style={styles.txMeta} numberOfLines={1}>
          {[transactionWhen(row), row.createdAt ? formatTime(row.createdAt) : null].filter(Boolean).join(', ')}
        </Text>
      </View>
      <View style={styles.txRight}>
        <Text style={styles.txCategory} numberOfLines={1}>
          {creditCategoryLabel(row.category)}
        </Text>
        <Text style={[styles.txAmount, debit ? styles.txDebit : styles.txCredit]} numberOfLines={1}>
          {transactionSignedAmount(row)}
        </Text>
      </View>
      <Icon name="chevron-forward" size={14} color={colors.textMuted} />
    </View>
  );
}

export function CreditBalanceScreen({ showBack = true }: { showBack?: boolean }) {
  const isAuthenticated = useAuthStore((state) => state.status === 'AUTHENTICATED');
  const balances = useQuery({
    queryKey: creditQueryKeys.balances(),
    queryFn: () => fetchCreditBalances(),
    enabled: isAuthenticated,
  });
  const transactions = useQuery({
    queryKey: creditQueryKeys.transactions({ limit: 8 }),
    queryFn: () => fetchCreditTransactions({ limit: 8, offset: 0 }),
    enabled: isAuthenticated,
  });

  const loading = balances.isPending || transactions.isPending;
  const error = balances.error ?? transactions.error;

  return (
    <Screen>
      <AppHeader
        title="Credit Balance"
        subtitle="Manage your service credits and emergency credits."
        showBack={showBack}
      />

      {loading ? <LoadingState message="Loading credits..." /> : null}
      {error ? (
        <ErrorState message={getApiErrorMessage(error)} onRetry={() => void Promise.all([balances.refetch(), transactions.refetch()])} />
      ) : null}

      {balances.data ? (
        <View style={styles.stack}>
          <CreditPotCard
            account={balances.data.service}
            title="Service Credit"
            subtitle="For 19 services other than emergency & CCTV"
            icon="hand-heart"
            tone="service"
            actionLabel="View Services"
            onAction={() => router.push('/(tabs)/services' as Href)}
          />
          <CreditPotCard
            account={balances.data.emergency}
            title="Emergency Credit"
            subtitle="For emergency services only."
            icon="warning-outline"
            tone="emergency"
            actionLabel="Emergency Info"
            onAction={() => router.push('/health/emergency-info' as Href)}
          />

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <Pressable
              onPress={() => router.push('/account/credit-history' as Href)}
              accessibilityRole="button"
              accessibilityLabel="View all transactions"
              hitSlop={8}
              style={styles.sectionLink}
            >
              <Text style={styles.sectionLinkText}>View All</Text>
              <Icon name="chevron-forward" size={14} color={familyHome.blue} />
            </Pressable>
          </View>

          <View style={[styles.txCard, shadows.card]}>
            {(transactions.data?.items ?? []).length === 0 ? (
              <Text style={styles.empty}>No credit transactions yet.</Text>
            ) : (
              (transactions.data?.items ?? []).map((row) => <TransactionRow key={row.id} row={row} />)
            )}
          </View>

          <View style={[styles.footer, shadows.card]}>
            <View style={styles.footerCopy}>
              <Text style={styles.footerLabel} numberOfLines={1}>
                Total Used Amount
              </Text>
              <Text style={styles.footerHint} numberOfLines={1}>
                Service Credit + Emergency Credit
              </Text>
              <Text style={styles.footerSplit} numberOfLines={1}>
                Service: {formatCreditAmount(balances.data.service.spentAmount)} · Emergency:{' '}
                {formatCreditAmount(balances.data.emergency.spentAmount)}
              </Text>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.footerTotal}>{formatCreditAmount(balances.data.totalSpentAmount)}</Text>
              <Pressable
                disabled
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
                accessibilityLabel={RECHARGE_UNAVAILABLE_LABEL}
                accessibilityHint={RECHARGE_UNAVAILABLE_HINT}
                style={styles.payNow}
              >
                <Icon name="card-outline" size={16} color={colors.textOnPrimary} />
                <Text style={styles.payNowLabel}>{RECHARGE_UNAVAILABLE_LABEL}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
  pot: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  potHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  potIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  potCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  potTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minWidth: 0,
  },
  potTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    minWidth: 0,
  },
  potTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    flexShrink: 1,
  },
  potSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  potLink: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  potLinkText: {
    ...typography.captionStrong,
  },
  potAmount: {
    ...typography.title,
    color: colors.text,
  },
  potAllocated: {
    ...typography.subtitle,
    color: colors.textMuted,
  },
  track: {
    height: 6,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: radius.full,
  },
  potMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  potMetaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.text,
    flexShrink: 1,
  },
  sectionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  sectionLinkText: {
    ...typography.captionStrong,
    color: familyHome.blue,
  },
  txCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  txCopy: {
    flex: 1,
    minWidth: 0,
  },
  txTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  txMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  txRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  txCategory: {
    ...typography.caption,
    color: colors.textMuted,
  },
  txAmount: {
    ...typography.bodyStrong,
    marginTop: 1,
  },
  txDebit: {
    color: colors.emergency,
  },
  txCredit: {
    color: colors.safe,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
  },
  footer: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerCopy: {
    flex: 1,
    minWidth: 0,
  },
  footerLabel: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  footerHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  footerSplit: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  footerRight: {
    alignItems: 'flex-end',
    gap: spacing.sm,
    flexShrink: 0,
  },
  footerTotal: {
    ...typography.heading,
    color: colors.text,
  },
  payNow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: familyHome.blue,
    opacity: 0.45,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: minTouchSize,
  },
  payNowLabel: {
    ...typography.bodyStrong,
    color: colors.textOnPrimary,
  },
});
