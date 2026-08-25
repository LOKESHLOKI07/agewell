import type { Href } from 'expo-router';
import type { ColorTone } from '@/constants/theme';
import type { IconName } from '@/components/ui';
import { ApiError, getApiErrorMessage } from '@/api/errors';
import { queryClient } from '@/api/queryClient';
import { humanizeStatus } from '@/features/home/selectors/homeViewModel';
import type { Appointment, ServiceRequest, Visit } from '@/features/home/types/home';
import { emergencyDetailHref } from '@/features/emergency/selectors';
import { formatRelativeDay, formatTime } from '@/utils/date';
import { familyQueryKeys } from './queryKeys';

export const FAMILY_FORBIDDEN_MESSAGE = "You don't have access to this senior's information.";

export function getFamilyLoadErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 403) {
    return FAMILY_FORBIDDEN_MESSAGE;
  }
  if (error instanceof ApiError) {
    return error.message;
  }
  return getApiErrorMessage(error);
}

export function familyVisitDetailHref(id: string) {
  return { pathname: '/family/visits/[id]' as const, params: { id } };
}

export function familyAppointmentDetailHref(id: string) {
  return { pathname: '/family/health/appointments/[id]' as const, params: { id } };
}

export function familyAppointmentBookHref() {
  return '/family/health/appointments/new' as const;
}

export function familyHealthHref(path: FamilyHealthPath): Href {
  return path as Href;
}

export type FamilyHealthPath =
  | '/family/health/medications'
  | '/family/health/history'
  | '/family/health/labs'
  | '/family/health/documents'
  | '/family/health/doctors'
  | '/family/health/appointments';

export interface FamilyHealthLink {
  key: string;
  title: string;
  subtitle: string;
  href: FamilyHealthPath;
  icon: IconName;
  accessibilityHint: string;
}

export const FAMILY_HEALTH_LINKS: FamilyHealthLink[] = [
  {
    key: 'medications',
    title: 'Medications',
    subtitle: 'Names, dosage, and times',
    href: '/family/health/medications',
    icon: 'pill',
    accessibilityHint: 'Opens medication schedules for the selected senior',
  },
  {
    key: 'history',
    title: 'Medical History',
    subtitle: 'Notes from doctors',
    href: '/family/health/history',
    icon: 'clipboard-text-outline',
    accessibilityHint: 'Opens medical history for the selected senior',
  },
  {
    key: 'labs',
    title: 'Lab Results',
    subtitle: 'Test names, values, and dates',
    href: '/family/health/labs',
    icon: 'test-tube',
    accessibilityHint: 'Opens lab results for the selected senior',
  },
  {
    key: 'documents',
    title: 'Documents',
    subtitle: 'Reports and files on record',
    href: '/family/health/documents',
    icon: 'file-document-outline',
    accessibilityHint: 'Opens health documents for the selected senior',
  },
  {
    key: 'doctors',
    title: 'Doctors',
    subtitle: 'Doctors from visits and records',
    href: '/family/health/doctors',
    icon: 'doctor',
    accessibilityHint: 'Opens doctors for the selected senior',
  },
  {
    key: 'appointments',
    title: 'Appointments',
    subtitle: 'Doctor, status, and time',
    href: '/family/health/appointments',
    icon: 'calendar',
    accessibilityHint: 'Opens appointments for the selected senior',
  },
];

export async function invalidateFamilySeniorQueries() {
  await queryClient.invalidateQueries({ queryKey: familyQueryKeys.all });
}

export function isMembershipMissing(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export function familyCarePlanLabel(planName: string | null | undefined): string {
  const name = planName?.trim();
  return `Care Plan: ${name && name.length > 0 ? name : 'Care'}`;
}

export function familyLastCheckIn(visits: Visit[]): string | null {
  const times = visits
    .map((visit) => visit.scheduledAt)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime());
  return times[0] ?? null;
}

export function familyCheckInLabel(value: string | null): string {
  if (!value) {
    return 'Last check-in: Not on file';
  }
  return `Last check-in: ${formatRelativeDay(value)}, ${formatTime(value)}`;
}

export function familyCareStatusCopy(input: { firstName: string; hasEmergency: boolean; lastCheckIn: string | null }) {
  const name = input.firstName.trim() || 'They';
  if (input.hasEmergency) {
    return {
      title: `${name} needs attention`,
      subtitle: 'An AgeWell emergency request is open',
      tone: 'warning' as const,
      checkIn: familyCheckInLabel(input.lastCheckIn),
    };
  }
  return {
    title: `${name} is doing well`,
    subtitle: 'No active concerns',
    tone: 'safe' as const,
    checkIn: familyCheckInLabel(input.lastCheckIn),
  };
}

export function familyDashboardStats(input: {
  visitCount: number;
  medicationCount: number;
  appointmentCount: number;
  hasEmergency: boolean;
  emergencyId?: string | null;
}) {
  return [
    {
      key: 'care',
      title: "Today's Care",
      value: `${input.visitCount} visit${input.visitCount === 1 ? '' : 's'}`,
      detail: input.visitCount === 0 ? 'None scheduled' : `${input.visitCount} scheduled`,
      tone: 'primary' as const,
      icon: 'calendar-outline' as const,
      href: '/(family)/visits' as Href,
    },
    {
      key: 'meds',
      title: 'Medications',
      value: `${input.medicationCount} active`,
      detail: input.medicationCount === 0 ? 'None due' : `${input.medicationCount} due today`,
      tone: 'accent' as const,
      icon: 'pill' as const,
      href: '/family/health/medications' as Href,
    },
    {
      key: 'health',
      title: 'Health',
      value: `${input.appointmentCount} upcoming`,
      detail: 'appointments',
      tone: 'safe' as const,
      icon: 'heart-outline' as const,
      href: '/(family)/health' as Href,
    },
    {
      key: 'safety',
      title: 'Safety',
      value: input.hasEmergency ? '1 alert' : 'No alerts',
      detail: input.hasEmergency ? 'needs attention' : 'all clear',
      tone: input.hasEmergency ? ('warning' as const) : ('safe' as const),
      icon: 'shield-checkmark-outline' as const,
      href: (input.emergencyId
        ? (emergencyDetailHref(input.emergencyId) as unknown as Href)
        : ('/(family)/health' as Href)),
    },
  ];
}

export interface FamilyActivityItem {
  id: string;
  title: string;
  subtitle: string;
  at: string | null;
  icon: IconName;
  tone: ColorTone;
}

export function familyRecentActivity(input: {
  visits: Visit[];
  appointments: Appointment[];
  services: ServiceRequest[];
}): FamilyActivityItem[] {
  const items: FamilyActivityItem[] = [
    ...input.visits.map((visit) => ({
      id: `visit-${visit.id}`,
      title: 'Care visit scheduled',
      subtitle: visit.careManagerName ?? 'Care associate',
      at: visit.scheduledAt,
      icon: 'checkmark-circle-outline' as const,
      tone: 'safe' as const,
    })),
    ...input.appointments.map((appointment) => ({
      id: `appt-${appointment.id}`,
      title: 'Doctor appointment requested',
      subtitle: appointment.doctorName ?? 'Doctor',
      at: appointment.scheduledAt,
      icon: 'doctor' as const,
      tone: 'primary' as const,
    })),
    ...input.services.map((service) => ({
      id: `svc-${service.id}`,
      title: service.serviceName || 'Service request',
      subtitle: humanizeStatus(service.status),
      at: null,
      icon: 'cart-outline' as const,
      tone: 'warning' as const,
    })),
  ];

  return items
    .sort((left, right) => {
      const leftTime = left.at ? new Date(left.at).getTime() : 0;
      const rightTime = right.at ? new Date(right.at).getTime() : 0;
      return rightTime - leftTime;
    })
    .slice(0, 5);
}

export function familyUpcomingVisit(today: Visit[], upcoming: Visit[]): Visit | null {
  return today[0] ?? upcoming[0] ?? null;
}

export function isLiveVisit(status: string): boolean {
  const value = status.toUpperCase();
  return value === 'IN_PROGRESS' || value === 'CHECKED_IN';
}
