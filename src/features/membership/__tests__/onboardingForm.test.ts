import { membershipOnboardingSchema, toMembershipPurchaseBody } from '../onboardingForm';

describe('membership onboarding form', () => {
  it('requires family member 1, a phone, and a nearby hospital', () => {
    const parsed = membershipOnboardingSchema.safeParse({
      familyContact1Name: '',
      familyContact1Phone: '12',
      familyContact2Name: '',
      familyContact2Phone: '',
      preferredHospital: '',
    });
    expect(parsed.success).toBe(false);
  });

  it('accepts a second family member only when name and phone are both present', () => {
    const incomplete = membershipOnboardingSchema.safeParse({
      familyContact1Name: 'Asha',
      familyContact1Phone: '9876543210',
      familyContact2Name: 'Rohit',
      familyContact2Phone: '',
      preferredHospital: 'Apex Hospital, Borivali',
    });
    expect(incomplete.success).toBe(false);

    const complete = membershipOnboardingSchema.safeParse({
      familyContact1Name: 'Asha',
      familyContact1Phone: '9876543210',
      familyContact2Name: 'Rohit',
      familyContact2Phone: '9876501234',
      preferredHospital: 'Apex Hospital, Borivali',
    });
    expect(complete.success).toBe(true);
    if (!complete.success) {
      return;
    }
    expect(toMembershipPurchaseBody('single', complete.data).familyContact2Name).toBe('Rohit');
  });
});
