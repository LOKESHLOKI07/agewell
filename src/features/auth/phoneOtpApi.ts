import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';
import { fetchCurrentUser } from './authService';
import type { AuthUser, TokenResponse } from './authTypes';
import { saveTokens } from './tokenStorage';

export interface PhoneOtpSentResult {
  message: string;
  channel: string;
  contact: string;
  debugCode: string | null;
}

export async function requestPhoneOtp(phone: string): Promise<PhoneOtpSentResult> {
  try {
    const response = await apiClient.post<{
      message: string;
      channel: string;
      contact: string;
      debug_code?: string | null;
    }>(
      '/auth/otp/phone/request',
      { phone: phone.replace(/\s+/g, '') },
      { skipAuth: true },
    );
    return {
      message: response.data.message,
      channel: response.data.channel,
      contact: response.data.contact,
      debugCode: response.data.debug_code ?? null,
    };
  } catch (error) {
    throw toApiError(error);
  }
}

export async function verifyPhoneOtp(phone: string, code: string): Promise<AuthUser> {
  try {
    const response = await apiClient.post<TokenResponse & { phone: string }>(
      '/auth/otp/phone/verify',
      { phone: phone.replace(/\s+/g, ''), code: code.trim() },
      { skipAuth: true },
    );
    await saveTokens({
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
    });
    return await fetchCurrentUser();
  } catch (error) {
    throw toApiError(error);
  }
}
