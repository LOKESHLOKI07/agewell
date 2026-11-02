import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PrimaryButton, SecondaryButton, TextField } from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import {
  approveCreditExpense,
  fetchCreditBalances,
  fetchCreditExpense,
  fetchCreditExpenses,
  recordAdminCreditExpense,
  rejectCreditExpense,
} from '@/features/credits/api';
import { creditCategoryLabel, formatCreditAmount } from '@/features/credits/creditViewModel';
import { creditQueryKeys } from '@/features/credits/queryKeys';
import type { CreditCategory, ExpenseStatus, ServiceExpense } from '@/features/credits/types';
import { getApiErrorMessage } from '@/api/errors';
import { formatShortDate } from '@/utils/date';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminPagination } from './components/AdminPagination';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { AdminSearchPicker } from './components/AdminSearchPicker';
import { useAdminSeniors } from './hooks';
import { adminSeniorDisplay, getSectionState } from './selectors';
import { ADMIN_PAGE_SIZE } from './types';

const STATUSES: { value: ExpenseStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

const POTS: { value: CreditCategory; label: string }[] = [
  { value: 'SERVICE', label: 'Service Credit' },
  { value: 'EMERGENCY', label: 'Emergency Credit' },
];

function parseExpenseStatus(value: string | string[] | undefined): ExpenseStatus | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'PENDING' || raw === 'APPROVED' || raw === 'REJECTED') return raw;
  return undefined;
}

function parseExpenseId(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = raw?.trim();
  return id || undefined;
}

export function AdminCreditExpensesScreen() {
  const params = useLocalSearchParams<{ status?: string; expenseId?: string }>();
  const isAuthenticated = useAuthStore((state) => state.status === 'AUTHENTICATED');
  const queryClient = useQueryClient();
  const seniors = useAdminSeniors({ limit: 100, offset: 0 });
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<ExpenseStatus | undefined>(
    () => parseExpenseStatus(params.status) ?? (parseExpenseId(params.expenseId) ? 'PENDING' : 'APPROVED'),
  );
  const [focusExpenseId, setFocusExpenseId] = useState<string | undefined>(() => parseExpenseId(params.expenseId));
  const [seniorId, setSeniorId] = useState<string | null>(null);
  const [category, setCategory] = useState<CreditCategory>('SERVICE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const nextStatus = parseExpenseStatus(params.status);
    const nextExpenseId = parseExpenseId(params.expenseId);
    if (nextExpenseId) {
      setFocusExpenseId(nextExpenseId);
      setOffset(0);
      setStatus(nextStatus ?? 'PENDING');
      return;
    }
    if (nextStatus) {
      setOffset(0);
      setStatus(nextStatus);
    }
  }, [params.status, params.expenseId]);

  const query = useQuery({
    queryKey: creditQueryKeys.expenses({ status, limit: ADMIN_PAGE_SIZE, offset }),
    queryFn: () => fetchCreditExpenses({ status, limit: ADMIN_PAGE_SIZE, offset }),
    enabled: isAuthenticated,
  });
  const focused = useQuery({
    queryKey: [...creditQueryKeys.all, 'expense', focusExpenseId],
    queryFn: () => fetchCreditExpense(focusExpenseId as string),
    enabled: isAuthenticated && Boolean(focusExpenseId),
  });
  const balances = useQuery({
    queryKey: creditQueryKeys.balances(seniorId ?? undefined),
    queryFn: () => fetchCreditBalances(seniorId as string),
    enabled: isAuthenticated && Boolean(seniorId),
  });
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: (query.data?.items.length ?? 0) === 0 && !focused.data,
  });

  const seniorOptions = useMemo(
    () =>
      (seniors.data?.items ?? []).map((senior) => ({
        id: senior.id,
        title: adminSeniorDisplay(senior),
        subtitle: [senior.email, senior.hasMembership ? 'Membership' : 'No membership'].filter(Boolean).join(' · '),
      })),
    [seniors.data?.items],
  );
  const seniorNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const senior of seniors.data?.items ?? []) {
      names.set(senior.id, adminSeniorDisplay(senior));
    }
    return names;
  }, [seniors.data?.items]);

  const review = useMutation({
    mutationFn: ({ expenseId, action }: { expenseId: string; action: 'approve' | 'reject' }) =>
      action === 'approve' ? approveCreditExpense(expenseId) : rejectCreditExpense(expenseId),
    onSuccess: async (expense) => {
      await queryClient.invalidateQueries({ queryKey: creditQueryKeys.all });
      if (expense.status === 'APPROVED') {
        Alert.alert('Approved', 'Credits were deducted and this expense is marked approved.');
      } else if (expense.status === 'REJECTED') {
        Alert.alert('Rejected', 'Expense was rejected. No credits were deducted.');
      }
      if (focusExpenseId && expense.id === focusExpenseId) {
        setFocusExpenseId(undefined);
        setStatus(expense.status);
      }
    },
    onError: (error) => {
      Alert.alert('Review failed', getApiErrorMessage(error));
    },
  });

  const record = useMutation({
    mutationFn: () => {
      const value = Number(amount);
      if (!seniorId) {
        throw new Error('Select the member this bill belongs to.');
      }
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error('Enter the actual amount spent.');
      }
      const note = description.trim();
      if (!note) {
        throw new Error('Enter what this amount is for, for example Grocery & Shopping.');
      }
      return recordAdminCreditExpense({
        seniorId,
        amount: value,
        description: note,
        category,
      });
    },
    onSuccess: async () => {
      setAmount('');
      setDescription('');
      setStatus('APPROVED');
      setOffset(0);
      await queryClient.invalidateQueries({ queryKey: creditQueryKeys.all });
      Alert.alert('Saved', 'The amount was deducted from this member’s credit balance.');
    },
    onError: (error) => {
      Alert.alert('Could not save', getApiErrorMessage(error));
    },
  });

  const selectedPot = category === 'EMERGENCY' ? balances.data?.emergency : balances.data?.service;
  const listItems = (query.data?.items ?? []).filter((item) => item.id !== focused.data?.id);

  return (
    <AdminScreen
      title="Credits"
      subtitle="Approve companion submissions to deduct credits, or record an amount yourself."
    >
      {focused.data ? (
        <View style={styles.focusWrap}>
          <Text style={styles.focusLabel}>From notification</Text>
          <ExpenseCard
            item={focused.data}
            memberName={seniorNames.get(focused.data.seniorId)}
            busy={review.isPending}
            highlighted
            onApprove={() => review.mutate({ expenseId: focused.data.id, action: 'approve' })}
            onReject={() => review.mutate({ expenseId: focused.data.id, action: 'reject' })}
          />
        </View>
      ) : focusExpenseId && focused.isError ? (
        <Text style={styles.warn}>Could not load that expense. It may already be reviewed.</Text>
      ) : null}

      {!focusExpenseId ? (
        <View style={[styles.form, shadows.card]}>
          <Text style={styles.formTitle}>Record actual amount</Text>
          <Text style={styles.formHint}>
            Choose the member, the credit pot, and the bill amount. This is how groceries, medicines, and other variable
            services are charged.
          </Text>
          <AdminSearchPicker
            label="Member"
            placeholder="Search by name or email"
            options={seniorOptions}
            value={seniorId}
            loading={seniors.isPending}
            emptyMessage="No members found."
            onChange={setSeniorId}
          />
          <AdminFilterChips label="Deduct from" value={category} options={POTS} onChange={(next) => next && setCategory(next)} allowAll={false} />
          {seniorId && balances.data ? (
            <Text style={styles.balanceHint}>
              {creditCategoryLabel(category)} available: {formatCreditAmount(selectedPot?.availableBalance ?? 0)} /{' '}
              {formatCreditAmount(selectedPot?.allocatedAmount ?? 0)}
            </Text>
          ) : null}
          {seniorId && balances.data && selectedPot && selectedPot.allocatedAmount === 0 ? (
            <Text style={styles.warn}>This member has no credit pot yet. Activate their membership first.</Text>
          ) : null}
          <TextField
            label="Actual amount (₹)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="350"
          />
          <TextField
            label="What was this for?"
            value={description}
            onChangeText={setDescription}
            placeholder="Grocery & Shopping"
          />
          <PrimaryButton
            label={record.isPending ? 'Saving…' : 'Save and deduct credits'}
            onPress={() => void record.mutate()}
            loading={record.isPending}
          />
        </View>
      ) : null}

      <AdminFilterChips
        label="History"
        value={status}
        options={STATUSES}
        onChange={(next) => {
          setStatus(next);
          setOffset(0);
          setFocusExpenseId(undefined);
        }}
      />
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading expenses..."
        emptyTitle="No expenses"
        emptyMessage="Recorded bills will appear here after you save them."
      >
        <View style={styles.list}>
          {listItems.map((item) => (
            <ExpenseCard
              key={item.id}
              item={item}
              memberName={seniorNames.get(item.seniorId)}
              busy={review.isPending}
              onApprove={() => review.mutate({ expenseId: item.id, action: 'approve' })}
              onReject={() => review.mutate({ expenseId: item.id, action: 'reject' })}
            />
          ))}
        </View>
        <AdminPagination
          offset={offset}
          limit={ADMIN_PAGE_SIZE}
          total={query.data?.total ?? 0}
          onOffsetChange={setOffset}
        />
      </AdminQueryView>
    </AdminScreen>
  );
}

function ExpenseCard({
  item,
  memberName,
  busy,
  highlighted,
  onApprove,
  onReject,
}: {
  item: ServiceExpense;
  memberName?: string;
  busy: boolean;
  highlighted?: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <View style={[styles.card, shadows.card, highlighted ? styles.cardFocus : null]}>
      <Text style={styles.title}>{item.description || 'Service expense'}</Text>
      <Text style={styles.meta}>
        {memberName ?? 'Member'} · {creditCategoryLabel(item.category)} · {item.status}
      </Text>
      <Text style={styles.amount}>{formatCreditAmount(item.amount)}</Text>
      <Text style={styles.meta}>
        {item.createdAt ? formatShortDate(item.createdAt) : 'Just submitted'}
        {item.rejectionReason ? ` · ${item.rejectionReason}` : ''}
      </Text>
      {item.status === 'PENDING' ? (
        <View style={styles.actions}>
          <PrimaryButton label="Approve & deduct credits" onPress={onApprove} loading={busy} />
          <SecondaryButton label="Reject" onPress={onReject} disabled={busy} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  focusWrap: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  focusLabel: {
    ...typography.captionStrong,
    color: colors.primary,
  },
  form: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  formTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  formHint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  balanceHint: {
    ...typography.captionStrong,
    color: colors.text,
  },
  warn: {
    ...typography.caption,
    color: colors.emergency,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  cardFocus: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  amount: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
