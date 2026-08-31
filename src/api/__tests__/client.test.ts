import { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { shouldAttemptRefresh } from '../client';

function config(overrides: Partial<InternalAxiosRequestConfig> = {}): InternalAxiosRequestConfig {
  return {
    headers: {},
    url: '/users/me',
    ...overrides,
  } as InternalAxiosRequestConfig;
}

function error(status: number, requestConfig: InternalAxiosRequestConfig): AxiosError {
  return {
    isAxiosError: true,
    response: { status, data: {}, statusText: '', headers: {}, config: requestConfig },
    config: requestConfig,
    name: 'AxiosError',
    message: 'fail',
    toJSON: () => ({}),
  };
}

describe('shouldAttemptRefresh', () => {
  it('attempts refresh once for a protected 401', () => {
    const request = config();
    expect(shouldAttemptRefresh(error(401, request), request)).toBe(true);
  });

  it('does not refresh login or refresh requests', () => {
    const login = config({ url: '/auth/login', skipAuth: true });
    const refresh = config({ url: '/auth/refresh', skipAuth: true });
    const google = config({ url: '/auth/google', skipAuth: true });
    expect(shouldAttemptRefresh(error(401, login), login)).toBe(false);
    expect(shouldAttemptRefresh(error(401, refresh), refresh)).toBe(false);
    expect(shouldAttemptRefresh(error(401, google), google)).toBe(false);
  });

  it('prevents infinite refresh loops', () => {
    const request = config({ _retry: true });
    expect(shouldAttemptRefresh(error(401, request), request)).toBe(false);
  });

  it('does not refresh 403 responses', () => {
    const request = config();
    expect(shouldAttemptRefresh(error(403, request), request)).toBe(false);
  });
});
