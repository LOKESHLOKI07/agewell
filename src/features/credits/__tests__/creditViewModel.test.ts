import {
  creditCategoryLabel,
  creditProgress,
  formatCreditAmount,
  transactionSignedAmount,
  transactionTitle,
} from '../creditViewModel';
import type { CreditTransaction } from '../types';

const baseTx: CreditTransaction = {
  id: 'tx-1',
  seniorId: 'senior-1',
  category: 'SERVICE',
  transactionType: 'DEDUCTION',
  amount: 350,
  status: 'COMPLETED',
  description: 'Grocery & Shopping',
  membershipId: null,
  serviceRequestId: 'req-1',
  emergencyCaseId: null,
  expenseId: 'exp-1',
  createdByUserId: null,
  approvedByUserId: 'admin-1',
  createdAt: '2026-10-13T11:20:00.000Z',
};

describe('credit view model', () => {
  it('formats rupee amounts and progress from allocated vs spent', () => {
    expect(formatCreditAmount(1850)).toMatch(/1,850|1850/);
    expect(
      creditProgress({
        category: 'SERVICE',
        allocatedAmount: 2500,
        spentAmount: 650,
        availableBalance: 1850,
      }),
    ).toBeCloseTo(0.26);
    expect(creditCategoryLabel('EMERGENCY')).toBe('Emergency Credit');
  });

  it('signs deductions and allocations for the ledger list', () => {
    expect(transactionTitle(baseTx)).toBe('Grocery & Shopping');
    expect(transactionSignedAmount(baseTx)).toContain('-');
    expect(
      transactionSignedAmount({
        ...baseTx,
        transactionType: 'ALLOCATION',
        description: 'Service credit allocated',
        amount: 2500,
      }),
    ).toContain('+');
  });
});
