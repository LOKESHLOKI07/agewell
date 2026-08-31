import Constants from 'expo-constants';

/**
 * Central environment configuration.
 *
 * If EXPO_PUBLIC_API_URL is set, that host is always used (dev and production).
 * Otherwise in development the API host is inferred:
 * - Web / iOS simulator: http://localhost:8001
 * - Android emulator:    Metro host (usually 10.0.2.2)
 * - Physical device:     http://<your-lan-ip>:8001
 */
function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

function readPublicApiUrl(): string {
  const value = process.env.EXPO_PUBLIC_API_URL;
  if (typeof value !== 'string') {
    return '';
  }
  return stripTrailingSlash(value.trim());
}

function metroHost(): string {
  try {
    const extras = Constants as {
      expoConfig?: { hostUri?: string };
      expoGoConfig?: { debuggerHost?: string };
    };
    const raw = extras.expoConfig?.hostUri || extras.expoGoConfig?.debuggerHost || '';
    return raw.replace(/^\w+:\/\//, '').split('/')[0]?.split(':')[0] ?? '';
  } catch {
    return '';
  }
}

function inferDevApiUrl(): string {
  if (typeof document !== 'undefined') {
    return 'http://localhost:8001';
  }
  const host = metroHost();
  if (host) {
    return `http://${host}:8001`;
  }
  return 'http://localhost:8001';
}

function readApiUrl(): string {
  const configured = readPublicApiUrl();
  if (configured) {
    return configured;
  }
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return inferDevApiUrl();
  }
  return '';
}

const apiUrl = readApiUrl();

if (!apiUrl) {
  console.warn(
    'EXPO_PUBLIC_API_URL is not set. Use localhost for iOS, 10.0.2.2 for Android emulator, or your machine LAN IP for a physical device.',
  );
}

function readAndroidMapsKey(): string {
  return process.env.ANDROID_GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_ANDROID_GOOGLE_MAPS_API_KEY || '';
}

function readIosMapsKey(): string {
  return process.env.IOS_GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_IOS_GOOGLE_MAPS_API_KEY || '';
}

function readGoogleWebClientId(): string {
  return (
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
    ''
  ).trim();
}

export const ENV = {
  API_URL: apiUrl,
  ENV: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') !== 'production',
  androidGoogleMapsApiKey: readAndroidMapsKey(),
  iosGoogleMapsApiKey: readIosMapsKey(),
  googleWebClientId: readGoogleWebClientId(),
};

export function getApiBaseUrl(): string {
  return ENV.API_URL;
}
