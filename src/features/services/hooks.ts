import { useMutation, useQueryClient } from '@tanstack/react-query';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';
import { useServices } from '@/features/home/hooks/queries';
import { createServiceRequest } from './api';
import { findServiceById } from './selectors';

export { useServiceRequests, useServices } from '@/features/home/hooks/queries';

export function useService(serviceId: string | undefined) {
  const query = useServices();
  const service = findServiceById(query.data, serviceId);
  return {
    ...query,
    service,
    notFound: query.isSuccess && !service,
  };
}

export function useCreateServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createServiceRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: homeQueryKeys.serviceRequests });
    },
  });
}
