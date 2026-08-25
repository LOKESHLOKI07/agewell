import type { IconName } from '@/components/ui';
import type { ColorTone } from '@/constants/theme';
import type { MedicationSchedule } from '@/features/home/types/home';

export type HealthOverviewKey =
  | 'medications'
  | 'labs'
  | 'history'
  | 'documents'
  | 'doctors'
  | 'appointments'
  | 'emergency';

export interface HealthOverviewLink {
  key: HealthOverviewKey;
  title: string;
  subtitle: string;
  href: string;
  icon: IconName;
  tone: ColorTone;
  accessibilityHint: string;
}

export const HEALTH_OVERVIEW_LINKS: HealthOverviewLink[] = [
  {
    key: 'medications',
    title: 'Medications',
    subtitle: 'Names, dosage, and times',
    href: '/health/medications',
    icon: 'pill',
    tone: 'primary',
    accessibilityHint: 'Opens your medication list and schedules',
  },
  {
    key: 'labs',
    title: 'Lab Results',
    subtitle: 'Test names, values, and dates',
    href: '/health/labs',
    icon: 'test-tube',
    tone: 'accent',
    accessibilityHint: 'Opens your lab results',
  },
  {
    key: 'history',
    title: 'Medical History',
    subtitle: 'Notes from your doctors',
    href: '/health/history',
    icon: 'clipboard-text-outline',
    tone: 'info',
    accessibilityHint: 'Opens your medical history',
  },
  {
    key: 'documents',
    title: 'Health Documents',
    subtitle: 'Reports and files on record',
    href: '/health/documents',
    icon: 'file-document-outline',
    tone: 'primary',
    accessibilityHint: 'Opens your health documents',
  },
  {
    key: 'doctors',
    title: 'Doctors',
    subtitle: 'Doctors from visits and records',
    href: '/health/doctors',
    icon: 'doctor',
    tone: 'safe',
    accessibilityHint: 'Opens your doctors list',
  },
  {
    key: 'appointments',
    title: 'Appointments',
    subtitle: 'Doctor, status, and time',
    href: '/health/appointments',
    icon: 'calendar',
    tone: 'warning',
    accessibilityHint: 'Opens your appointments',
  },
  {
    key: 'emergency',
    title: 'Emergency Information',
    subtitle: 'Contact number on file',
    href: '/health/emergency-info',
    icon: 'card-account-phone-outline',
    tone: 'emergency',
    accessibilityHint: 'Opens emergency contact information',
  },
];

export function schedulesForMedication(
  schedules: MedicationSchedule[],
  medicationId: string,
): MedicationSchedule[] {
  return schedules.filter((item) => item.medicationId === medicationId);
}

export function findScheduleMedication(
  schedules: MedicationSchedule[],
  medicationId: string | undefined,
): MedicationSchedule | null {
  if (!medicationId) {
    return null;
  }
  return schedules.find((item) => item.medicationId === medicationId) ?? null;
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatRecordDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function isHttpUrl(value: string | null | undefined): value is string {
  return Boolean(value && /^https?:\/\//i.test(value));
}

export function healthMedicationHref(medicationId: string) {
  return { pathname: '/health/medications/[id]' as const, params: { id: medicationId } };
}

export function healthAppointmentHref(id: string) {
  return { pathname: '/health/appointments/[id]' as const, params: { id } };
}

export function healthAppointmentBookHref() {
  return '/health/appointments/new' as const;
}
