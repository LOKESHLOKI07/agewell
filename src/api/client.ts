import { create, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { ENV } from '@/config/env';
import { expireSession, refreshAccessToken } from '@/api/refreshSession';
import { getAccessToken } from '@/features/auth/tokenStorage';

function isAuthFreeRequest(config: InternalAxiosRequestConfig): boolean {
  if (config.skipAuth) {
    return true;
  }
  const url = `${config.baseURL ?? ''}${config.url ?? ''}`;
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/otp/') ||
    url.includes('/auth/google')
  );
}

function attachAccessToken(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  if (isAuthFreeRequest(config)) {
    return config;
  }

  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

export function shouldAttemptRefresh(error: AxiosError, config?: InternalAxiosRequestConfig): boolean {
  if (!config || isAuthFreeRequest(config) || config._retry) {
    return false;
  }
  return error.response?.status === 401;
}

export function createApiClient() {
  const client = create({
    baseURL: ENV.API_URL ? `${ENV.API_URL}/api/v1` : '/api/v1',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });

  client.interceptors.request.use(attachAccessToken, (error) => Promise.reject(error));

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config;
      if (!shouldAttemptRefresh(error, original) || !original) {
        return Promise.reject(error);
      }

      original._retry = true;

      try {
        const accessToken = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${accessToken}`;
        return client(original);
      } catch {
        await expireSession();
        return Promise.reject(error);
      }
    },
  );

  return client;
}

export const apiClient = createApiClient();
