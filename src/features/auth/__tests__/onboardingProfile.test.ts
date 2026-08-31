import {
  formatDateOfBirthFromDate,
  formatDateOfBirthInput,
  getOnboardingProfile,
  hasOnboardingProfile,
  initialPasswordFromPhone,
  isValidDateOfBirth,
  normalizeDateOfBirth,
  onboardingAccountFields,
  parseDateOfBirth,
  personalDetailsSchema,
  setCreatedPassword,
  setOnboardingProfile,
  splitFullName,
  startGoogleOnboarding,
  getVerifiedEmail,
  getGoogleFullName,
  getCreatedPassword,
  getIdentityToken,
} from '../onboardingProfile';

describe('personal details', () => {
  it('formats and validates a real calendar date', () => {
    expect(normalizeDateOfBirth('10-03-1952')).toBe('10-03-1952');
    expect(isValidDateOfBirth('10-03-1952')).toBe(true);
    expect(isValidDateOfBirth('32-13-2020')).toBe(false);
  });

  it('inserts hyphens while typing digits so a number pad is enough', () => {
    expect(formatDateOfBirthInput('10')).toBe('10');
    expect(formatDateOfBirthInput('1003')).toBe('10-03');
    expect(formatDateOfBirthInput('10031952')).toBe('10-03-1952');
    expect(formatDateOfBirthInput('10-03-195')).toBe('10-03-195');
    expect(normalizeDateOfBirth('10031952')).toBe('10-03-1952');
    expect(isValidDateOfBirth('10031952')).toBe(true);
  });

  it('converts a picked calendar date into the onboarding format', () => {
    expect(formatDateOfBirthFromDate(new Date(1952, 2, 10))).toBe('10-03-1952');
    expect(parseDateOfBirth('10-03-1952')?.getFullYear()).toBe(1952);
    expect(parseDateOfBirth('32-13-2020')).toBeNull();
  });

  it('accepts onboarding profile values', () => {
    const parsed = personalDetailsSchema.parse({
      firstName: 'Lakshmi',
      lastName: 'Sharma',
      phone: '9876543210',
      email: 'lakshmi@example.com',
      dateOfBirth: '10-03-1952',
      language: 'hi',
      address: 'Kandivali West, Mumbai',
    });
    expect(parsed.firstName).toBe('Lakshmi');
    expect(parsed.lastName).toBe('Sharma');
    expect(parsed.language).toBe('hi');
  });

  it('splits a Google full name and maps account fields', () => {
    expect(splitFullName('Lakshmi Sharma')).toEqual({ firstName: 'Lakshmi', lastName: 'Sharma' });
    expect(splitFullName('Lakshmi')).toEqual({ firstName: 'Lakshmi', lastName: '' });
    expect(initialPasswordFromPhone('98765 43210')).toBe('9876543210');

    setOnboardingProfile(
      personalDetailsSchema.parse({
        firstName: 'Lakshmi',
        lastName: 'Sharma',
        phone: '9876543210',
        email: 'lakshmi@example.com',
        dateOfBirth: '10-03-1952',
        language: 'hi',
        address: 'Kandivali West, Mumbai',
      }),
    );
    expect(hasOnboardingProfile()).toBe(true);
    setCreatedPassword('AgeWellPass1');
    expect(onboardingAccountFields(getOnboardingProfile())).toMatchObject({
      firstName: 'Lakshmi',
      lastName: 'Sharma',
      preferredLanguage: 'hi',
      password: 'AgeWellPass1',
    });
  });

  it('starts Google onboarding with a verified email and a hidden password', () => {
    startGoogleOnboarding('Lakshmi.Sharma@gmail.com', 'Lakshmi Sharma', 'google-identity');
    expect(getVerifiedEmail()).toBe('lakshmi.sharma@gmail.com');
    expect(getGoogleFullName()).toBe('Lakshmi Sharma');
    expect(getCreatedPassword().length).toBeGreaterThanOrEqual(8);
    expect(getIdentityToken()).toBe('google-identity');
  });
});
