import { membershipOnboardingSchema, toMembershipPurchaseBody } from '../onboardingForm';

describe('membership onboarding form', () => {
  it('requires family member 1 name and phone only', () => {
    const parsed = membershipOnboardingSchema.safeParse({
      familyContact1Name: '',
      familyContact1Phone: '12',
      familyContact2Name: '',
      familyContact2Phone: '',
      preferredHospital: '',
    });
    expect(parsed.success).toBe(false);
  });

  it('keeps family member 2 optional', () => {
    const nameOnly = membershipOnboardingSchema.safeParse({
      familyContact1Name: 'Asha',
      familyContact1Phone: '9876543210',
      familyContact2Name: 'Rohit',
      familyContact2Phone: '',
      preferredHospital: '',
    });
    expect(nameOnly.success).toBe(true);

    const complete = membershipOnboardingSchema.safeParse({
      familyContact1Name: 'Asha',
      familyContact1Phone: '9876543210',
      familyContact2Name: 'Rohit',
      familyContact2Phone: '9876501234',
      preferredHospital: '',
    });
    expect(complete.success).toBe(true);
    if (!complete.success) {
      return;
    }
    expect(toMembershipPurchaseBody('single', complete.data).familyContact2Name).toBe('Rohit');
    expect(toMembershipPurchaseBody('single', complete.data).preferredHospital).toBeUndefined();
  });
});
