import {
  hydrateReturnToSignIn,
  markReturnToSignIn,
  resetAuthEntryPreference,
  shouldOpenSignInWhenSignedOut,
  unauthenticatedEntryHref,
} from '../authEntryPreference';

describe('authEntryPreference', () => {
  beforeEach(() => {
    resetAuthEntryPreference();
  });

  it('opens Welcome for first-time visitors', () => {
    expect(shouldOpenSignInWhenSignedOut()).toBe(false);
    expect(unauthenticatedEntryHref()).toBe('/(auth)/welcome');
  });

  it('opens Sign in after a member has logged in or out', async () => {
    await markReturnToSignIn();
    expect(shouldOpenSignInWhenSignedOut()).toBe(true);
    expect(unauthenticatedEntryHref()).toBe('/(auth)/login');
  });

  it('restores the Sign in preference after hydrate', async () => {
    await markReturnToSignIn();
    resetAuthEntryPreference();
    // markReturnToSignIn wrote SecureStore; hydrate reads it back
    await hydrateReturnToSignIn();
    expect(shouldOpenSignInWhenSignedOut()).toBe(true);
  });
});
