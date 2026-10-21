import { useServicesLive } from '@/features/auth/useServicesLive';
import { useServiceLocality } from '@/features/auth/useServiceLocality';
import { useSeniorProfile } from '@/features/home/hooks/queries';
import { isServiceOfferedInLocality } from '@/features/services/addOnServiceCatalog';
import {
  resolveMembershipServicePageVariant,
  type MembershipServicePageVariant,
} from './membershipServicePageVariant';
import { useHasActiveMembership } from './useHasActiveMembership';

export function useMembershipServicePageVariant(
  requireMembership = true,
  slug?: string,
): MembershipServicePageVariant {
  const senior = useSeniorProfile();
  const inServiceArea = useServicesLive();
  const locality = useServiceLocality();
  const membership = useHasActiveMembership();

  return resolveMembershipServicePageVariant({
    inServiceArea,
    hasMembership: membership.hasMembership,
    areaReady: senior.isFetched || senior.isError,
    membershipReady: !membership.isPending,
    requireMembership,
    offeredInLocality: slug ? isServiceOfferedInLocality(slug, locality.tier) : true,
  });
}
