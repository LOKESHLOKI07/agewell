import { queryClient } from '@/api/queryClient';
import { healthQueryKeys } from '@/features/health/queryKeys';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';

export const appointmentQueryKeys = {
  all: healthQueryKeys.appointments,
  upcoming: homeQueryKeys.appointmentsUpcoming,
  detail: (id: string) => ['appointments', 'detail', id] as const,
};

export async function invalidateAppointmentQueries() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['appointments'] }),
    queryClient.invalidateQueries({ queryKey: ['family', 'appointments'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'appointments'] }),
    queryClient.invalidateQueries({ queryKey: ['care', 'appointments'] }),
  ]);
}
