import { useMutation, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import type { ListPage } from '@/features/home/types/home';
import {
  cancelRegistration,
  createCommunityEvent,
  deleteCommunityEvent,
  fetchCommunityEvent,
  fetchCommunityEvents,
  fetchCommunityRegistrations,
  registerForEvent,
  updateCommunityEvent,
} from './api';
import { communityQueryKeys, invalidateCommunityQueries } from './queryKeys';
import type { CommunityEvent, CommunityEventUpdate, CommunityEventWrite, EventRegistration } from './types';

function useAuthedQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  enabled = true,
): UseQueryResult<T> {
  const isAuthenticated = useAuthStore((state) => state.status === 'AUTHENTICATED');
  return useQuery({
    queryKey,
    queryFn,
    enabled: isAuthenticated && enabled,
  });
}

export function useCommunityEvents() {
  return useAuthedQuery<ListPage<CommunityEvent>>(communityQueryKeys.events, fetchCommunityEvents);
}

export function useCommunityEvent(eventId: string | undefined) {
  return useAuthedQuery<CommunityEvent>(
    communityQueryKeys.event(eventId ?? ''),
    () => fetchCommunityEvent(eventId as string),
    Boolean(eventId),
  );
}

export function useCommunityRegistrations() {
  return useAuthedQuery<ListPage<EventRegistration>>(
    communityQueryKeys.registrations,
    fetchCommunityRegistrations,
  );
}

export function useRegisterForEvent() {
  return useMutation({
    mutationFn: ({ eventId, seniorId }: { eventId: string; seniorId?: string }) =>
      registerForEvent(eventId, seniorId),
    onSuccess: async () => {
      await invalidateCommunityQueries();
    },
  });
}

export function useCancelRegistration() {
  return useMutation({
    mutationFn: (registrationId: string) => cancelRegistration(registrationId),
    onSuccess: async () => {
      await invalidateCommunityQueries();
    },
  });
}

export function useCreateCommunityEvent() {
  return useMutation({
    mutationFn: (input: CommunityEventWrite) => createCommunityEvent(input),
    onSuccess: async () => {
      await invalidateCommunityQueries();
    },
  });
}

export function useUpdateCommunityEvent(eventId: string) {
  return useMutation({
    mutationFn: (input: CommunityEventUpdate) => updateCommunityEvent(eventId, input),
    onSuccess: async () => {
      await invalidateCommunityQueries();
    },
  });
}

export function useDeleteCommunityEvent() {
  return useMutation({
    mutationFn: (eventId: string) => deleteCommunityEvent(eventId),
    onSuccess: async () => {
      await invalidateCommunityQueries();
    },
  });
}
