import { z } from 'zod';
import type { MembershipPlanKey } from './planCatalog';

export const membershipOnboardingSchema = z
  .object({
    familyContact1Name: z.string().trim().min(1, 'Enter family member 1 name'),
    familyContact1Phone: z.string().trim().min(8, 'Enter a valid phone number').max(20),
    familyContact2Name: z.string().trim(),
    familyContact2Phone: z.string().trim(),
    preferredHospital: z.string().trim().min(1, 'Enter a nearby hospital for emergency admission'),
  })
  .superRefine((value, ctx) => {
    const name = value.familyContact2Name.trim();
    const phone = value.familyContact2Phone.trim();
    if (name && phone.length < 8) {
      ctx.addIssue({ code: 'custom', path: ['familyContact2Phone'], message: 'Enter a valid phone number' });
    }
    if (phone && !name) {
      ctx.addIssue({ code: 'custom', path: ['familyContact2Name'], message: 'Enter family member 2 name' });
    }
  });

export type MembershipOnboardingValues = z.infer<typeof membershipOnboardingSchema>;

export function emptyMembershipOnboardingValues(): MembershipOnboardingValues {
  return {
    familyContact1Name: '',
    familyContact1Phone: '',
    familyContact2Name: '',
    familyContact2Phone: '',
    preferredHospital: '',
  };
}

export function toMembershipPurchaseBody(
  planKey: MembershipPlanKey,
  values: MembershipOnboardingValues,
): {
  planKey: MembershipPlanKey;
  familyContact1Name: string;
  familyContact1Phone: string;
  familyContact2Name?: string;
  familyContact2Phone?: string;
  preferredHospital: string;
} {
  const family2Name = values.familyContact2Name.trim();
  const family2Phone = values.familyContact2Phone.trim();
  return {
    planKey,
    familyContact1Name: values.familyContact1Name.trim(),
    familyContact1Phone: values.familyContact1Phone.trim(),
    familyContact2Name: family2Name || undefined,
    familyContact2Phone: family2Phone || undefined,
    preferredHospital: values.preferredHospital.trim(),
  };
}
