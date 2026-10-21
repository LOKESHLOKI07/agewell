import { MembershipApplicationFlow } from '@/features/membership/MembershipApplicationFlow';
import type { MembershipApplyStepIndex } from '@/features/membership/applicationForm';
import { getMembershipPlanByKey, preferredMembershipPlanKey } from '@/features/membership/planCatalog';
import { useLocalSearchParams } from 'expo-router';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const STEP_ALIASES: Record<string, MembershipApplyStepIndex> = {
  for: 0,
  '0': 0,
  details: 1,
  '1': 1,
  living: 2,
  address: 2,
  '2': 2,
  emergency: 3,
  '3': 3,
  support: 4,
  '4': 4,
};

function parseApplyStep(raw: string | undefined): MembershipApplyStepIndex | undefined {
  if (!raw) return undefined;
  return STEP_ALIASES[raw.trim().toLowerCase()];
}

export default function AccountApplyScreen() {
  const params = useLocalSearchParams<{
    plan?: string | string[];
    step?: string | string[];
  }>();
  const rawPlan = firstParam(params.plan);
  const planKey = getMembershipPlanByKey(rawPlan)?.key ?? preferredMembershipPlanKey();
  const initialStep = parseApplyStep(firstParam(params.step));
  return <MembershipApplicationFlow planKey={planKey} initialStep={initialStep} />;
}
