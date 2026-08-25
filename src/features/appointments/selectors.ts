import type { AppointmentStatus, HealthcareProvider } from '@/features/home/types/home';
import { combineDateAndTime, splitDateAndTime } from '@/utils/date';

export const APPOINTMENT_FILTER_STATUSES: Record<'upcoming' | 'completed' | 'cancelled', AppointmentStatus[]> = {
  upcoming: ['REQUESTED', 'CONFIRMED'],
  completed: ['COMPLETED'],
  cancelled: ['CANCELLED', 'NO_SHOW'],
};

export const MANAGEABLE_APPOINTMENT_STATUSES: AppointmentStatus[] = ['REQUESTED', 'CONFIRMED'];

export const APPOINTMENT_STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No show' },
];

export function canManageAppointment(status: AppointmentStatus): boolean {
  return MANAGEABLE_APPOINTMENT_STATUSES.includes(status);
}

export function findProviderById(
  providers: HealthcareProvider[] | undefined,
  providerId: string | null | undefined,
): HealthcareProvider | null {
  if (!providers || !providerId) {
    return null;
  }
  return providers.find((provider) => provider.id === providerId) ?? null;
}

export function providerLabel(provider: HealthcareProvider): string {
  const name = provider.name?.trim();
  const specialty = provider.specialty?.trim();
  if (name && specialty) {
    return `${name} · ${specialty}`;
  }
  return name || specialty || 'Doctor';
}

export function toScheduledAtIso(date: string, time: string): string {
  return combineDateAndTime(date, time);
}

export function scheduledAtToDateTime(value: string | null | undefined): { date: string; time: string } {
  return splitDateAndTime(value);
}

export function healthAppointmentHref(id: string) {
  return { pathname: '/health/appointments/[id]' as const, params: { id } };
}

export function healthAppointmentBookHref() {
  return '/health/appointments/new' as const;
}

export function familyAppointmentHref(id: string) {
  return { pathname: '/family/health/appointments/[id]' as const, params: { id } };
}

export function familyAppointmentBookHref() {
  return '/family/health/appointments/new' as const;
}

export function adminAppointmentHref(id: string) {
  return `/(admin)/appointments/${id}` as const;
}

export function adminAppointmentBookHref() {
  return '/(admin)/appointments/new' as const;
}
