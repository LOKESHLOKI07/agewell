import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import type { ListPage } from '@/features/home/types/home';
import {
  createEmergency,
  fetchEmergencyCase,
  fetchEmergencyCases,
  fetchEmergencyEvents,
} from './api/emergencyApi';
import { notificationQueryKeys } from '@/features/notifications/queryKeys';
import { emergencyQueryKeys } from './queryKeys';
import type { EmergencyCase, EmergencyEvent, EmergencyType } from './types/emergency';

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

export function useEmergencyCases() {
  return useAuthedQuery<ListPage<EmergencyCase>>(emergencyQueryKeys.list, fetchEmergencyCases);
}

export function useEmergencyCase(id: string | undefined) {
  return useAuthedQuery<EmergencyCase>(
    emergencyQueryKeys.detail(id ?? ''),
    () => fetchEmergencyCase(id as string),
    Boolean(id),
  );
}

export function useEmergencyEvents(id: string | undefined) {
  return useAuthedQuery<ListPage<EmergencyEvent>>(
    emergencyQueryKeys.events(id ?? ''),
    () => fetchEmergencyEvents(id as string),
    Boolean(id),
  );
}

export function useCreateEmergency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (type: EmergencyType) => createEmergency(type),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: emergencyQueryKeys.list }),
        queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all }),
      ]);
    },
  });
}
