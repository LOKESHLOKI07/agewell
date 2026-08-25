import type { Payment } from '@/types';

export const mockPayments: Payment[] = [
  {
    id: 'pay-2026-08-18',
    membershipId: 'membership-family',
    amountInr: 9999,
    paidAt: '2026-08-18T08:00:00+05:30',
    status: 'paid',
  },
  {
    id: 'pay-2026-07-18',
    membershipId: 'membership-family',
    amountInr: 9999,
    paidAt: '2026-07-18T08:00:00+05:30',
    status: 'paid',
  },
];
