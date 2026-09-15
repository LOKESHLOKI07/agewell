import { useCurrentMembership } from '@/features/home/hooks/queries';
import { hasActiveMembership } from './membershipAccess';

/** Active Single Membership for the logged-in senior (404 / expired → false). */
export function useHasActiveMembership() {
  const query = useCurrentMembership();
  return {
    hasMembership: hasActiveMembership(query.data, query.error),
    isPending: query.isPending,
    query,
  };
}
