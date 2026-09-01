import { toMembershipRequest } from '../mappers';
import { getMembershipPlanByKey, MEMBERSHIP_PLAN_CATALOG, preferredMembershipPlanKey } from '../planCatalog';

jest.mock('@/features/auth/membershipPlanPreference', () => ({
  getMembershipKind: jest.fn(() => 'couple'),
}));

jest.mock('@/features/auth/onboardingProfile', () => ({
  getOnboardingServiceFor: jest.fn(() => null),
}));

describe('membership plan catalog', () => {
  it('covers basic and couple purchase keys', () => {
    expect(MEMBERSHIP_PLAN_CATALOG.map((plan) => plan.key)).toEqual(['basic', 'couple']);
    expect(getMembershipPlanByKey('basic')?.price).toMatch(/15,499/);
    expect(getMembershipPlanByKey('couple')?.price).toMatch(/18,499/);
  });

  it('prefers couple when onboarding chose a couple plan', () => {
    expect(preferredMembershipPlanKey()).toBe('couple');
  });
});

describe('membership request mapper', () => {
  it('maps a purchase request without dropping the senior or plan', () => {
    expect(
      toMembershipRequest({
        id: 'req-1',
        senior_id: 'senior-1',
        senior_name: 'Lakshmi Sharma',
        plan_id: 'plan-1',
        plan_name: 'Basic Membership',
        plan_price: 15499,
        status: 'REQUESTED',
        notes: null,
        created_at: '2026-09-01T09:00:00.000Z',
        reviewed_at: null,
      }),
    ).toEqual({
      id: 'req-1',
      seniorId: 'senior-1',
      seniorName: 'Lakshmi Sharma',
      planId: 'plan-1',
      planName: 'Basic Membership',
      planPrice: 15499,
      status: 'REQUESTED',
      notes: null,
      createdAt: '2026-09-01T09:00:00.000Z',
      reviewedAt: null,
    });
  });
});
