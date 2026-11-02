import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PrimaryButton, TextField } from '@/components';
import { cardSurface, colors, spacing, typography } from '@/constants/theme';
import { getApiErrorMessage } from '@/api/errors';
import { submitCreditExpense } from './api';
import { creditQueryKeys } from './queryKeys';

export function ExpenseSubmitForm({
  serviceRequestId,
  emergencyCaseId,
  title,
}: {
  serviceRequestId?: string;
  emergencyCaseId?: string;
  title: string;
}) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const submit = useMutation({
    mutationFn: () => {
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error('Enter the actual amount spent.');
      }
      return submitCreditExpense({
        serviceRequestId,
        emergencyCaseId,
        amount: value,
        description: description.trim() || title,
      });
    },
    onSuccess: async () => {
      setAmount('');
      setDescription('');
      await queryClient.invalidateQueries({ queryKey: creditQueryKeys.all });
      Alert.alert('Submitted', 'Expense is pending admin approval. The balance is unchanged until approved.');
    },
    onError: (error) => {
      Alert.alert('Could not submit', getApiErrorMessage(error));
    },
  });

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Submit actual amount</Text>
      <Text style={styles.hint}>Admin must approve before this is deducted from the member’s credit.</Text>
      <TextField
        label="Amount (₹)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0"
      />
      <TextField
        label="Details"
        value={description}
        onChangeText={setDescription}
        placeholder={title}
      />
      <PrimaryButton
        label={submit.isPending ? 'Submitting…' : 'Submit for approval'}
        onPress={() => void submit.mutate()}
        loading={submit.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardSurface,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...typography.subtitle,
    color: colors.text,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
