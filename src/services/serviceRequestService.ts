import { mockServices } from '@/mock/services';
import type { CreateServiceRequestInput, ServiceCatalogItem, ServiceRequest } from '@/types';
import { delay } from '@/utils/delay';

export async function getServiceCatalog(): Promise<ServiceCatalogItem[]> {
  await delay(200);
  return mockServices;
}

export async function getServiceById(id: string): Promise<ServiceCatalogItem | null> {
  await delay(150);
  return mockServices.find((service) => service.id === id) ?? null;
}

export async function createServiceRequest(
  input: CreateServiceRequestInput,
): Promise<ServiceRequest> {
  await delay(400);
  return {
    id: `req-${Date.now()}`,
    status: 'received',
    createdAt: new Date().toISOString(),
    ...input,
  };
}
