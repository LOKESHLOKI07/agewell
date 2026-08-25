import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';
import { toCreatedServiceRequest, toServiceRequestCreateBody } from '@/features/home/api/mappers';
import type { CreatedServiceRequest } from '@/features/home/types/home';

export { fetchServiceRequests, fetchServices } from '@/features/home/api/homeApi';

export async function createServiceRequest(input: {
  seniorId: string;
  serviceId: string;
}): Promise<CreatedServiceRequest> {
  try {
    const response = await apiClient.post(
      '/services/requests',
      toServiceRequestCreateBody(input.seniorId, input.serviceId),
    );
    return toCreatedServiceRequest(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}
