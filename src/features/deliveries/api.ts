import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';
import type { DeliveryStatus } from '@/features/care/types';
import { toMemberDelivery, toMemberDeliveryPage } from './mappers';
import type { MemberDelivery } from './types';

async function getMapped<T>(path: string, map: (data: unknown) => T, params?: Record<string, unknown>): Promise<T> {
  try {
    const response = await apiClient.get(path, { params });
    return map(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export function fetchMemberDeliveries(params?: { status?: DeliveryStatus }) {
  return getMapped('/deliveries/member', toMemberDeliveryPage, params?.status ? { status: params.status } : undefined);
}

export function fetchMemberDelivery(deliveryId: string): Promise<MemberDelivery> {
  return getMapped(`/deliveries/member/${deliveryId}`, toMemberDelivery);
}
