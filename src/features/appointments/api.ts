import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';
import { toAppointment, toAppointmentCreateBody, toAppointmentUpdateBody } from '@/features/home/api/mappers';
import type { Appointment, AppointmentStatus } from '@/features/home/types/home';

export async function fetchAppointment(id: string): Promise<Appointment> {
  try {
    const response = await apiClient.get(`/appointments/${id}`);
    return toAppointment(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function createAppointment(input: {
  seniorId: string;
  doctorId: string;
  scheduledAt: string;
  status?: AppointmentStatus;
}): Promise<Appointment> {
  try {
    const response = await apiClient.post('/appointments/', toAppointmentCreateBody(input));
    return toAppointment(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function updateAppointment(
  id: string,
  input: {
    status?: AppointmentStatus;
    scheduledAt?: string;
    doctorId?: string;
  },
): Promise<Appointment> {
  try {
    const response = await apiClient.patch(`/appointments/${id}`, toAppointmentUpdateBody(input));
    return toAppointment(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}
