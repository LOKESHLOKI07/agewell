import { MembershipApplicationFlow } from '@/features/membership/MembershipApplicationFlow';
import { getMembershipPlanByKey, preferredMembershipPlanKey } from '@/features/membership/planCatalog';
import { useLocalSearchParams } from 'expo-router';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function shouldOpenForm(raw: string | undefined): boolean {
  if (!raw) return false;
  const key = raw.trim().toLowerCase();
  return key === 'form' || key === '1' || key === 'apply';
}

export default function AccountApplyScreen() {
  const params = useLocalSearchParams<{
    plan?: string | string[];
    step?: string | string[];
  }>();
  const rawPlan = firstParam(params.plan);
  const planKey = getMembershipPlanByKey(rawPlan)?.key ?? preferredMembershipPlanKey();
  return <MembershipApplicationFlow planKey={planKey} skipIntro={shouldOpenForm(firstParam(params.step))} />;
}
