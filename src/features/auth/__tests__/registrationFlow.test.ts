import { authenticatedHomeHref } from '../roleRouting';
import { toAuthUser } from '../authTypes';
import { createAccountHref, emailOtpHref, signInHref } from '../authEntry';
import { onboardingAccountFields, personalDetailsSchema } from '../onboardingProfile';
import { registerSeniorSchema, registerCareSchema } from '../registrationSchemas';
import { registrationSuccessHref } from '../registrationNavigation';

describe('registration schemas', () => {
  it('accepts senior registration values', () => {
    const parsed = registerSeniorSchema.parse({
      firstName: 'Lakshmi',
      lastName: 'Sharma',
      email: 'lakshmi@example.com',
      phone: '9876543210',
      password: 'password123',
      dateOfBirth: '10-03-1952',
      address: 'Borivali',
      emergencyContact: '911',
    });
    expect(parsed.firstName).toBe('Lakshmi');
  });

  it('accepts care associate application values', () => {
    const parsed = registerCareSchema.parse({
      firstName: 'Priya',
      lastName: 'Nair',
      email: 'priya@example.com',
      phone: '9876543212',
      password: 'password123',
      skills: 'Companionship',
      experience: '',
      languages: 'Hindi',
      availability: 'Weekdays',
    });
    expect(parsed.skills).toBe('Companionship');
  });
});

describe('registration success navigation', () => {
  it('builds a success href with email and role', () => {
    const href = registrationSuccessHref({
      email: 'akila@gmail.com',
      role: 'SENIOR',
      message: 'Senior account created.',
    }) as { pathname: string; params: Record<string, string> };
    expect(href.pathname).toBe('/registration-success');
    expect(href.params.email).toBe('akila@gmail.com');
    expect(href.params.role).toBe('SENIOR');
  });

  it('includes care status for applicants', () => {
    const href = registrationSuccessHref({
      email: 'care@example.com',
      role: 'CARE_MANAGER',
      careStatus: 'PENDING',
    }) as { pathname: string; params: Record<string, string> };
    expect(href.params.careStatus).toBe('PENDING');
  });
});

describe('auth entry routing', () => {
  it('sends signed-out members to email sign-in', () => {
    expect(signInHref()).toBe('/(auth)/login');
  });

  it('starts Continue from personal details, not location', () => {
    expect(createAccountHref('google')).toEqual({
      pathname: '/(auth)/personal-details',
      params: { method: 'google' },
    });
    expect(createAccountHref('email')).toEqual({
      pathname: '/(auth)/personal-details',
      params: { method: 'email' },
    });
  });

  it('sends email continue to OTP verification', () => {
    expect(emailOtpHref('signup')).toEqual({
      pathname: '/(auth)/email-otp',
      params: { intent: 'signup' },
    });
  });

  it('sends email sign-in to the same screen with password or code', () => {
    expect(emailOtpHref('signin')).toEqual({
      pathname: '/(auth)/email-otp',
      params: { intent: 'signin' },
    });
  });
});

describe('signed-out entry', () => {
  it('keeps Sign in as the returning-member destination', () => {
    expect(signInHref()).toBe('/(auth)/login');
  });
});

describe('shared onboarding registration', () => {
  it('maps one profile into senior registration fields', () => {
    const parsed = personalDetailsSchema.parse({
      firstName: 'Rahul',
      lastName: 'Sharma',
      phone: '9876543211',
      email: 'rahul@example.com',
      dateOfBirth: '10-03-1985',
      language: 'en',
      address: 'Borivali East, Mumbai',
    });
    const account = onboardingAccountFields(parsed);
    expect(account.firstName).toBe('Rahul');
    expect(account.lastName).toBe('Sharma');
    expect(account.password).toBe('9876543211');
    expect(account.preferredLanguage).toBe('en');
  });
});

describe('role routing after registration', () => {
  it('sends seniors and legacy family accounts to the senior home', () => {
    expect(authenticatedHomeHref('SENIOR')).toBe('/(tabs)');
    expect(authenticatedHomeHref('FAMILY')).toBe('/(tabs)');
  });

  it('sends pending care associates to pending approval', () => {
    expect(authenticatedHomeHref('CARE_MANAGER', { careStatus: 'PENDING' })).toBe('/pending-approval');
    expect(authenticatedHomeHref('CARE_MANAGER', { careStatus: 'ACTIVE' })).toBe('/(care)');
  });
});

describe('toAuthUser account status', () => {
  it('defaults missing account_status to ACTIVE', () => {
    const user = toAuthUser({
      id: '1',
      email: 'a@example.com',
      phone: '111',
      role: 'FAMILY',
      created_at: '2026-01-01T00:00:00Z',
    });
    expect(user.accountStatus).toBe('ACTIVE');
  });

  it('maps account_status when present', () => {
    const user = toAuthUser({
      id: '1',
      email: 'a@example.com',
      phone: '111',
      role: 'SENIOR',
      account_status: 'DISABLED',
      created_at: '2026-01-01T00:00:00Z',
    });
    expect(user.accountStatus).toBe('DISABLED');
  });
});
