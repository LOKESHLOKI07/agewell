import { isAxiosError } from 'axios';

export type ApiErrorContext = 'login' | 'admin' | 'default';

const MESSAGES = {
  loginUnauthorized: 'Incorrect email or password.',
  sessionExpired: 'Your session has expired. Please sign in again.',
  forbidden: "You don't have permission to access this information.",
  forbiddenArea: "You don't have permission to access this area.",
  notFound: 'We could not find that information.',
  conflict: 'This record already exists.',
  emailExists: 'This email is already registered. Sign in, or use a different email.',
  phoneExists: 'This phone number is already registered. Sign in, or use a different number.',
  badRequest: 'Please check the information you entered and try again.',
  server: 'AgeWell is having trouble right now. Please try again shortly.',
  network: 'Unable to connect to AgeWell. Please check your internet connection.',
  generic: 'Something went wrong. Please try again.',
} as const;

const CONFLICT_DETAIL_MESSAGES: Record<string, string> = {
  'Email already exists': MESSAGES.emailExists,
  'Phone already exists': MESSAGES.phoneExists,
};

function conflictMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return MESSAGES.conflict;
  }
  const detail = error.response?.data?.detail;
  if (typeof detail === 'string' && CONFLICT_DETAIL_MESSAGES[detail]) {
    return CONFLICT_DETAIL_MESSAGES[detail];
  }
  return MESSAGES.conflict;
}

function isTimeout(error: unknown): boolean {
  return isAxiosError(error) && error.code === 'ECONNABORTED';
}

function isNetworkError(error: unknown): boolean {
  if (!isAxiosError(error)) {
    return false;
  }
  return !error.response || error.code === 'ERR_NETWORK' || error.message === 'Network Error';
}

export function getApiErrorMessage(error: unknown, context: ApiErrorContext = 'default'): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (isTimeout(error) || isNetworkError(error)) {
    return MESSAGES.network;
  }

  if (!isAxiosError(error)) {
    return MESSAGES.generic;
  }

  const status = error.response?.status;

  switch (status) {
    case 400:
    case 422: {
      const detail = isAxiosError(error) ? error.response?.data?.detail : undefined;
      if (status === 400 && typeof detail === 'string' && detail.trim()) {
        return detail;
      }
      return MESSAGES.badRequest;
    }
    case 401: {
      const detail = error.response?.data?.detail;
      if (context !== 'login' && typeof detail === 'string' && detail.trim()) {
        return detail;
      }
      return context === 'login' ? MESSAGES.loginUnauthorized : MESSAGES.sessionExpired;
    }
    case 403:
      return context === 'admin' ? MESSAGES.forbiddenArea : MESSAGES.forbidden;
    case 404:
      return MESSAGES.notFound;
    case 409:
      return conflictMessage(error);
    case 429: {
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string' && detail.trim()) {
        return detail;
      }
      return 'Please wait a moment and try again.';
    }
    case 500:
    case 502:
    case 503: {
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string' && detail.trim()) {
        return detail;
      }
      return MESSAGES.server;
    }
    default:
      return MESSAGES.generic;
  }
}

export function isEmailAlreadyRegistered(error: unknown): boolean {
  return getApiErrorMessage(error) === MESSAGES.emailExists;
}

export function isPhoneAlreadyRegistered(error: unknown): boolean {
  return getApiErrorMessage(error) === MESSAGES.phoneExists;
}

export class ApiError extends Error {
  readonly status?: number;
  readonly context: ApiErrorContext;

  constructor(message: string, status?: number, context: ApiErrorContext = 'default') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.context = context;
  }
}

export function toApiError(error: unknown, context: ApiErrorContext = 'default'): ApiError {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  return new ApiError(getApiErrorMessage(error, context), status, context);
}
