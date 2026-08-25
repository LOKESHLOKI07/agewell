import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';
import { toIsoDate } from '@/utils/date';
import { fetchCurrentUser } from './authService';
import type { AuthUser, TokenResponse } from './authTypes';
import { saveTokens } from './tokenStorage';
import type { RegisterCareValues, RegisterFamilyValues, RegisterSeniorValues } from './registrationSchemas';

export interface RegistrationResult {
  user: AuthUser;
  role: string;
  accountStatus: string;
  careStatus: string | null;
  message: string;
}

interface RegistrationApiResponse extends TokenResponse {
  role: string;
  account_status: string;
  care_status?: string | null;
  message: string;
}

async function completeRegistration(data: RegistrationApiResponse): Promise<RegistrationResult> {
  await saveTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  });
  const user = await fetchCurrentUser();
  return {
    user,
    role: data.role,
    accountStatus: data.account_status,
    careStatus: data.care_status ?? null,
    message: data.message,
  };
}

export async function registerSenior(values: RegisterSeniorValues): Promise<RegistrationResult> {
  try {
    const response = await apiClient.post<RegistrationApiResponse>(
      '/auth/register/senior',
      {
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        date_of_birth: toIsoDate(values.dateOfBirth),
        address: values.address,
        emergency_contact: values.emergencyContact,
      },
      { skipAuth: true },
    );
    return await completeRegistration(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function registerFamily(values: RegisterFamilyValues): Promise<RegistrationResult> {
  try {
    const response = await apiClient.post<RegistrationApiResponse>(
      '/auth/register/family',
      {
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        relationship: values.relationship,
        requested_senior_reference: values.requestedSeniorReference || null,
      },
      { skipAuth: true },
    );
    return await completeRegistration(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function registerCareAssociate(values: RegisterCareValues): Promise<RegistrationResult> {
  try {
    const response = await apiClient.post<RegistrationApiResponse>(
      '/auth/register/care-associate',
      {
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        skills: values.skills || null,
        experience: values.experience || null,
        languages: values.languages || null,
        availability: values.availability || null,
      },
      { skipAuth: true },
    );
    return await completeRegistration(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}
