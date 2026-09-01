import { getMembershipKind } from '@/features/auth/membershipPlanPreference';
import { getOnboardingServiceFor } from '@/features/auth/onboardingProfile';
import type { Href } from 'expo-router';

export type MembershipPlanKey = 'basic' | 'couple';

export const MEMBERSHIP_PLAN_CATALOG = [
  {
    key: 'basic' as const,
    name: 'Basic Membership',
    blurb: 'Full AgeWell Basic care for one senior.',
    features: [
      '19 membership services included',
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
      '19 membership services for the couple',
      'Entrance CCTV add-on available',
      '3 panic buttons with CCTV pack',
    ],
    price: '₹18,499',
    priceNote: '+ ₹5,500 for CCTV + 3 panic buttons',
  },
] as const;

export function getMembershipPlanByKey(key: string | undefined): (typeof MEMBERSHIP_PLAN_CATALOG)[number] | undefined {
  return MEMBERSHIP_PLAN_CATALOG.find((plan) => plan.key === key);
}

/** Prefer the onboarding Single/Couple choice; default to Basic when unknown. */
export function preferredMembershipPlanKey(): MembershipPlanKey {
  const kind = getMembershipKind() ?? getOnboardingServiceFor();
  return kind === 'couple' ? 'couple' : 'basic';
}

export function membershipPurchaseHref(planKey: MembershipPlanKey): Href {
  return { pathname: '/account/purchase', params: { plan: planKey } };
}
