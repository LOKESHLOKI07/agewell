import type { ColorTone } from '@/constants/theme';
import type { Visit } from '@/features/home/types/home';
import { formatTime } from '@/utils/date';
import type { StaffHomeConfig } from './staffHomeConfig';
import { summarizeCareToday, visitSeniorLabel } from './selectors';
import type { AttendanceRecord, Delivery, DeliveryStatus } from './types';

export type StaffScheduleItem = {
  id: string;
  timeLabel: string;
  title: string;
  location: string | null;
  statusLabel: string;
  statusTone: ColorTone;
  kind?: 'visit' | 'delivery';
};

export type StaffSummaryStat = {
  value: number | string;
  label: string;
  tone: ColorTone;
};

function humanizeFallback(status: string): string {
  return status
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function staffVisitStatusPresentation(status: string): { label: string; tone: ColorTone } {
  switch (status) {
    case 'IN_PROGRESS':
    case 'CHECKED_IN':
      return { label: 'In Progress', tone: 'safe' };
    case 'COMPLETED':
    case 'CHECKED_OUT':
      return { label: 'Completed', tone: 'safe' };
    case 'SCHEDULED':
      return { label: 'Upcoming', tone: 'info' };
    case 'CANCELLED':
      return { label: 'Cancelled', tone: 'default' };
    case 'NO_SHOW':
      return { label: 'No Show', tone: 'emergency' };
    default:
      return { label: humanizeFallback(status), tone: 'primary' };
  }
}

export function staffDeliveryStatusPresentation(status: DeliveryStatus): { label: string; tone: ColorTone } {
  switch (status) {
    case 'EN_ROUTE':
      return { label: 'En Route', tone: 'info' };
    case 'COMPLETED':
      return { label: 'Completed', tone: 'safe' };
    case 'PENDING':
      return { label: 'Pending', tone: 'warning' };
    case 'FAILED':
      return { label: 'Failed', tone: 'emergency' };
    default:
      return { label: humanizeFallback(status), tone: 'primary' };
  }
}

export function visitToStaffScheduleItem(visit: Visit, itemPrefix: string): StaffScheduleItem {
  const status = staffVisitStatusPresentation(visit.status);
  return {
    id: visit.id,
    timeLabel: visit.scheduledAt ? formatTime(visit.scheduledAt) : 'Time TBD',
    title: `${itemPrefix} - ${visitSeniorLabel(visit.seniorId)}`,
    location: visit.notes?.trim() || null,
    statusLabel: status.label,
    statusTone: status.tone,
    kind: 'visit',
  };
}

export function deliveryToStaffScheduleItem(delivery: Delivery): StaffScheduleItem {
  const status = staffDeliveryStatusPresentation(delivery.status);
  const customer = delivery.customerName?.trim() || 'Customer';
  return {
    id: delivery.id,
    timeLabel: delivery.scheduledAt ? formatTime(delivery.scheduledAt) : 'Time TBD',
    title: `${delivery.title} - ${customer}`,
    location: delivery.location,
    statusLabel: status.label,
    statusTone: status.tone,
    kind: 'delivery',
  };
}

export function buildVisitStaffSummary(config: StaffHomeConfig, visits: Visit[]): StaffSummaryStat[] {
  const list = Array.isArray(visits) ? visits : [];
  const summary = summarizeCareToday(list);
  return [
    { value: summary.total, label: config.summary.primary, tone: 'info' },
    { value: summary.completed, label: config.summary.completed, tone: 'safe' },
    { value: summary.inProgress, label: config.summary.third, tone: config.summary.thirdTone },
    { value: summary.emergency, label: config.summary.fourth, tone: config.summary.fourthTone },
  ];
}

export function buildDeliveryStaffSummary(config: StaffHomeConfig, deliveries: Delivery[]): StaffSummaryStat[] {
  const list = Array.isArray(deliveries) ? deliveries : [];
  const completed = list.filter((item) => item.status === 'COMPLETED').length;
  const pending = list.filter((item) => item.status === 'PENDING' || item.status === 'EN_ROUTE').length;
  const failed = list.filter((item) => item.status === 'FAILED').length;
  return [
    { value: list.length, label: config.summary.primary, tone: 'info' },
    { value: completed, label: config.summary.completed, tone: 'safe' },
    { value: pending, label: config.summary.third, tone: config.summary.thirdTone },
    { value: failed, label: config.summary.fourth, tone: config.summary.fourthTone },
  ];
}

export function isAttendanceOnDuty(attendance: AttendanceRecord | null | undefined): boolean {
  if (!attendance) {
    return false;
  }
  return !attendance.checkOutAt && attendance.status.toUpperCase() !== 'CHECKED_OUT';
}

export function dutySinceLabelFromAttendance(attendance: AttendanceRecord | null | undefined): string | null {
  if (!attendance || !isAttendanceOnDuty(attendance)) {
    return null;
  }
  return formatTime(attendance.checkInAt);
}

/** Placeholder until the API exposes shift start. */
export function defaultDutySinceLabel(): string {
  return '08:30 AM';
}

export function asVisitList(items: Visit[] | null | undefined): Visit[] {
  return Array.isArray(items) ? items : [];
}

export function asDeliveryList(items: Delivery[] | null | undefined): Delivery[] {
  return Array.isArray(items) ? items : [];
}
