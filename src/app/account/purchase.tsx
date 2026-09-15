import { MembershipPurchaseScreen } from '@/features/membership/MembershipPurchaseScreen';
import { getMembershipPlanByKey } from '@/features/membership/planCatalog';
import { useLocalSearchParams } from 'expo-router';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function AccountPurchaseScreen() {
  const raw = firstParam(useLocalSearchParams<{ plan?: string | string[] }>().plan);
  const planKey = getMembershipPlanByKey(raw)?.key;
  return <MembershipPurchaseScreen planKey={planKey} />;
}
