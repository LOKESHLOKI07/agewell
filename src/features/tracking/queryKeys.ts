import { queryClient } from '@/api/queryClient';

export const trackingQueryKeys = {
  all: ['tracking'] as const,
  mine: ['tracking', 'sessions', 'me'] as const,
  senior: (seniorId: string) => ['tracking', 'sessions', 'senior', seniorId] as const,
  latest: (sessionId: string) => ['tracking', 'latest', sessionId] as const,
  careAssociate: (visitId: string) => ['tracking', 'careAssociate', visitId] as const,
  careAssociateLatest: (visitId: string) => ['tracking', 'careAssociate', visitId, 'latest'] as const,
  careAssociateSession: (visitId: string) => ['tracking', 'careAssociate', visitId, 'session'] as const,
};

export async function invalidateTrackingQueries() {
  await queryClient.invalidateQueries({ queryKey: trackingQueryKeys.all });
}
