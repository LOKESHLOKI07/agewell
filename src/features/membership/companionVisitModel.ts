import type { IconName } from '@/components/ui';
import type { ServiceRequest, Visit } from '@/features/home/types/home';
import { humanizeStatus } from '@/features/home/selectors/homeViewModel';
import {
  careActivityFollowUpLine,
  formatCareActivityWhen,
} from './careManagerMappers';
import type { AssignedCareManager, CareActivity } from './careManagerTypes';

export const COMPANION_SERVICE_SLUG = 'companion';
export const COMPANION_STAFF_KIND = 'COMPANION';

export type CompanionActivityTone = 'green' | 'blue' | 'pink';

export type CompanionActivityView = {
  id: string;
  when: string;
  title: string;
  body: string;
  icon: IconName;
  tone: CompanionActivityTone;
};

export type CompanionProfileView = {
  id: string;
  name: string;
  roleLabel: string;
  phone: string | null;
  photoUri: string | null;
  experience: string | null;
  serviceAreas: string | null;
  traits: string | null;
};

const SERVICE_AREA_FALLBACK = 'Kandivali & Borivali';

function toneForActivityType(type: CareActivity['activityType']): CompanionActivityTone {
  switch (type) {
    case 'HOME_VISIT':
    case 'VISIT':
      return 'green';
    case 'HEALTH':
    case 'MEDICINE':
    case 'TRANSPORT':
      return 'blue';
    default:
      return 'pink';
  }
}

function toneForVisitStatus(status: Visit['status']): CompanionActivityTone {
  if (status === 'COMPLETED') {
    return 'green';
  }
  if (status === 'IN_PROGRESS' || status === 'CHECKED_IN' || status === 'CHECKED_OUT') {
    return 'blue';
  }
  return 'pink';
}

function toneForRequestStatus(status: ServiceRequest['status']): CompanionActivityTone {
  if (status === 'COMPLETED') {
    return 'green';
  }
  if (status === 'IN_PROGRESS' || status === 'ASSIGNED' || status === 'SCHEDULED') {
    return 'blue';
  }
  return 'pink';
}

export function companionDisplayName(manager: AssignedCareManager): string {
  if (manager.name?.trim()) {
    return manager.name.trim();
  }
  const joined = [manager.firstName, manager.lastName].filter(Boolean).join(' ').trim();
  return joined || 'Companion';
}

/** Map assigned staff profile into the Companion Visit card fields. */
export function toCompanionProfileView(manager: AssignedCareManager): CompanionProfileView {
  return {
    id: manager.id,
    name: companionDisplayName(manager),
    roleLabel: 'Companion Caregiver',
    phone: manager.phone,
    photoUri: null,
    experience: manager.experience,
    serviceAreas: manager.languages ?? SERVICE_AREA_FALLBACK,
    traits: manager.availability ?? manager.skills,
  };
}

export function toCompanionActivityFromCare(activity: CareActivity): CompanionActivityView {
  const when =
    formatCareActivityWhen(activity.occurredAt) ||
    formatCareActivityWhen(activity.scheduledAt) ||
    formatCareActivityWhen(activity.createdAt) ||
    'Recently';
  const body =
    careActivityFollowUpLine(activity) ||
    activity.actionTaken ||
    activity.reason ||
    activity.notes ||
    activity.discussion ||
    humanizeStatus(activity.status);
  return {
    id: `care-${activity.id}`,
    when,
    title: activity.title,
    body,
    icon: activity.icon,
    tone: toneForActivityType(activity.activityType),
  };
}

export function toCompanionActivityFromVisit(visit: Visit): CompanionActivityView {
  const when =
    formatCareActivityWhen(visit.scheduledAt) ||
    formatCareActivityWhen(visit.completedAt ?? null) ||
    'Schedule TBD';
  const title =
    visit.status === 'COMPLETED'
      ? 'Home Visit Completed'
      : visit.status === 'IN_PROGRESS' || visit.status === 'CHECKED_IN'
        ? 'Companion Visit In Progress'
        : 'Companion Visit';
  return {
    id: `visit-${visit.id}`,
    when,
    title,
    body: visit.notes?.trim() || humanizeStatus(visit.status),
    icon: visit.status === 'COMPLETED' ? 'checkmark-circle-outline' : 'calendar-outline',
    tone: toneForVisitStatus(visit.status),
  };
}

export function filterCompanionRequests(requests: ServiceRequest[]): ServiceRequest[] {
  return requests.filter((item) => item.serviceSlug === COMPANION_SERVICE_SLUG);
}

export function toCompanionActivityFromRequest(request: ServiceRequest): CompanionActivityView {
  return {
    id: `req-${request.id}`,
    when: 'Requested',
    title: request.serviceName || 'Companion Visit',
    body: request.notes?.trim() || humanizeStatus(request.status),
    icon: request.status === 'COMPLETED' ? 'checkmark-circle-outline' : 'heart-outline',
    tone: toneForRequestStatus(request.status),
  };
}

/**
 * Prefer care activities for the assigned companion, then matching visits,
 * then companion service requests. Dedupes by visit id when both care + visit exist.
 * When no companion is assigned, only companion service requests are shown.
 */
export function buildCompanionActivities(input: {
  companionId: string | null;
  careActivities: CareActivity[];
  visits: Visit[];
  requests: ServiceRequest[];
  limit?: number;
}): CompanionActivityView[] {
  const limit = input.limit ?? 20;
  const requestRows = filterCompanionRequests(input.requests).map(toCompanionActivityFromRequest);

  if (!input.companionId) {
    return requestRows.slice(0, limit);
  }

  const careRows = input.careActivities
    .filter((item) => item.careManagerId === input.companionId)
    .map(toCompanionActivityFromCare);

  const visitIdsFromCare = new Set(
    input.careActivities
      .filter((item) => item.visitId)
      .map((item) => item.visitId as string),
  );

  const visitRows = input.visits
    .filter((item) => item.careManagerId === input.companionId)
    .filter((item) => !visitIdsFromCare.has(item.id))
    .map(toCompanionActivityFromVisit);

  return [...careRows, ...visitRows, ...requestRows].slice(0, limit);
}
