import Constants from 'expo-constants';

export type AppVariant = 'family' | 'care';

function readExtraVariant(): string {
  const extra = Constants.expoConfig?.extra as { appVariant?: unknown } | undefined;
  return typeof extra?.appVariant === 'string' ? extra.appVariant : '';
}

export function getAppVariant(): AppVariant {
  const fromEnv = process.env.EXPO_PUBLIC_APP_VARIANT;
  if (fromEnv === 'care' || fromEnv === 'family') {
    return fromEnv;
  }
  const fromExtra = readExtraVariant();
  if (fromExtra === 'care' || fromExtra === 'family') {
    return fromExtra;
  }
  return 'family';
}

export function isCareApp(): boolean {
  return getAppVariant() === 'care';
}

export function isFamilyApp(): boolean {
  return getAppVariant() === 'family';
}
