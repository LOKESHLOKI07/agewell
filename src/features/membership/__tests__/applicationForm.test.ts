import {
  AREA_OPTIONS,
  applicationIdFromRequestId,
  emptyMembershipApplicationDraft,
  toMembershipApplicationPurchaseBody,
  validateApplicationForm,
} from '../applicationForm';

describe('membership application form', () => {
  it('requires family member 1 name and mobile', () => {
    const errors = validateApplicationForm(emptyMembershipApplicationDraft());
    expect(errors.family1Name).toMatch(/enter name/i);
    expect(errors.family1Phone).toMatch(/mobile number/i);
    expect(errors.family2Name).toBeUndefined();
    expect(errors.family2Phone).toBeUndefined();
    expect(errors.emergencyName).toBeUndefined();
    expect(errors.emergencyPhone).toBeUndefined();
  });

  it('keeps family member 2 and emergency contact optional', () => {
    const errors = validateApplicationForm({
      ...emptyMembershipApplicationDraft(),
      family1Name: 'Asha Sharma',
      family1Phone: '9123456780',
    });
    expect(errors).toEqual({});
  });

  it('validates optional phones only when filled', () => {
    const errors = validateApplicationForm({
      ...emptyMembershipApplicationDraft(),
      family1Name: 'Asha Sharma',
      family1Phone: '9123456780',
      family2Name: 'Rohit',
      family2Phone: '12',
      emergencyPhone: '555',
    });
    expect(errors.family2Phone).toMatch(/mobile number/i);
    expect(errors.emergencyPhone).toMatch(/mobile number/i);
    expect(errors.family2Name).toBeUndefined();
    expect(errors.emergencyName).toBeUndefined();
  });

  it('maps draft to a purchase request body', () => {
    const draft = {
      ...emptyMembershipApplicationDraft(),
      family1Name: 'Asha Sharma',
      family1Phone: '9123456780',
      family2Name: 'Rohit Sharma',
      family2Phone: '9876501234',
      emergencyName: 'Neha Sharma',
      emergencyPhone: '9988776655',
    };

    const body = toMembershipApplicationPurchaseBody('single', draft);
    expect(body.planKey).toBe('single');
    expect(body.familyContact1Name).toBe('Asha Sharma');
    expect(body.familyContact1Phone).toBe('9123456780');
    expect(body.familyContact2Name).toBe('Rohit Sharma');
    expect(body.familyContact2Phone).toBe('9876501234');
    expect(body.emergencyContactName).toBe('Neha Sharma');
    expect(body.emergencyContactPhone).toBe('9988776655');
    expect(body).not.toHaveProperty('preferredHospital');
    expect(body).not.toHaveProperty('notes');
  });

  it('includes Chandrapur Tier 2 towns on the apply form', () => {
    expect(AREA_OPTIONS).toEqual(expect.arrayContaining(['Warora', 'Bhadravati', 'Wani']));
  });

  it('builds a friendly application id', () => {
    expect(applicationIdFromRequestId('abc-000124')).toMatch(/^AW-\d{4}-000124$/);
  });
});
