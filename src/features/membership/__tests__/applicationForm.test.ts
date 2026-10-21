import {
  AREA_OPTIONS,
  applicationIdFromRequestId,
  emptyMembershipApplicationDraft,
  formatDobInput,
  toMembershipApplicationPurchaseBody,
  validateApplicationStep,
} from '../applicationForm';

describe('membership application form', () => {
  it('formats date of birth as DD / MM / YYYY', () => {
    expect(formatDobInput('15031950')).toBe('15 / 03 / 1950');
  });

  it('requires membership-for on step 0', () => {
    const errors = validateApplicationStep(0, emptyMembershipApplicationDraft());
    expect(errors.membershipFor).toMatch(/select who/i);
  });

  it('maps draft to a purchase request body', () => {
    const draft = {
      ...emptyMembershipApplicationDraft(),
      membershipFor: 'myself' as const,
      fullName: 'Lakshmi Sharma',
      dateOfBirth: '15 / 03 / 1950',
      gender: 'female' as const,
      mobile: '9876543210',
      email: 'lakshmi@example.com',
      language: 'english' as const,
      address: '12 Palm Grove, SV Road',
      area: 'Borivali West' as const,
      pinCode: '400092',
      livingWith: 'alone' as const,
      primaryName: 'Asha Sharma',
      primaryRelationship: 'Daughter',
      primaryMobile: '9123456780',
      primaryCity: 'Mumbai',
      supportNeeds: ['companionship' as const, 'food' as const],
      confirmed: true,
    };

    const body = toMembershipApplicationPurchaseBody('single', draft);
    expect(body.planKey).toBe('single');
    expect(body.familyContact1Name).toBe('Asha Sharma');
    expect(body.familyContact1Phone).toBe('9123456780');
    expect(body.preferredHospital).toMatch(/Borivali West/);
    expect(body.notes).toMatch(/Lakshmi Sharma/);
    expect(body.notes).toMatch(/Companionship/);
  });

  it('includes Chandrapur Tier 2 towns on the apply form', () => {
    expect(AREA_OPTIONS).toEqual(expect.arrayContaining(['Warora', 'Bhadravati', 'Wani']));
  });

  it('builds a friendly application id', () => {
    expect(applicationIdFromRequestId('abc-000124')).toMatch(/^AW-\d{4}-000124$/);
  });
});
