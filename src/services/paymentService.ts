import { mockPayments } from '@/mock/payments';
import { mockMembership } from '@/mock/memberships';
import type { Membership, Payment } from '@/types';
import { delay } from '@/utils/delay';

export async function getCurrentMembership(): Promise<Membership> {
  await delay(200);
  return mockMembership;
}

export async function getPaymentHistory(): Promise<Payment[]> {
  await delay(250);
  return [...mockPayments].sort((a, b) => b.paidAt.localeCompare(a.paidAt));
}
