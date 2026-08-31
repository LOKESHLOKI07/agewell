import type { Href } from 'expo-router';
import type { OnboardingAuthMethod } from './onboardingLocation';

/** First-time Continue buttons start onboarding. Signed-out members use Sign in. */
export function signInHref(): Href {
  return '/(auth)/login' as Href;
}

export function emailOtpHref(intent: 'signup' | 'signin'): Href {
  return { pathname: '/(auth)/email-otp', params: { intent } } as Href;
}

export function createPasswordHref(): Href {
  return '/(auth)/create-password' as Href;
}

export function forgotPasswordHref(email?: string): Href {
  const trimmed = email?.trim();
  if (trimmed) {
    return { pathname: '/(auth)/forgot-password', params: { email: trimmed } } as Href;
  }
  return '/(auth)/forgot-password' as Href;
}

export function resetPasswordHref(): Href {
  return '/(auth)/reset-password' as Href;
}

export function createAccountHref(method: OnboardingAuthMethod = 'email'): Href {
  return { pathname: '/(auth)/personal-details', params: { method } } as Href;
}
