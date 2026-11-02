import type { IconName } from '@/components/ui';
import { formatCurrencyInr, formatShortDate } from '@/utils/date';
import type { CreditAccountBalance, CreditCategory, CreditTransaction } from './types';

export function creditProgress(account: CreditAccountBalance): number {
  if (account.allocatedAmount <= 0) {
    return 0;
  }
  return Math.min(Math.max(account.spentAmount / account.allocatedAmount, 0), 1);
}

export function formatCreditAmount(amount: number): string {
  return formatCurrencyInr(amount);
}

export function creditCategoryLabel(category: CreditCategory): string {
  return category === 'EMERGENCY' ? 'Emergency Credit' : 'Service Credit';
}

export function transactionTitle(row: CreditTransaction): string {
  if (row.description?.trim()) {
    return row.description.trim();
  }
  return row.transactionType === 'ALLOCATION' ? 'Payment Received' : 'Service expense';
}

export function transactionSignedAmount(row: CreditTransaction): string {
  const value = formatCreditAmount(row.amount);
  return row.transactionType === 'DEDUCTION' ? `-${value}` : `+${value}`;
}

export function transactionIcon(row: CreditTransaction): IconName {
  const title = transactionTitle(row).toLowerCase();
  if (row.category === 'EMERGENCY' || title.includes('emergency') || title.includes('ambulance')) {
    return 'warning-outline';
  }
  if (row.transactionType === 'ALLOCATION' || title.includes('payment') || title.includes('allocated')) {
    return 'card-outline';
  }
  if (title.includes('grocery') || title.includes('shop')) {
    return 'cart-outline';
  }
  if (title.includes('doctor')) {
    return 'medkit-outline';
  }
  if (title.includes('companion')) {
    return 'people-outline';
  }
  return 'clipboard-outline';
}

export function transactionWhen(row: CreditTransaction): string {
  return row.createdAt ? formatShortDate(row.createdAt) : '';
}

export const RECHARGE_UNAVAILABLE_LABEL = 'Pay Now';
export const RECHARGE_UNAVAILABLE_HINT = 'Recharge is not available in this phase.';
