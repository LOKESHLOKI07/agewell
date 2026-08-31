import { apiClient } from '@/api/client';
import {
  requestPasswordResetOtp,
  resetPassword,
  verifyPasswordResetOtp,
} from '../passwordResetApi';
import {
  clearPasswordResetSession,
  getPasswordResetSession,
  setPasswordResetSession,
} from '../passwordResetSession';
import { forgotPasswordHref, resetPasswordHref } from '../authEntry';

jest.mock('@/api/client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

const mockedPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

describe('passwordResetApi', () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it('requests a reset code without attaching a session', async () => {
    mockedPost.mockResolvedValue({ data: { message: 'sent' } } as never);

    await requestPasswordResetOtp('member@example.com');

    expect(mockedPost).toHaveBeenCalledWith(
      '/auth/password/forgot',
      { email: 'member@example.com' },
      { skipAuth: true, timeout: 25000 },
    );
  });

  it('maps a verified reset token', async () => {
    mockedPost.mockResolvedValue({
      data: { email: 'member@example.com', reset_token: 'reset-token' },
    } as never);

    await expect(verifyPasswordResetOtp('member@example.com', '123456')).resolves.toEqual({
      email: 'member@example.com',
      resetToken: 'reset-token',
    });
    expect(mockedPost).toHaveBeenCalledWith(
      '/auth/password/verify',
      { email: 'member@example.com', code: '123456' },
      { skipAuth: true },
    );
  });

  it('saves the new password with the reset token', async () => {
    mockedPost.mockResolvedValue({ data: { message: 'updated' } } as never);

    await resetPassword('reset-token', 'newpass12');

    expect(mockedPost).toHaveBeenCalledWith(
      '/auth/password/reset',
      { reset_token: 'reset-token', password: 'newpass12' },
      { skipAuth: true },
    );
  });
});

describe('passwordResetSession', () => {
  beforeEach(() => {
    clearPasswordResetSession();
  });

  it('holds the reset token until it is cleared', () => {
    expect(getPasswordResetSession()).toBeNull();
    setPasswordResetSession(' Member@Example.com ', ' token ');
    expect(getPasswordResetSession()).toEqual({
      email: 'member@example.com',
      resetToken: 'token',
    });
    clearPasswordResetSession();
    expect(getPasswordResetSession()).toBeNull();
  });
});

describe('forgot password routes', () => {
  it('opens forgot password with an optional email', () => {
    expect(forgotPasswordHref()).toBe('/(auth)/forgot-password');
    expect(forgotPasswordHref('member@example.com')).toEqual({
      pathname: '/(auth)/forgot-password',
      params: { email: 'member@example.com' },
    });
    expect(resetPasswordHref()).toBe('/(auth)/reset-password');
  });
});
