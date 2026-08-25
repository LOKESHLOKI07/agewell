import type { Visit } from '@/features/home/types/home';
import type { VisitTask } from './types';

/** VisitResponse has senior_id only. Do not invent a senior display name. */
export function visitSeniorLabel(seniorId: string): string {
  return `Senior ID ${seniorId}`;
}

export function visitDetailHref(visitId: string) {
  return { pathname: '/care/visits/[id]' as const, params: { id: visitId } };
}

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

export function summarizeCareToday(visits: Visit[]) {
  const completed = visits.filter((visit) => COMPLETED_STATUSES.has(visit.status)).length;
  const inProgress = visits.filter((visit) => IN_PROGRESS_STATUSES.has(visit.status)).length;
  const upcoming = visits.filter((visit) => UPCOMING_STATUSES.has(visit.status)).length;
  const next =
    visits.find((visit) => IN_PROGRESS_STATUSES.has(visit.status)) ??
    visits.find((visit) => UPCOMING_STATUSES.has(visit.status)) ??
    null;
  return { completed, inProgress, upcoming, next };
}
