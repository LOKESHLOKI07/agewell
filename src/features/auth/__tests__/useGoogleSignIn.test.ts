import { ANDROID_OAUTH_SETUP_MESSAGE, googleSignInErrorMessage } from '../googleSignInErrors';

const native = {
  isErrorWithCode: (error: unknown): error is { code: string } =>
    Boolean(error && typeof error === 'object' && 'code' in error),
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
};

describe('googleSignInErrorMessage', () => {
  it('hides cancelled sign-in', () => {
    expect(googleSignInErrorMessage(native, { code: 'SIGN_IN_CANCELLED' })).toBe('');
  });

  it('explains Android OAuth SHA-1 mismatch instead of a generic failure', () => {
    expect(googleSignInErrorMessage(native, { code: '10', message: 'DEVELOPER_ERROR' })).toBe(
      ANDROID_OAUTH_SETUP_MESSAGE,
    );
    expect(googleSignInErrorMessage(native, { code: 'DEVELOPER_ERROR' })).toContain('in.agewell.family');
  });
});
