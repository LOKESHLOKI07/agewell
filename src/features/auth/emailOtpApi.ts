import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';

export interface EmailOtpVerifyResult {
  isNew: boolean;
  email: string;
  otpSessionToken: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export async function requestEmailOtp(email: string): Promise<void> {
  try {
    await apiClient.post(
      '/auth/otp/email/request',
      { email },
      { skipAuth: true, timeout: 25000 },
    );
  } catch (error) {
    throw toApiError(error);
  }
}

export async function verifyEmailOtp(email: string, code: string): Promise<EmailOtpVerifyResult> {
  try {
    const response = await apiClient.post(
      '/auth/otp/email/verify',
      { email, code },
      { skipAuth: true },
    );
    const data = response.data as {
      is_new: boolean;
      email: string;
      otp_session_token?: string | null;
      access_token?: string | null;
      refresh_token?: string | null;
    };
    return {
      isNew: data.is_new,
      email: data.email,
      otpSessionToken: data.otp_session_token ?? null,
      accessToken: data.access_token ?? null,
      refreshToken: data.refresh_token ?? null,
    };
  } catch (error) {
    throw toApiError(error);
  }
}
