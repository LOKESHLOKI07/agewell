import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';

export interface GoogleAuthResult {
  isNew: boolean;
  email: string;
  fullName: string | null;
  identityToken: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}

function mapGoogleAuthResponse(data: {
  is_new: boolean;
  email: string;
  full_name?: string | null;
  identity_token?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
}): GoogleAuthResult {
  return {
    isNew: data.is_new,
    email: data.email,
    fullName: data.full_name ?? null,
    identityToken: data.identity_token ?? null,
    accessToken: data.access_token ?? null,
    refreshToken: data.refresh_token ?? null,
  };
}

export async function signInWithGoogleIdToken(idToken: string): Promise<GoogleAuthResult> {
  try {
    const response = await apiClient.post(
      '/auth/google',
      { id_token: idToken },
      { skipAuth: true, timeout: 25000 },
    );
    return mapGoogleAuthResponse(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function signInWithGoogleCode(payload: {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<GoogleAuthResult> {
  try {
    const response = await apiClient.post(
      '/auth/google',
      {
        code: payload.code,
        redirect_uri: payload.redirectUri,
        code_verifier: payload.codeVerifier,
      },
      { skipAuth: true, timeout: 25000 },
    );
    return mapGoogleAuthResponse(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}
