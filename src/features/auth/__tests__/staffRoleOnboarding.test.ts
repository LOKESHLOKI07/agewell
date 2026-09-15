import { getAppVariant, isCareApp } from '@/config/appVariant';
import { createAccountHref, signInHref } from '../authEntry';
import { setSelectedStaffKind, getSelectedStaffKind, resetSelectedStaffKind } from '../staffKindPreference';

describe('care app onboarding', () => {
  const previous = process.env.EXPO_PUBLIC_APP_VARIANT;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.EXPO_PUBLIC_APP_VARIANT;
    } else {
      process.env.EXPO_PUBLIC_APP_VARIANT = previous;
    }
    resetSelectedStaffKind();
  });

  it('defaults to the family app', () => {
    delete process.env.EXPO_PUBLIC_APP_VARIANT;
    expect(getAppVariant()).toBe('family');
    expect(isCareApp()).toBe(false);
    expect(createAccountHref('mobile')).toEqual({
      pathname: '/(auth)/personal-details',
      params: { method: 'mobile' },
    });
  });

  it('sends Care app account links to Sign in (admin registers staff)', () => {
    process.env.EXPO_PUBLIC_APP_VARIANT = 'care';
    expect(isCareApp()).toBe(true);
    expect(createAccountHref('email')).toBe(signInHref());
    expect(createAccountHref('mobile')).toBe('/(auth)/login');
  });

  it('remembers the selected staff role for the application form', () => {
    setSelectedStaffKind('COMPANION');
    expect(getSelectedStaffKind()).toBe('COMPANION');
  });
});
