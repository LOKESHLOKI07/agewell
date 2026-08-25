import { useMutation, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import type { Appointment, AppointmentStatus } from '@/features/home/types/home';
import { createAppointment, fetchAppointment, updateAppointment } from './api';
import { appointmentQueryKeys, invalidateAppointmentQueries } from './queryKeys';

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

export function useAppointment(id: string | undefined) {
  return useAuthedQuery<Appointment>(
    appointmentQueryKeys.detail(id ?? ''),
    () => fetchAppointment(id as string),
    Boolean(id),
  );
}

export function useCreateAppointment() {
  return useMutation({
    mutationFn: createAppointment,
    onSuccess: async () => {
      await invalidateAppointmentQueries();
    },
  });
}

export function useUpdateAppointment(id: string) {
  return useMutation({
    mutationFn: (input: { status?: AppointmentStatus; scheduledAt?: string; doctorId?: string }) =>
      updateAppointment(id, input),
    onSuccess: async () => {
      await invalidateAppointmentQueries();
    },
  });
}
