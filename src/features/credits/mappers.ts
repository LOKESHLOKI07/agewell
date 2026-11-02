import { toListPage } from '@/features/home/api/mappers';
import type { ListPage } from '@/features/home/types/home';
import type {
  CreditAccountBalance,
  CreditBalances,
  CreditBalancesResponse,
  CreditCategory,
  CreditTransaction,
  CreditTransactionResponse,
  CreditTransactionType,
  ExpenseStatus,
  ServiceExpense,
  ServiceExpenseResponse,
} from './types';

function asRecord(payload: unknown, label: string): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    throw new Error(`Invalid ${label}`);
  }
  return payload as Record<string, unknown>;
}

function asId(value: unknown, label: string): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  throw new Error(`Invalid ${label}`);
}

function asNumber(value: unknown, label: string): number {
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) {
    throw new Error(`Invalid ${label}`);
  }
  return amount;
}

function asOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asCategory(value: unknown): CreditCategory {
  return value === 'EMERGENCY' ? 'EMERGENCY' : 'SERVICE';
}

function asTransactionType(value: unknown): CreditTransactionType {
  return value === 'DEDUCTION' ? 'DEDUCTION' : 'ALLOCATION';
}

function asExpenseStatus(value: unknown): ExpenseStatus {
  if (value === 'APPROVED' || value === 'REJECTED' || value === 'PENDING') {
    return value;
  }
  return 'PENDING';
}

function toAccount(payload: unknown, fallback: CreditCategory): CreditAccountBalance {
  const data = asRecord(payload, 'credit account');
  return {
    category: asCategory(data.category ?? fallback),
    allocatedAmount: asNumber(data.allocated_amount, 'allocated_amount'),
    spentAmount: asNumber(data.spent_amount, 'spent_amount'),
    availableBalance: asNumber(data.available_balance, 'available_balance'),
  };
}

export function toCreditBalances(payload: unknown): CreditBalances {
  const data = asRecord(payload, 'credit balances') as unknown as CreditBalancesResponse;
  return {
    seniorId: asId(data.senior_id, 'senior_id'),
    service: toAccount(data.service, 'SERVICE'),
    emergency: toAccount(data.emergency, 'EMERGENCY'),
    totalSpentAmount: asNumber(data.total_spent_amount, 'total_spent_amount'),
  };
}

export function toCreditTransaction(payload: unknown): CreditTransaction {
  const data = asRecord(payload, 'credit transaction') as unknown as CreditTransactionResponse;
  return {
    id: asId(data.id, 'transaction.id'),
    seniorId: asId(data.senior_id, 'transaction.senior_id'),
    category: asCategory(data.category),
    transactionType: asTransactionType(data.transaction_type),
    amount: asNumber(data.amount, 'transaction.amount'),
    status: 'COMPLETED',
    description: asOptionalString(data.description),
    membershipId: asOptionalString(data.membership_id),
    serviceRequestId: asOptionalString(data.service_request_id),
    emergencyCaseId: asOptionalString(data.emergency_case_id),
    expenseId: asOptionalString(data.expense_id),
    createdByUserId: asOptionalString(data.created_by_user_id),
    approvedByUserId: asOptionalString(data.approved_by_user_id),
    createdAt: asOptionalString(data.created_at),
  };
}

export function toCreditTransactionPage(payload: unknown): ListPage<CreditTransaction> {
  return toListPage(payload, toCreditTransaction, 'credit transactions');
}

export function toServiceExpense(payload: unknown): ServiceExpense {
  const data = asRecord(payload, 'service expense') as unknown as ServiceExpenseResponse;
  return {
    id: asId(data.id, 'expense.id'),
    seniorId: asId(data.senior_id, 'expense.senior_id'),
    category: asCategory(data.category),
    amount: asNumber(data.amount, 'expense.amount'),
    description: asOptionalString(data.description),
    status: asExpenseStatus(data.status),
    serviceRequestId: asOptionalString(data.service_request_id),
    emergencyCaseId: asOptionalString(data.emergency_case_id),
    receiptDocumentId: asOptionalString(data.receipt_document_id),
    submittedByUserId: asId(data.submitted_by_user_id, 'expense.submitted_by_user_id'),
    reviewedByUserId: asOptionalString(data.reviewed_by_user_id),
    reviewedAt: asOptionalString(data.reviewed_at),
    rejectionReason: asOptionalString(data.rejection_reason),
    createdAt: asOptionalString(data.created_at),
  };
}

export function toServiceExpensePage(payload: unknown): ListPage<ServiceExpense> {
  return toListPage(payload, toServiceExpense, 'service expenses');
}
