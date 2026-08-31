import { getApiErrorMessage } from '@/api/errors';

export type GoogleSignInErrorNative = {
  isErrorWithCode: (error: unknown) => error is { code: string };
  statusCodes: {
    SIGN_IN_CANCELLED: string;
    IN_PROGRESS: string;
    PLAY_SERVICES_NOT_AVAILABLE: string;
  };
};

export const ANDROID_OAUTH_SETUP_MESSAGE =
  'Google rejected this APK. In Google Cloud, open the Android OAuth client, set package in.agewell.family, and add this APK SHA-1 from Expo credentials. Wait a few minutes, then try again.';

function errorCode(caught: unknown): string {
  if (!caught || typeof caught !== 'object') {
    return '';
  }
  const code = (caught as { code?: unknown }).code;
  return typeof code === 'string' || typeof code === 'number' ? String(code) : '';
}

function errorText(caught: unknown): string {
  if (caught instanceof Error) {
    return caught.message;
  }
  if (!caught || typeof caught !== 'object' || !('message' in caught)) {
    return '';
  }
  const message = (caught as { message?: unknown }).message;
  return typeof message === 'string' ? message : '';
}

function isDeveloperConfigError(caught: unknown): boolean {
  const code = errorCode(caught);
  if (code === '10' || code === 'DEVELOPER_ERROR') {
    return true;
  }
  return /DEVELOPER_ERROR|Developer console is not set up correctly/i.test(errorText(caught));
}

export function googleSignInErrorMessage(native: GoogleSignInErrorNative, caught: unknown): string {
  if (native.isErrorWithCode(caught) && caught.code === native.statusCodes.SIGN_IN_CANCELLED) {
    return '';
  }
  if (native.isErrorWithCode(caught) && caught.code === native.statusCodes.IN_PROGRESS) {
    return 'Google sign-in is already in progress.';
  }
  if (native.isErrorWithCode(caught) && caught.code === native.statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
    return 'Google Play services are required for Google sign-in.';
  }
  if (isDeveloperConfigError(caught)) {
    return ANDROID_OAUTH_SETUP_MESSAGE;
  }
  return getApiErrorMessage(caught);
}
