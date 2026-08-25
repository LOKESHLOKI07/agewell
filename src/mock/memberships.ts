import type { Membership } from '@/types';

export const mockMemberships: Membership[] = [
  {
    id: 'membership-family',
    name: 'AgeWell Family',
    priceInrPerMonth: 9999,
    nextRenewalAt: '2026-09-18T00:00:00+05:30',
  },
];

export const mockMembership: Membership = mockMemberships[0] as Membership;
