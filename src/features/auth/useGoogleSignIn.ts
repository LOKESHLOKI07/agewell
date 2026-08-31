import { useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ENV } from '@/config/env';
import { useAuthStore } from './authStore';
import { createAccountHref } from './authEntry';
import { signInWithGoogleIdToken } from './googleAuthApi';
import { googleSignInErrorMessage } from './googleSignInErrors';
import { startGoogleOnboarding } from './onboardingProfile';

let configured = false;

type GoogleNative = {
  GoogleSignin: {
    configure: (options: { webClientId: string; offlineAccess: boolean }) => void;
    hasPlayServices: (options: { showPlayServicesUpdateDialog: boolean }) => Promise<boolean>;
    signOut: () => Promise<unknown>;
    signIn: () => Promise<unknown>;
  };
  isErrorWithCode: (error: unknown) => error is { code: string };
  statusCodes: {
    SIGN_IN_CANCELLED: string;
    IN_PROGRESS: string;
    PLAY_SERVICES_NOT_AVAILABLE: string;
  };
};

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

function nativeGoogleSignInAvailable(): boolean {
  return Platform.OS === 'android' && !isExpoGo();
}

function loadGoogleNative(): GoogleNative | null {
  if (!nativeGoogleSignInAvailable()) {
    return null;
  }
  try {
    return require('@react-native-google-signin/google-signin') as GoogleNative;
  } catch {
    return null;
  }
}

function configureGoogleSignIn(native: GoogleNative) {
  if (configured) {
    return;
  }
  const clientId = ENV.googleWebClientId;
  if (!clientId) {
    return;
  }
  native.GoogleSignin.configure({
    webClientId: clientId,
    offlineAccess: false,
  });
  configured = true;
}

function googleIdTokenFromResponse(response: unknown): string | null {
  if (!response || typeof response !== 'object') {
    return null;
  }
  const record = response as Record<string, unknown>;
  if (record.type === 'cancelled' || record.type === 'noSavedCredentialFound') {
    return null;
  }
  const data = (record.data ?? record) as Record<string, unknown>;
  const token = data.idToken;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

export function useGoogleSignIn() {
  const completeLogin = useAuthStore((state) => state.completeLogin);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientId = ENV.googleWebClientId;
  const ready = nativeGoogleSignInAvailable() && Boolean(clientId);

  const continueWithGoogle = async () => {
    if (busy) {
      return;
    }
    setError(null);
    if (isExpoGo() || Platform.OS !== 'android') {
      setError('Google sign-in works in the AgeWell Android APK, not in Expo Go. Install the latest APK from EAS.');
      return;
    }
    if (!clientId) {
      setError('Google sign-in is not configured.');
      return;
    }
    const native = loadGoogleNative();
    if (!native) {
      setError('Google sign-in is missing from this build. Install the latest AgeWell APK.');
      return;
    }

    setBusy(true);
    try {
      configureGoogleSignIn(native);
      await native.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      try {
        await native.GoogleSignin.signOut();
      } catch {
        // Ignore if there is no previous Google session.
      }
      const response = await native.GoogleSignin.signIn();
      const idToken = googleIdTokenFromResponse(response);
      if (!idToken) {
        if (response && typeof response === 'object' && (response as { type?: string }).type === 'cancelled') {
          return;
        }
        setError(
          'Google did not return an identity token. Confirm the Android OAuth client package is in.agewell.family and the SHA-1 matches this APK.',
        );
        return;
      }

      const auth = await signInWithGoogleIdToken(idToken);
      if (!auth.isNew && auth.accessToken && auth.refreshToken) {
        await completeLogin(auth.accessToken, auth.refreshToken);
        return;
      }
      startGoogleOnboarding(auth.email, auth.fullName, auth.identityToken);
      router.push(createAccountHref('google'));
    } catch (caught) {
      const message = googleSignInErrorMessage(native, caught);
      if (message) {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  };

  return {
    continueWithGoogle,
    ready,
    busy,
    error,
  };
}
