import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';
import { toAuthUser, type AuthUser, type TokenResponse } from './authTypes';
import { clearTokens, saveTokens } from './tokenStorage';

export function createLoginFormData(email: string, password: string): URLSearchParams {
  const body = new URLSearchParams();
  // FastAPI OAuth2PasswordRequestForm maps `username` to the account email.
  body.append('username', email);
  body.append('password', password);
  return body;
}

export async function loginWithPassword(email: string, password: string): Promise<AuthUser> {
  try {
    const response = await apiClient.post<TokenResponse>(
      '/auth/login',
      createLoginFormData(email, password),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        skipAuth: true,
      },
    );

    await saveTokens({
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
    });
  } catch (error) {
    throw toApiError(error, 'login');
  }

  try {
    return await fetchCurrentUser();
  } catch (error) {
    await clearTokens();
    throw error;
  }
}

export async function loginWithTokens(accessToken: string, refreshToken: string): Promise<AuthUser> {
  await saveTokens({ accessToken, refreshToken });
  try {
    return await fetchCurrentUser();
  } catch (error) {
    await clearTokens();
    throw error;
  }
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  try {
    const response = await apiClient.get('/users/me');
    return toAuthUser(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function logoutRemote(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    throw toApiError(error);
  }
}

export async function logoutAndClearLocal(): Promise<void> {
  try {
    await logoutRemote();
  } catch {
    // Backend logout is currently stateless. Always drop the local session.
  } finally {
    await clearTokens();
  }
}
