import { getMembershipKind } from '@/features/auth/membershipPlanPreference';
import type { Href } from 'expo-router';

export type MembershipPlanKey = 'single' | 'couple';

export const MEMBERSHIP_ONBOARDING_NOTE =
  'Onboarding takes time. Services cannot start instantly after a medical emergency — take membership beforehand.';

export const MEMBERSHIP_PLAN_CATALOG = [
  {
    key: 'single' as const,
    name: 'Single Membership',
    blurb: 'Full AgeWell care for one senior.',
    features: [
      '21 membership services included',
      '20 companion visits / month (up to 30 mins)',
      'Entrance CCTV add-on available',
      '2 panic buttons with CCTV pack',
    ],
    price: '₹15,499',
    priceNote: '+ ₹4,000 for entrance CCTV + 2 panic buttons',
  },
  {
    key: 'couple' as const,
    name: 'Couple Membership',
    blurb: 'Shared care cover for two seniors in one home.',
    features: [
      '21 membership services for the couple',
      '20 companion visits / month (up to 30 mins)',
      'Entrance CCTV add-on available',
      '3 panic buttons with CCTV pack',
    ],
    price: '₹18,499',
    priceNote: '+ ₹5,500 for CCTV + 3 panic buttons',
  },
] as const;

export function getMembershipPlanByKey(key: string | undefined): (typeof MEMBERSHIP_PLAN_CATALOG)[number] | undefined {
  const normalized = key === 'basic' ? 'single' : key;
  return MEMBERSHIP_PLAN_CATALOG.find((plan) => plan.key === normalized);
}

/** Default to Single when no plan is specified. */
export function preferredMembershipPlanKey(): MembershipPlanKey {
  return getMembershipKind() === 'couple' ? 'couple' : 'single';
}

export function membershipPurchaseHref(planKey?: MembershipPlanKey): Href {
  if (!planKey) {
    return '/account/purchase';
  }
  return { pathname: '/account/purchase', params: { plan: planKey } };
}
