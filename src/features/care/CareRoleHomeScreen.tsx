import { parseStaffKind } from './staffKind';
import { CompanionHomeScreen } from './CompanionHomeScreen';
import { CareDashboardScreen } from './CareDashboardScreen';
import { DeliveryHomeScreen } from './DeliveryHomeScreen';
import { useCareManagerProfile } from './hooks';

export function CareRoleHomeScreen() {
  const profile = useCareManagerProfile();
  const kind = parseStaffKind(profile.data?.staffKind);
  if (kind === 'COMPANION') {
    return <CompanionHomeScreen />;
  }
  if (kind === 'DELIVERY_EXECUTIVE') {
    return <DeliveryHomeScreen />;
  }
  return <CareDashboardScreen />;
}
