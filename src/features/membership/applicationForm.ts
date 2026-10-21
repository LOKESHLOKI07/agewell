import { z } from 'zod';
import type { MembershipPlanKey } from './planCatalog';

export const MEMBERSHIP_APPLY_STEPS = [
  { key: 'for', label: 'Membership For' },
  { key: 'details', label: 'Details' },
  { key: 'living', label: 'Living & Address' },
  { key: 'emergency', label: 'Emergency Contact' },
  { key: 'support', label: 'Support Needs' },
] as const;

export type MembershipApplyStepIndex = 0 | 1 | 2 | 3 | 4;

export const MEMBERSHIP_FOR_OPTIONS = [
  {
    id: 'myself' as const,
    title: 'Myself',
    subtitle: 'I am applying for my own membership.',
  },
  {
    id: 'parent' as const,
    title: 'My Parent',
    subtitle: 'I am applying for my parent.',
  },
  {
    id: 'both_parents' as const,
    title: 'Both Parents',
    subtitle: 'I am applying for both my parents.',
  },
  {
    id: 'other' as const,
    title: 'Other Senior Family Member',
    subtitle: 'I am applying for another senior family member.',
  },
] as const;

export type MembershipForId = (typeof MEMBERSHIP_FOR_OPTIONS)[number]['id'];

export const GENDER_OPTIONS = [
  { id: 'male' as const, label: 'Male' },
  { id: 'female' as const, label: 'Female' },
  { id: 'other' as const, label: 'Other' },
] as const;

export type GenderId = (typeof GENDER_OPTIONS)[number]['id'];

export const LANGUAGE_OPTIONS = [
  { id: 'english' as const, label: 'English' },
  { id: 'hindi' as const, label: 'Hindi' },
  { id: 'marathi' as const, label: 'Marathi' },
  { id: 'other' as const, label: 'Other' },
] as const;

export type LanguageId = (typeof LANGUAGE_OPTIONS)[number]['id'];

export const AREA_OPTIONS = [
  'Kandivali West',
  'Kandivali East',
  'Borivali West',
  'Borivali East',
  'Warora',
  'Bhadravati',
  'Wani',
] as const;

export type AreaId = (typeof AREA_OPTIONS)[number];

export const LIVING_WITH_OPTIONS = [
  { id: 'alone' as const, label: 'Alone', icon: 'home-outline' as const },
  { id: 'spouse' as const, label: 'With spouse', icon: 'people-outline' as const },
  { id: 'children' as const, label: 'With children', icon: 'people-outline' as const },
  { id: 'relatives' as const, label: 'With relatives', icon: 'people-outline' as const },
  { id: 'domestic_help' as const, label: 'With domestic help', icon: 'person-outline' as const },
  { id: 'other' as const, label: 'Other', icon: 'ellipsis-horizontal' as const },
] as const;

export type LivingWithId = (typeof LIVING_WITH_OPTIONS)[number]['id'];

export const RELATIONSHIP_OPTIONS = [
  'Son',
  'Daughter',
  'Spouse',
  'Sibling',
  'Relative',
  'Friend',
  'Caregiver',
  'Other',
] as const;

export const SUPPORT_NEED_OPTIONS = [
  {
    id: 'companionship' as const,
    label: 'Companionship',
    serviceId: 'companion',
    icon: 'hand-heart' as const,
  },
  {
    id: 'health' as const,
    label: 'Health & doctor coordination',
    serviceId: 'doctor',
    icon: 'stethoscope' as const,
  },
  {
    id: 'transportation' as const,
    label: 'Transportation',
    serviceId: 'local-transport',
    icon: 'car-outline' as const,
  },
  {
    id: 'food' as const,
    label: 'Food / Meals',
    serviceId: 'food',
    icon: 'restaurant-outline' as const,
  },
  {
    id: 'grocery' as const,
    label: 'Grocery & Shopping',
    serviceId: 'grocery',
    icon: 'cart-outline' as const,
  },
  {
    id: 'medicine' as const,
    label: 'Medicine assistance',
    serviceId: 'medicine',
    icon: 'pill' as const,
  },
  {
    id: 'digital' as const,
    label: 'Digital assistance',
    serviceId: 'cyber-security',
    icon: 'shield-checkmark-outline' as const,
  },
  {
    id: 'household' as const,
    label: 'Household assistance',
    serviceId: 'home-repair',
    icon: 'wrench' as const,
  },
  {
    id: 'banking' as const,
    label: 'Banking assistance',
    serviceId: 'banking-companion',
    icon: 'landmark' as const,
  },
  {
    id: 'emergency' as const,
    label: 'Emergency support',
    serviceId: 'emergency-sos',
    icon: 'siren' as const,
  },
  {
    id: 'other' as const,
    label: 'Other',
    serviceId: 'errand-coordination',
    icon: 'ellipsis-horizontal' as const,
  },
] as const;

export type SupportNeedId = (typeof SUPPORT_NEED_OPTIONS)[number]['id'];

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');

const optionalPhoneSchema = z
  .string()
  .trim()
  .refine((value) => !value || /^[6-9]\d{9}$/.test(value), 'Enter a valid 10-digit mobile number');

const dobSchema = z
  .string()
  .trim()
  .regex(/^\d{2}\s*\/\s*\d{2}\s*\/\s*\d{4}$/, 'Use DD / MM / YYYY')
  .refine((value) => {
    const match = value.replace(/\s/g, '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      return false;
    }
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }, 'Enter a valid date of birth');

export const membershipApplicationSchema = z
  .object({
    membershipFor: z.enum(['myself', 'parent', 'both_parents', 'other']),
    photoUri: z.string().optional(),
    fullName: z.string().trim().min(1, 'Enter full name'),
    dateOfBirth: dobSchema,
    gender: z.enum(['male', 'female', 'other']),
    mobile: phoneSchema,
    email: z
      .string()
      .trim()
      .refine((value) => !value || z.string().email().safeParse(value).success, 'Enter a valid email'),
    language: z.enum(['english', 'hindi', 'marathi', 'other']),
    address: z.string().trim().min(5, 'Enter residential address'),
    area: z.enum(AREA_OPTIONS),
    pinCode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code'),
    livingWith: z.enum(['alone', 'spouse', 'children', 'relatives', 'domestic_help', 'other']),
    primaryName: z.string().trim().min(1, 'Enter contact name'),
    primaryRelationship: z.string().trim().min(1, 'Select relationship'),
    primaryMobile: phoneSchema,
    primaryWhatsapp: optionalPhoneSchema,
    primaryEmail: z
      .string()
      .trim()
      .refine((value) => !value || z.string().email().safeParse(value).success, 'Enter a valid email'),
    primaryCity: z.string().trim().min(1, 'Enter city'),
    secondaryName: z.string().trim(),
    secondaryRelationship: z.string().trim(),
    secondaryMobile: optionalPhoneSchema,
    secondaryWhatsapp: optionalPhoneSchema,
    secondaryEmail: z
      .string()
      .trim()
      .refine((value) => !value || z.string().email().safeParse(value).success, 'Enter a valid email'),
    secondaryCity: z.string().trim(),
    supportNeeds: z.array(z.string()).min(1, 'Select at least one support need'),
    otherRequirement: z.string().trim(),
    confirmed: z.boolean().refine((value) => value === true, {
      message: 'Please confirm the information to continue',
    }),
  })
  .superRefine((value, ctx) => {
    const hasSecondary =
      Boolean(value.secondaryName.trim()) ||
      Boolean(value.secondaryRelationship.trim()) ||
      Boolean(value.secondaryMobile.trim()) ||
      Boolean(value.secondaryCity.trim());
    if (!hasSecondary) {
      return;
    }
    if (!value.secondaryName.trim()) {
      ctx.addIssue({ code: 'custom', path: ['secondaryName'], message: 'Enter contact name' });
    }
    if (!value.secondaryRelationship.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['secondaryRelationship'],
        message: 'Select relationship',
      });
    }
    if (!value.secondaryMobile.trim()) {
      ctx.addIssue({ code: 'custom', path: ['secondaryMobile'], message: 'Enter mobile number' });
    }
  });

export type MembershipApplicationValues = z.infer<typeof membershipApplicationSchema>;

export type MembershipApplicationDraft = {
  membershipFor: MembershipForId | null;
  photoUri?: string;
  fullName: string;
  dateOfBirth: string;
  gender: GenderId | null;
  mobile: string;
  email: string;
  language: LanguageId | null;
  address: string;
  area: AreaId | null;
  pinCode: string;
  livingWith: LivingWithId | null;
  primaryName: string;
  primaryRelationship: string;
  primaryMobile: string;
  primaryWhatsapp: string;
  primaryEmail: string;
  primaryCity: string;
  secondaryName: string;
  secondaryRelationship: string;
  secondaryMobile: string;
  secondaryWhatsapp: string;
  secondaryEmail: string;
  secondaryCity: string;
  supportNeeds: SupportNeedId[];
  otherRequirement: string;
  confirmed: boolean;
};

export function emptyMembershipApplicationDraft(): MembershipApplicationDraft {
  return {
    membershipFor: null,
    photoUri: undefined,
    fullName: '',
    dateOfBirth: '',
    gender: null,
    mobile: '',
    email: '',
    language: 'english',
    address: '',
    area: null,
    pinCode: '',
    livingWith: null,
    primaryName: '',
    primaryRelationship: '',
    primaryMobile: '',
    primaryWhatsapp: '',
    primaryEmail: '',
    primaryCity: '',
    secondaryName: '',
    secondaryRelationship: '',
    secondaryMobile: '',
    secondaryWhatsapp: '',
    secondaryEmail: '',
    secondaryCity: '',
    supportNeeds: [],
    otherRequirement: '',
    confirmed: false,
  };
}

export function formatDobInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)} / ${digits.slice(2, 4)} / ${digits.slice(4)}`;
}

export function formatDobFromDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day} / ${month} / ${year}`;
}

export function validateApplicationStep(
  step: MembershipApplyStepIndex,
  draft: MembershipApplicationDraft,
): Partial<Record<keyof MembershipApplicationDraft, string>> {
  const errors: Partial<Record<keyof MembershipApplicationDraft, string>> = {};

  if (step === 0) {
    if (!draft.membershipFor) {
      errors.membershipFor = 'Select who this membership is for';
    }
    return errors;
  }

  if (step === 1) {
    if (!draft.fullName.trim()) errors.fullName = 'Enter full name';
    const dob = dobSchema.safeParse(draft.dateOfBirth);
    if (!dob.success) errors.dateOfBirth = dob.error.issues[0]?.message ?? 'Enter date of birth';
    if (!draft.gender) errors.gender = 'Select gender';
    const mobile = phoneSchema.safeParse(draft.mobile);
    if (!mobile.success) errors.mobile = mobile.error.issues[0]?.message ?? 'Enter mobile number';
    if (draft.email.trim() && !z.string().email().safeParse(draft.email.trim()).success) {
      errors.email = 'Enter a valid email';
    }
    if (!draft.language) errors.language = 'Select preferred language';
    return errors;
  }

  if (step === 2) {
    if (draft.address.trim().length < 5) errors.address = 'Enter residential address';
    if (!draft.area) errors.area = 'Select area';
    if (!/^\d{6}$/.test(draft.pinCode.trim())) errors.pinCode = 'Enter a valid 6-digit PIN code';
    if (!draft.livingWith) errors.livingWith = 'Select living arrangement';
    return errors;
  }

  if (step === 3) {
    if (!draft.primaryName.trim()) errors.primaryName = 'Enter contact name';
    if (!draft.primaryRelationship.trim()) errors.primaryRelationship = 'Select relationship';
    const mobile = phoneSchema.safeParse(draft.primaryMobile);
    if (!mobile.success) errors.primaryMobile = mobile.error.issues[0]?.message ?? 'Enter mobile number';
    const whatsapp = optionalPhoneSchema.safeParse(draft.primaryWhatsapp);
    if (!whatsapp.success) {
      errors.primaryWhatsapp = whatsapp.error.issues[0]?.message ?? 'Enter a valid WhatsApp number';
    }
    if (draft.primaryEmail.trim() && !z.string().email().safeParse(draft.primaryEmail.trim()).success) {
      errors.primaryEmail = 'Enter a valid email';
    }
    if (!draft.primaryCity.trim()) errors.primaryCity = 'Enter city';

    const hasSecondary =
      Boolean(draft.secondaryName.trim()) ||
      Boolean(draft.secondaryRelationship.trim()) ||
      Boolean(draft.secondaryMobile.trim()) ||
      Boolean(draft.secondaryCity.trim());
    if (hasSecondary) {
      if (!draft.secondaryName.trim()) errors.secondaryName = 'Enter contact name';
      if (!draft.secondaryRelationship.trim()) {
        errors.secondaryRelationship = 'Select relationship';
      }
      const secondaryMobile = phoneSchema.safeParse(draft.secondaryMobile);
      if (!secondaryMobile.success) {
        errors.secondaryMobile = secondaryMobile.error.issues[0]?.message ?? 'Enter mobile number';
      }
    }
    return errors;
  }

  if (step === 4) {
    if (draft.supportNeeds.length === 0) {
      errors.supportNeeds = 'Select at least one support need';
    }
    if (!draft.confirmed) {
      errors.confirmed = 'Please confirm the information to continue';
    }
  }

  return errors;
}

export function toMembershipApplicationPurchaseBody(
  planKey: MembershipPlanKey,
  draft: MembershipApplicationDraft,
): {
  planKey: MembershipPlanKey;
  notes: string;
  familyContact1Name: string;
  familyContact1Phone: string;
  familyContact2Name?: string;
  familyContact2Phone?: string;
  preferredHospital: string;
} {
  const forLabel =
    MEMBERSHIP_FOR_OPTIONS.find((item) => item.id === draft.membershipFor)?.title ?? 'Unknown';
  const livingLabel =
    LIVING_WITH_OPTIONS.find((item) => item.id === draft.livingWith)?.label ?? 'Unknown';
  const supportLabels = draft.supportNeeds
    .map((id) => SUPPORT_NEED_OPTIONS.find((item) => item.id === id)?.label ?? id)
    .join(', ');

  const notes = [
    `Membership application for: ${forLabel}`,
    `Senior: ${draft.fullName.trim()} · DOB ${draft.dateOfBirth.replace(/\s/g, '')} · ${draft.gender ?? ''}`,
    `Senior mobile: +91 ${draft.mobile.trim()}${draft.email.trim() ? ` · ${draft.email.trim()}` : ''}`,
    `Language: ${draft.language ?? ''}`,
    `Address: ${draft.address.trim()}, ${draft.area ?? ''}, ${draft.pinCode.trim()}`,
    `Lives with: ${livingLabel}`,
    `Primary emergency: ${draft.primaryName.trim()} (${draft.primaryRelationship}) · +91 ${draft.primaryMobile.trim()} · ${draft.primaryCity.trim()}`,
    draft.secondaryName.trim()
      ? `Secondary emergency: ${draft.secondaryName.trim()} (${draft.secondaryRelationship}) · +91 ${draft.secondaryMobile.trim()}`
      : null,
    `Support needs: ${supportLabels}`,
    draft.otherRequirement.trim() ? `Other requirement: ${draft.otherRequirement.trim()}` : null,
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 1900);

  const secondaryName = draft.secondaryName.trim();
  const secondaryMobile = draft.secondaryMobile.trim();

  return {
    planKey,
    notes,
    familyContact1Name: draft.primaryName.trim(),
    familyContact1Phone: draft.primaryMobile.trim(),
    familyContact2Name: secondaryName || undefined,
    familyContact2Phone: secondaryMobile || undefined,
    preferredHospital: `Nearest hospital near ${draft.area ?? 'service area'} — confirm during visit`,
  };
}

export function applicationIdFromRequestId(id: string): string {
  const digits = id.replace(/\D/g, '').slice(-6).padStart(6, '0');
  const year = new Date().getFullYear();
  return `AW-${year}-${digits}`;
}
