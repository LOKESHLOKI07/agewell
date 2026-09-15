import { toMembershipRequest } from '../mappers';
import {
  getMembershipPlanByKey,
  MEMBERSHIP_ONBOARDING_NOTE,
  MEMBERSHIP_PLAN_CATALOG,
  membershipPurchaseHref,
  preferredMembershipPlanKey,
} from '../planCatalog';

jest.mock('@/features/auth/membershipPlanPreference', () => ({
  getMembershipKind: jest.fn(() => null),
}));

describe('membership plan catalog', () => {
  it('covers single and couple purchase keys', () => {
    expect(MEMBERSHIP_PLAN_CATALOG.map((plan) => plan.key)).toEqual(['single', 'couple']);
    expect(getMembershipPlanByKey('single')?.price).toMatch(/15,499/);
    expect(getMembershipPlanByKey('couple')?.price).toMatch(/18,499/);
    expect(getMembershipPlanByKey('single')?.features.join(' ')).toMatch(/20 companion visits/);
    expect(getMembershipPlanByKey('basic')?.key).toBe('single');
    expect(MEMBERSHIP_ONBOARDING_NOTE).toMatch(/take membership beforehand/i);
  });

  it('defaults to single when no plan has been chosen yet', () => {
    expect(preferredMembershipPlanKey()).toBe('single');
  });

  it('opens all plans when no purchase key is given', () => {
    expect(membershipPurchaseHref()).toBe('/account/purchase');
    expect(membershipPurchaseHref('couple')).toEqual({
      pathname: '/account/purchase',
      params: { plan: 'couple' },
    });
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
        plan_name: 'Single Membership',
        plan_price: 15499,
        status: 'REQUESTED',
        notes: null,
        family_contact_1_name: 'Asha Sharma',
        family_contact_1_phone: '9876543210',
        family_contact_2_name: null,
        family_contact_2_phone: null,
        preferred_hospital: 'Apex Hospital, Borivali',
        created_at: '2026-09-01T09:00:00.000Z',
        reviewed_at: null,
      }),
    ).toEqual({
      id: 'req-1',
      seniorId: 'senior-1',
      seniorName: 'Lakshmi Sharma',
      planId: 'plan-1',
      planName: 'Single Membership',
      planPrice: 15499,
      status: 'REQUESTED',
      notes: null,
      familyContact1Name: 'Asha Sharma',
      familyContact1Phone: '9876543210',
      familyContact2Name: null,
      familyContact2Phone: null,
      preferredHospital: 'Apex Hospital, Borivali',
      createdAt: '2026-09-01T09:00:00.000Z',
      reviewedAt: null,
    });
  });
});
