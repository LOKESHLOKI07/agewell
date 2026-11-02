export type CreditCategory = 'SERVICE' | 'EMERGENCY';
export type CreditTransactionType = 'ALLOCATION' | 'DEDUCTION';
export type CreditTransactionStatus = 'COMPLETED';
export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CreditAccountBalance {
  category: CreditCategory;
  allocatedAmount: number;
  spentAmount: number;
  availableBalance: number;
}

export interface CreditBalances {
  seniorId: string;
  service: CreditAccountBalance;
  emergency: CreditAccountBalance;
  totalSpentAmount: number;
}

export interface CreditTransaction {
  id: string;
  seniorId: string;
  category: CreditCategory;
  transactionType: CreditTransactionType;
  amount: number;
  status: CreditTransactionStatus;
  description: string | null;
  membershipId: string | null;
  serviceRequestId: string | null;
  emergencyCaseId: string | null;
  expenseId: string | null;
  createdByUserId: string | null;
  approvedByUserId: string | null;
  createdAt: string | null;
}

export interface ServiceExpense {
  id: string;
  seniorId: string;
  category: CreditCategory;
  amount: number;
  description: string | null;
  status: ExpenseStatus;
  serviceRequestId: string | null;
  emergencyCaseId: string | null;
  receiptDocumentId: string | null;
  submittedByUserId: string;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string | null;
}

export interface CreditBalancesResponse {
  senior_id: string;
  service: {
    category: CreditCategory;
    allocated_amount: number;
    spent_amount: number;
    available_balance: number;
  };
  emergency: {
    category: CreditCategory;
    allocated_amount: number;
    spent_amount: number;
    available_balance: number;
  };
  total_spent_amount: number;
}

export interface CreditTransactionResponse {
  id: string;
  senior_id: string;
  category: CreditCategory;
  transaction_type: CreditTransactionType;
  amount: number;
  status: CreditTransactionStatus;
  description: string | null;
  membership_id: string | null;
  service_request_id: string | null;
  emergency_case_id: string | null;
  expense_id: string | null;
  created_by_user_id: string | null;
  approved_by_user_id: string | null;
  created_at: string | null;
}

export interface ServiceExpenseResponse {
  id: string;
  senior_id: string;
  category: CreditCategory;
  amount: number;
  description: string | null;
  status: ExpenseStatus;
  service_request_id: string | null;
  emergency_case_id: string | null;
  receipt_document_id: string | null;
  submitted_by_user_id: string;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string | null;
}
