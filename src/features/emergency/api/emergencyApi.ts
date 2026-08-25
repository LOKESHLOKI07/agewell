import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';
import { toListPage } from '@/features/home/api/mappers';
import type { ListPage } from '@/features/home/types/home';
import { toEmergencyCase, toEmergencyCreateBody, toEmergencyEvent } from '../mappers';
import type { EmergencyCase, EmergencyEvent, EmergencyType } from '../types/emergency';

export async function fetchEmergencyCases(): Promise<ListPage<EmergencyCase>> {
  try {
    const response = await apiClient.get('/emergency/');
    return toListPage(response.data, toEmergencyCase, 'emergency cases');
  } catch (error) {
    throw toApiError(error);
  }
}

export async function fetchEmergencyCase(id: string): Promise<EmergencyCase> {
  try {
    const response = await apiClient.get(`/emergency/${id}`);
    return toEmergencyCase(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function fetchEmergencyEvents(id: string): Promise<ListPage<EmergencyEvent>> {
  try {
    const response = await apiClient.get(`/emergency/${id}/events`);
    return toListPage(response.data, toEmergencyEvent, 'emergency events');
  } catch (error) {
    throw toApiError(error);
  }
}

export async function createEmergency(type: EmergencyType): Promise<EmergencyCase> {
  try {
    const response = await apiClient.post('/emergency/', toEmergencyCreateBody(type));
    return toEmergencyCase(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}
