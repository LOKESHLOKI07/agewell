import { mockAppointments } from '@/mock/appointments';
import type { Appointment, CreateAppointmentInput } from '@/types';
import { delay } from '@/utils/delay';

let appointments: Appointment[] = [...mockAppointments];

export async function getAppointmentsBySeniorId(seniorId: string): Promise<Appointment[]> {
  await delay(250);
  return appointments
    .filter((appointment) => appointment.seniorId === seniorId)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

export async function getUpcomingAppointment(seniorId: string): Promise<Appointment | null> {
  const items = await getAppointmentsBySeniorId(seniorId);
  return items.find((item) => item.status === 'confirmed' || item.status === 'pending') ?? null;
}

export async function createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
  await delay(350);
  const appointment: Appointment = {
    id: `appt-${Date.now()}`,
    status: 'pending',
    ...input,
  };
  appointments = [appointment, ...appointments];
  return appointment;
}
