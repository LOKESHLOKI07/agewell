import { useServicesLive } from '@/features/auth/useServicesLive';
import { useSeniorProfile } from '@/features/home/hooks/queries';
import {
  resolveMembershipServicePageVariant,
  type MembershipServicePageVariant,
} from './membershipServicePageVariant';
import { useHasActiveMembership } from './useHasActiveMembership';

export function useMembershipServicePageVariant(
  requireMembership = true,
): MembershipServicePageVariant {
  const senior = useSeniorProfile();
  const inServiceArea = useServicesLive();
  const membership = useHasActiveMembership();

  return resolveMembershipServicePageVariant({
    inServiceArea,
    hasMembership: membership.hasMembership,
    areaReady: senior.isFetched || senior.isError,
    membershipReady: !membership.isPending,
    requireMembership,
  });
}
