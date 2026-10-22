import { z } from 'zod';
import type { MembershipPlanKey } from './planCatalog';

export const MEMBERSHIP_APPLY_STEPS = [
  { key: 'for', label: 'Membership\nFor' },
  { key: 'form', label: 'Application\nForm' },
] as const;

export type MembershipApplyStepIndex = 0 | 1;

export const AREA_OPTIONS = [
  'Kandivali West',
  'Kandivali East',
  'Borivali West',
  'Borivali East',
  'Warora',
  'Bhadravati',
  'Wani',
] as const;

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');

const optionalPhoneSchema = z
  .string()
  .trim()
  .refine((value) => !value || /^[6-9]\d{9}$/.test(value), 'Enter a valid 10-digit mobile number');

export const membershipApplicationSchema = z.object({
  family1Name: z.string().trim().min(1, 'Enter name'),
  family1Phone: phoneSchema,
  family2Name: z.string().trim(),
  family2Phone: optionalPhoneSchema,
  emergencyName: z.string().trim(),
  emergencyPhone: optionalPhoneSchema,
});

export type MembershipApplicationValues = z.infer<typeof membershipApplicationSchema>;

export type MembershipApplicationDraft = {
  family1Name: string;
  family1Phone: string;
  family2Name: string;
  family2Phone: string;
  emergencyName: string;
  emergencyPhone: string;
};

export function emptyMembershipApplicationDraft(): MembershipApplicationDraft {
  return {
    family1Name: '',
    family1Phone: '',
    family2Name: '',
    family2Phone: '',
    emergencyName: '',
    emergencyPhone: '',
  };
}

export function validateApplicationForm(
  draft: MembershipApplicationDraft,
): Partial<Record<keyof MembershipApplicationDraft, string>> {
  const errors: Partial<Record<keyof MembershipApplicationDraft, string>> = {};

  if (!draft.family1Name.trim()) {
    errors.family1Name = 'Enter name';
  }
  const family1Phone = phoneSchema.safeParse(draft.family1Phone);
  if (!family1Phone.success) {
    errors.family1Phone = family1Phone.error.issues[0]?.message ?? 'Enter mobile number';
  }

  const family2Phone = optionalPhoneSchema.safeParse(draft.family2Phone);
  if (!family2Phone.success) {
    errors.family2Phone = family2Phone.error.issues[0]?.message ?? 'Enter a valid mobile number';
  }

  const emergencyPhone = optionalPhoneSchema.safeParse(draft.emergencyPhone);
  if (!emergencyPhone.success) {
    errors.emergencyPhone = emergencyPhone.error.issues[0]?.message ?? 'Enter a valid mobile number';
  }

  return errors;
}

export function toMembershipApplicationPurchaseBody(
  planKey: MembershipPlanKey,
  draft: MembershipApplicationDraft,
): {
  planKey: MembershipPlanKey;
  familyContact1Name: string;
  familyContact1Phone: string;
  familyContact2Name?: string;
  familyContact2Phone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
} {
  const family2Name = draft.family2Name.trim();
  const family2Phone = draft.family2Phone.trim();
  const emergencyName = draft.emergencyName.trim();
  const emergencyPhone = draft.emergencyPhone.trim();

  return {
    planKey,
    familyContact1Name: draft.family1Name.trim(),
    familyContact1Phone: draft.family1Phone.trim(),
    familyContact2Name: family2Name || undefined,
    familyContact2Phone: family2Phone || undefined,
    emergencyContactName: emergencyName || undefined,
    emergencyContactPhone: emergencyPhone || undefined,
  };
}

export function applicationIdFromRequestId(id: string): string {
  const digits = id.replace(/\D/g, '').slice(-6).padStart(6, '0');
  const year = new Date().getFullYear();
  return `AW-${year}-${digits}`;
}
