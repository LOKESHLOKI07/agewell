import { z } from 'zod';
import type { AppLocale } from '@/i18n';

export const ONBOARDING_LANGUAGES: { id: AppLocale; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिन्दी' },
  { id: 'mr', label: 'मराठी' },
];

const DOB_CAPTURE = /^(\d{2})-(\d{2})-(\d{4})$/;
export const DATE_OF_BIRTH_INPUT_LENGTH = 10;

export function formatDateOfBirthInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

/** Keeps digits and manually typed hyphens — does not insert separators. */
export function sanitizeDateOfBirthManualInput(value: string): string {
  return value.replace(/[^\d-]/g, '').slice(0, DATE_OF_BIRTH_INPUT_LENGTH);
}

export function formatDateOfBirthFromDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}-${month}-${year}`;
}

export function parseDateOfBirth(value: string): Date | null {
  const normalized = normalizeDateOfBirth(value);
  if (!isValidDateOfBirth(normalized)) {
    return null;
  }
  const match = normalized.match(DOB_CAPTURE);
  if (!match) {
    return null;
  }
  return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
}

export function normalizeDateOfBirth(value: string): string {
  const formatted = formatDateOfBirthInput(value);
  return DOB_CAPTURE.test(formatted) ? formatted : value.trim();
}

export function isValidDateOfBirth(value: string): boolean {
  const match = normalizeDateOfBirth(value).match(DOB_CAPTURE);
  if (!match) {
    return false;
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export const personalDetailsSchema = z.object({
  firstName: z.string().trim().min(1, 'Enter your first name'),
  lastName: z.string().trim().min(1, 'Enter your last name'),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?\d[\d\s-]{8,14}$/, 'Enter a valid mobile number'),
  email: z.email('Enter a valid email address'),
  dateOfBirth: z
    .string()
    .trim()
    .transform(normalizeDateOfBirth)
    .refine(isValidDateOfBirth, 'Use DD-MM-YYYY'),
  language: z.enum(['en', 'hi', 'mr']),
  address: z.string().trim().min(3, 'Enter your address'),
});

export type PersonalDetailsValues = z.infer<typeof personalDetailsSchema>;

const emptyProfile: PersonalDetailsValues = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  dateOfBirth: '',
  language: 'en',
  address: '',
};

export type ServiceFor = 'single' | 'couple';

export type MembershipKind = ServiceFor;

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? '';
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}

export function initialPasswordFromPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 8 ? digits : `${digits}AgeWell1`.slice(0, 12);
}

export function onboardingLanguageLabel(id: string | null | undefined): string {
  if (!id) {
    return 'Not on file';
  }
  return ONBOARDING_LANGUAGES.find((item) => item.id === id)?.label ?? id;
}

let profile: PersonalDetailsValues = { ...emptyProfile };
let serviceFor: ServiceFor | null = null;
let verifiedEmail = '';
let createdPassword = '';
let googleFullName = '';
let identityToken = '';

export function setOnboardingServiceFor(value: ServiceFor) {
  serviceFor = value;
}

export function getOnboardingServiceFor(): ServiceFor | null {
  return serviceFor;
}

export function setVerifiedEmail(email: string) {
  verifiedEmail = email.trim().toLowerCase();
}

export function getVerifiedEmail(): string {
  return verifiedEmail;
}

export function setCreatedPassword(password: string) {
  createdPassword = password;
}

export function getCreatedPassword(): string {
  return createdPassword;
}

export function hasCreatedPassword(): boolean {
  return createdPassword.length >= 8;
}

export function setGoogleFullName(name: string) {
  googleFullName = name.trim();
}

export function getGoogleFullName(): string {
  return googleFullName;
}

export function startGoogleOnboarding(
  email: string,
  fullName?: string | null,
  token?: string | null,
) {
  setVerifiedEmail(email);
  setGoogleFullName(fullName ?? '');
  setIdentityToken(token ?? '');
  const seed = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  setCreatedPassword(`${seed}AgeWell1`);
}

export function setIdentityToken(token: string) {
  identityToken = token.trim();
}

export function getIdentityToken(): string {
  return identityToken;
}

export function setOnboardingProfile(values: PersonalDetailsValues) {
  profile = { ...values };
}

export function getOnboardingProfile(): PersonalDetailsValues {
  return { ...profile };
}

export function hasOnboardingProfile(): boolean {
  const current = getOnboardingProfile();
  return Boolean(
    current.firstName.trim() &&
      current.lastName.trim() &&
      current.email.trim() &&
      current.phone.trim() &&
      current.address.trim(),
  );
}

export function onboardingAccountFields(values: PersonalDetailsValues) {
  const phone = values.phone.replace(/\s+/g, '');
  const password = getCreatedPassword() || initialPasswordFromPhone(values.phone);
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: (getVerifiedEmail() || values.email).trim(),
    phone,
    password,
    dateOfBirth: values.dateOfBirth,
    address: values.address.trim(),
    preferredLanguage: values.language,
  };
}
