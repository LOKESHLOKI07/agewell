import { Alert } from 'react-native';
import { router } from 'expo-router';
import {
  canAvailServices,
  SERVICE_AREA_LOCKED_MESSAGE,
  SERVICE_AREA_LOCKED_TITLE,
} from '@/features/auth/serviceAreaPreference';
import {
  membershipPurchaseHref,
  preferredMembershipPlanKey,
  type MembershipPlanKey,
} from './planCatalog';

export function openMembershipPurchase(planKey?: MembershipPlanKey) {
  if (!canAvailServices()) {
    Alert.alert(SERVICE_AREA_LOCKED_TITLE, SERVICE_AREA_LOCKED_MESSAGE);
    return;
  }
  router.push(membershipPurchaseHref(planKey ?? preferredMembershipPlanKey()));
}
