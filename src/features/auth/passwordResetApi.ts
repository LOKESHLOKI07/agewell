import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';

export async function requestPasswordResetOtp(email: string): Promise<void> {
  try {
    await apiClient.post(
      '/auth/password/forgot',
      { email },
      { skipAuth: true, timeout: 25000 },
    );
  } catch (error) {
    throw toApiError(error);
  }
}

export async function verifyPasswordResetOtp(
  email: string,
  code: string,
): Promise<{ email: string; resetToken: string }> {
  try {
    const response = await apiClient.post(
      '/auth/password/verify',
      { email, code },
      { skipAuth: true },
    );
    const data = response.data as { email: string; reset_token: string };
    return { email: data.email, resetToken: data.reset_token };
  } catch (error) {
    throw toApiError(error);
  }
}

export async function resetPassword(resetToken: string, password: string): Promise<void> {
  try {
    await apiClient.post(
      '/auth/password/reset',
      { reset_token: resetToken, password },
      { skipAuth: true },
    );
  } catch (error) {
    throw toApiError(error);
  }
}
