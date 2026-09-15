import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import type { ListPage } from '@/features/home/types/home';
import {
  acknowledgeEmergency,
  createEmergency,
  fetchEmergencyCase,
  fetchEmergencyCases,
  fetchEmergencyEvents,
  updateEmergencyReport,
} from './api/emergencyApi';
import { notificationQueryKeys } from '@/features/notifications/queryKeys';
import { careQueryKeys } from '@/features/care/queryKeys';
import { emergencyQueryKeys } from './queryKeys';
import type {
  EmergencyCase,
  EmergencyEvent,
  EmergencyReportUpdate,
  EmergencyTriggerSource,
  EmergencyType,
} from './types/emergency';

const LIVE_MS = 4000;

function useAuthedQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  enabled = true,
  live = false,
): UseQueryResult<T> {
  const isAuthenticated = useAuthStore((state) => state.status === 'AUTHENTICATED');
  return useQuery({
    queryKey,
    queryFn,
    enabled: isAuthenticated && enabled,
    refetchInterval: live ? LIVE_MS : false,
  });
}

export function useEmergencyCases(live = true) {
  return useAuthedQuery<ListPage<EmergencyCase>>(emergencyQueryKeys.list, fetchEmergencyCases, true, live);
}

export function useEmergencyCase(id: string | undefined, live = true) {
  return useAuthedQuery<EmergencyCase>(
    emergencyQueryKeys.detail(id ?? ''),
    () => fetchEmergencyCase(id as string),
    Boolean(id),
    live,
  );
}

export function useEmergencyEvents(id: string | undefined, live = true) {
  return useAuthedQuery<ListPage<EmergencyEvent>>(
    emergencyQueryKeys.events(id ?? ''),
    () => fetchEmergencyEvents(id as string),
    Boolean(id),
    live,
  );
}

async function invalidateEmergency(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: emergencyQueryKeys.list }),
    queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: careQueryKeys.staffEmergencies }),
    id ? queryClient.invalidateQueries({ queryKey: emergencyQueryKeys.detail(id) }) : Promise.resolve(),
    id ? queryClient.invalidateQueries({ queryKey: emergencyQueryKeys.events(id) }) : Promise.resolve(),
  ]);
}

export function useCreateEmergency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      type,
      triggerSource,
    }: {
      type: EmergencyType;
      triggerSource?: EmergencyTriggerSource;
    }) => createEmergency(type, triggerSource),
    onSuccess: async (created) => {
      await invalidateEmergency(queryClient, created.id);
    },
  });
}

export function useAcknowledgeEmergency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => acknowledgeEmergency(id),
    onSuccess: async (updated) => {
      await invalidateEmergency(queryClient, updated.id);
    },
  });
}

export function useUpdateEmergencyReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EmergencyReportUpdate }) =>
      updateEmergencyReport(id, payload),
    onSuccess: async (updated) => {
      await invalidateEmergency(queryClient, updated.id);
    },
  });
}
