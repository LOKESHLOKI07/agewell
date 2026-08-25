import { create } from 'axios';
import { ENV } from '@/config/env';
import { notifySessionInvalid } from '@/api/sessionBridge';
import { clearTokens, getRefreshToken, saveTokens } from '@/features/auth/tokenStorage';
import type { RefreshRequest, TokenResponse } from '@/features/auth/authTypes';

const refreshClient = create({
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

let refreshInFlight: Promise<string> | null = null;

function refreshUrl(): string {
  return `${ENV.API_URL}/api/v1/auth/refresh`;
}

async function requestNewTokens(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const body: RefreshRequest = { refresh_token: refreshToken };
  const response = await refreshClient.post<TokenResponse>(refreshUrl(), body);
  const { access_token, refresh_token } = response.data;

  if (!access_token || !refresh_token) {
    throw new Error('Invalid refresh response');
  }

  await saveTokens({ accessToken: access_token, refreshToken: refresh_token });
  return access_token;
}

export async function refreshAccessToken(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = requestNewTokens().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function expireSession(): Promise<void> {
  await clearTokens();
  notifySessionInvalid();
}

export function resetRefreshLock(): void {
  refreshInFlight = null;
}
