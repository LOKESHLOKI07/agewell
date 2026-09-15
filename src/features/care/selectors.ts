import type { Visit } from '@/features/home/types/home';
import type { VisitTask } from './types';

/** VisitResponse has senior_id only. Do not invent a senior display name. */
export function visitSeniorLabel(seniorId: string): string {
  return `Senior ID ${seniorId}`;
}

export function visitDetailHref(visitId: string) {
  return { pathname: '/care/visits/[id]' as const, params: { id: visitId } };
}

export function visitStartHref(visitId: string) {
  return { pathname: '/care/visits/[id]/start' as const, params: { id: visitId } };
}

export function visitActiveHref(visitId: string) {
  return { pathname: '/care/visits/[id]/active' as const, params: { id: visitId } };
}

export function visitCompleteHref(visitId: string) {
  return { pathname: '/care/visits/[id]/complete' as const, params: { id: visitId } };
}

export function deliveryDetailHref(deliveryId: string) {
  return { pathname: '/care/deliveries/[id]' as const, params: { id: deliveryId } };
}

export function emergencyRespondHref(emergencyId: string) {
  return { pathname: '/care/emergency/[id]' as const, params: { id: emergencyId } };
}

export const PENDING_VISIT_STATUSES = new Set(['SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS']);
export const COMPLETED_VISIT_STATUSES = new Set(['COMPLETED', 'CHECKED_OUT']);
export const PENDING_DELIVERY_STATUSES = new Set(['PENDING', 'EN_ROUTE']);
export const COMPLETED_DELIVERY_STATUSES = new Set(['COMPLETED']);


export function taskStatusLabel(isCompleted: boolean): string {
  return isCompleted ? 'Completed' : 'Not completed';
}

export function taskDisplayName(task: VisitTask): string {
  return task.taskName ?? 'Task';
}

export function visitTimeLabel(visit: Pick<Visit, 'scheduledAt'>, formatWhen: (value: string) => string): string | null {
  return visit.scheduledAt ? formatWhen(visit.scheduledAt) : null;
}

const COMPLETED_STATUSES = new Set(['COMPLETED', 'CHECKED_OUT']);
const IN_PROGRESS_STATUSES = new Set(['IN_PROGRESS', 'CHECKED_IN']);
const UPCOMING_STATUSES = new Set(['SCHEDULED']);
const EMERGENCY_STATUSES = new Set(['NO_SHOW']);

export function summarizeCareToday(visits: Visit[]) {
  const list = Array.isArray(visits) ? visits : [];
  const total = list.length;
  const completed = list.filter((visit) => COMPLETED_STATUSES.has(visit.status)).length;
  const inProgress = list.filter((visit) => IN_PROGRESS_STATUSES.has(visit.status)).length;
  const upcoming = list.filter((visit) => UPCOMING_STATUSES.has(visit.status)).length;
  const emergency = list.filter((visit) => EMERGENCY_STATUSES.has(visit.status)).length;
  const next =
    list.find((visit) => IN_PROGRESS_STATUSES.has(visit.status)) ??
    list.find((visit) => UPCOMING_STATUSES.has(visit.status)) ??
    null;
  return { total, completed, inProgress, upcoming, emergency, next };
}
