import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';
import {
  toCatalogService,
  toCreatedServiceRequest,
  toServiceRequestCreateBody,
} from '@/features/home/api/mappers';
import type { CatalogService, CreatedServiceRequest } from '@/features/home/types/home';
import { createServiceRequest } from '@/features/services/api';
import { fetchSeniorMe } from '@/features/home/api/homeApi';

export async function fetchServiceBySlug(slug: string): Promise<CatalogService> {
  try {
    const response = await apiClient.get(`/services/by-slug/${encodeURIComponent(slug)}`);
    return toCatalogService(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * Resolves the logged-in senior, looks up the membership service by slug,
 * and creates a service request for admin/ops to handle.
 */
export async function submitMembershipRequest(input: {
  slug: string;
  notes?: string;
}): Promise<CreatedServiceRequest> {
  const [senior, service] = await Promise.all([fetchSeniorMe(), fetchServiceBySlug(input.slug)]);
  return createServiceRequest({
    seniorId: senior.id,
    serviceId: service.id,
    notes: input.notes,
  });
}

export async function createServiceRequestWithNotes(input: {
  seniorId: string;
  serviceId: string;
  notes?: string;
}): Promise<CreatedServiceRequest> {
  try {
    const response = await apiClient.post(
      '/services/requests',
      toServiceRequestCreateBody(input.seniorId, input.serviceId, input.notes),
    );
    return toCreatedServiceRequest(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}
