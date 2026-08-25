import { queryClient } from '@/api/queryClient';

export const communityQueryKeys = {
  all: ['community'] as const,
  events: ['community', 'events'] as const,
  event: (eventId: string) => ['community', 'event', eventId] as const,
  registrations: ['community', 'registrations'] as const,
  eventRegistration: (eventId: string) => ['community', 'event', eventId, 'registration'] as const,
};

export async function invalidateCommunityQueries() {
  await queryClient.invalidateQueries({ queryKey: communityQueryKeys.all });
}
