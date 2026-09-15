import type { Appointment, AppointmentStatus, HealthcareProvider, MedicalRecord } from '@/features/home/types/home';
import { findProviderById, providerLabel } from '@/features/appointments/selectors';
import { humanizeStatus } from '@/features/home/selectors/homeViewModel';

export type DoctorVisitTone = 'confirmed' | 'requested' | 'completed' | 'cancelled' | 'available';

export type DoctorVisitCard = {
  id: string;
  whenLabel: string;
  title: string;
  summary: string;
  statusLabel: string;
  tone: DoctorVisitTone;
  doctorName: string | null;
  doctorSpecialty: string | null;
  doctorId: string | null;
};

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatVisitWhen(value: string | null | undefined): string {
  if (!value) {
    return 'Schedule TBD';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Schedule TBD';
  }
  const day = date.getDate();
  const month = SHORT_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  const mm = String(minutes).padStart(2, '0');
  return `${day} ${month} ${year}, ${h12}:${mm} ${ampm}`;
}

function toneFromStatus(status: AppointmentStatus): DoctorVisitTone {
  switch (status) {
    case 'CONFIRMED':
      return 'confirmed';
    case 'REQUESTED':
      return 'requested';
    case 'COMPLETED':
      return 'completed';
    case 'CANCELLED':
    case 'NO_SHOW':
      return 'cancelled';
    default:
      return 'requested';
  }
}

function statusLabel(status: AppointmentStatus): string {
  if (status === 'CONFIRMED') {
    return 'Confirmed';
  }
  if (status === 'COMPLETED') {
    return 'Completed';
  }
  if (status === 'REQUESTED') {
    return 'Requested';
  }
  return humanizeStatus(status);
}

export function appointmentSortTime(item: Appointment): number {
  if (!item.scheduledAt) {
    return 0;
  }
  const time = new Date(item.scheduledAt).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function isUpcomingAppointment(item: Appointment, now = Date.now()): boolean {
  if (item.status !== 'REQUESTED' && item.status !== 'CONFIRMED') {
    return false;
  }
  if (!item.scheduledAt) {
    return true;
  }
  const time = new Date(item.scheduledAt).getTime();
  if (Number.isNaN(time)) {
    return true;
  }
  // Keep same-day visits visible for a few hours after start.
  return time >= now - 3 * 60 * 60 * 1000;
}

export function toDoctorVisitCard(
  appointment: Appointment,
  providers: HealthcareProvider[],
): DoctorVisitCard {
  const provider = findProviderById(providers, appointment.doctorId);
  return {
    id: appointment.id,
    whenLabel: formatVisitWhen(appointment.scheduledAt),
    title: 'Home Visit',
    summary:
      appointment.status === 'COMPLETED'
        ? 'Doctor visit completed'
        : 'Doctor / physician home visit',
    statusLabel: statusLabel(appointment.status),
    tone: toneFromStatus(appointment.status),
    doctorName: provider?.name?.trim() || appointment.doctorName,
    doctorSpecialty: provider?.specialty?.trim() || null,
    doctorId: appointment.doctorId,
  };
}

export function findUpcomingDoctorVisit(
  appointments: Appointment[],
  providers: HealthcareProvider[],
): DoctorVisitCard | null {
  const upcoming = appointments
    .filter((item) => isUpcomingAppointment(item))
    .sort((a, b) => appointmentSortTime(a) - appointmentSortTime(b));
  const first = upcoming[0];
  return first ? toDoctorVisitCard(first, providers) : null;
}

export function toPastDoctorVisits(
  appointments: Appointment[],
  providers: HealthcareProvider[],
  limit = 10,
): DoctorVisitCard[] {
  return appointments
    .filter((item) => item.status === 'COMPLETED' || item.status === 'CANCELLED' || item.status === 'NO_SHOW')
    .sort((a, b) => appointmentSortTime(b) - appointmentSortTime(a))
    .slice(0, limit)
    .map((item) => toDoctorVisitCard(item, providers));
}

export type DoctorReportCard = {
  id: string;
  title: string;
  dateLabel: string | null;
  summary: string;
  statusLabel: string;
  tone: DoctorVisitTone;
};

/** Latest doctor note from medical records — real data only. */
export function toLatestDoctorReport(records: MedicalRecord[]): DoctorReportCard | null {
  const withNotes = records.filter((item) => item.notes?.trim());
  const first = withNotes[0];
  if (!first) {
    return null;
  }
  return {
    id: first.id,
    title: first.providerName?.trim() ? `Visit note · ${first.providerName}` : 'Visit report',
    dateLabel: null,
    summary: first.notes!.trim(),
    statusLabel: 'Report Available',
    tone: 'available',
  };
}

export function toDoctorReportCards(records: MedicalRecord[], limit = 10): DoctorReportCard[] {
  return records
    .filter((item) => item.notes?.trim())
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      title: item.providerName?.trim() ? `Visit note · ${item.providerName}` : 'Visit report',
      dateLabel: null,
      summary: item.notes!.trim(),
      statusLabel: 'Report Available',
      tone: 'available' as const,
    }));
}

export function doctorVisitToneMeta(tone: DoctorVisitTone): { color: string; soft: string } {
  switch (tone) {
    case 'confirmed':
    case 'available':
      return { color: '#3D8B40', soft: '#E8F5E9' };
    case 'requested':
      return { color: '#2F80ED', soft: '#E8F1FF' };
    case 'completed':
      return { color: '#6B6B6B', soft: '#F3F4F6' };
    case 'cancelled':
      return { color: '#E5484D', soft: '#FDECEC' };
  }
}

export function doctorAssignedLabel(card: DoctorVisitCard): string {
  if (card.doctorName && card.doctorSpecialty) {
    return `${card.doctorName}, ${card.doctorSpecialty}`;
  }
  if (card.doctorName) {
    return card.doctorName;
  }
  return 'Doctor to be assigned';
}

export { providerLabel, formatVisitWhen };
