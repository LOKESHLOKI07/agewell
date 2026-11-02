import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';
import type { ListPage } from '@/features/home/types/home';
import { toCreditBalances, toCreditTransactionPage, toServiceExpense, toServiceExpensePage } from './mappers';
import type { CreditBalances, CreditCategory, CreditTransaction, ExpenseStatus, ServiceExpense } from './types';

export async function fetchCreditBalances(seniorId?: string): Promise<CreditBalances> {
  try {
    const response = await apiClient.get('/credits/balances', {
      params: seniorId ? { senior_id: seniorId } : undefined,
    });
    return toCreditBalances(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function fetchCreditTransactions(params?: {
  seniorId?: string;
  category?: CreditCategory;
  limit?: number;
  offset?: number;
}): Promise<ListPage<CreditTransaction>> {
  try {
    const response = await apiClient.get('/credits/transactions', {
      params: {
        limit: params?.limit ?? 50,
        offset: params?.offset ?? 0,
        ...(params?.seniorId ? { senior_id: params.seniorId } : {}),
        ...(params?.category ? { category: params.category } : {}),
      },
    });
    return toCreditTransactionPage(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function fetchCreditExpenses(params?: {
  seniorId?: string;
  status?: ExpenseStatus;
  limit?: number;
  offset?: number;
}): Promise<ListPage<ServiceExpense>> {
  try {
    const response = await apiClient.get('/credits/expenses', {
      params: {
        limit: params?.limit ?? 50,
        offset: params?.offset ?? 0,
        ...(params?.seniorId ? { senior_id: params.seniorId } : {}),
        ...(params?.status ? { status: params.status } : {}),
      },
    });
    return toServiceExpensePage(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function submitCreditExpense(input: {
  serviceRequestId?: string;
  emergencyCaseId?: string;
  amount: number;
  description?: string;
}): Promise<ServiceExpense> {
  try {
    const response = await apiClient.post('/credits/expenses', {
      service_request_id: input.serviceRequestId ?? null,
      emergency_case_id: input.emergencyCaseId ?? null,
      amount: input.amount,
      description: input.description ?? null,
    });
    return toServiceExpense(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function recordAdminCreditExpense(input: {
  seniorId: string;
  amount: number;
  description: string;
  category: CreditCategory;
}): Promise<ServiceExpense> {
  try {
    const response = await apiClient.post('/credits/expenses/record', {
      senior_id: input.seniorId,
      amount: input.amount,
      description: input.description,
      category: input.category,
    });
    return toServiceExpense(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function fetchCreditExpense(expenseId: string): Promise<ServiceExpense> {
  try {
    const response = await apiClient.get(`/credits/expenses/${encodeURIComponent(expenseId)}`);
    return toServiceExpense(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function approveCreditExpense(expenseId: string): Promise<ServiceExpense> {
  try {
    const response = await apiClient.post(`/credits/expenses/${encodeURIComponent(expenseId)}/approve`);
    return toServiceExpense(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function rejectCreditExpense(expenseId: string, reason?: string): Promise<ServiceExpense> {
  try {
    const response = await apiClient.post(`/credits/expenses/${encodeURIComponent(expenseId)}/reject`, {
      reason: reason ?? null,
    });
    return toServiceExpense(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}
