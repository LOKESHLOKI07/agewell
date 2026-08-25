import { formatTime } from '@/utils/date';
import { seniorDisplayName } from '../api/mappers';
import type {
  Appointment,
  CatalogService,
  CurrentMembership,
  HomeSectionState,
  HomeViewModel,
  ListPage,
  Medication,
  MembershipUsage,
  Notification,
  SeniorProfile,
  ServiceRequest,
  TodayCareItem,
  TodaySummaryTile,
  Visit,
} from '../types/home';

export function humanizeStatus(status: string): string {
  return status
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function parseSortAt(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

export function formatCareTime(value: string | null | undefined): string | null {
  if (!parseSortAt(value)) {
    return null;
  }
  return formatTime(value as string);
}

function joinSubtitle(parts: (string | null | undefined)[]): string {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join(' · ');
}

export function visitToCareItem(visit: Visit): TodayCareItem {
  const time = formatCareTime(visit.scheduledAt);
  const status = humanizeStatus(visit.status);
  const companion = visit.careManagerName?.trim() || null;
  return {
    id: `visit-${visit.id}`,
    kind: 'visit',
    title: visit.notes?.trim() || 'Visit',
    subtitle: joinSubtitle([time, companion, status]),
    status,
    icon: 'people',
    sortAt: parseSortAt(visit.scheduledAt),
    href: `/visits/${visit.id}`,
  };
}

export function appointmentToCareItem(appointment: Appointment): TodayCareItem {
  const time = formatCareTime(appointment.scheduledAt);
  const status = humanizeStatus(appointment.status);
  return {
    id: `appointment-${appointment.id}`,
    kind: 'appointment',
    title: appointment.doctorName ?? 'Doctor appointment',
    subtitle: joinSubtitle([time, status]),
    status,
    icon: 'medkit',
    sortAt: parseSortAt(appointment.scheduledAt),
    href: `/health/appointments/${appointment.id}`,
  };
}

export function medicationToCareItem(medication: Medication): TodayCareItem {
  const scheduleKey = medication.schedule?.trim() || 'unscheduled';
  return {
    id: `medication-${medication.medicationId}-${scheduleKey}`,
    kind: 'medication',
    title: medication.name,
    subtitle: joinSubtitle([medication.dosage, medication.schedule, medication.frequency]),
    status: null,
    icon: 'water',
    sortAt: null,
    href: '/health/medications',
  };
}

function uniquifyCareItemIds(items: TodayCareItem[]): TodayCareItem[] {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const count = seen.get(item.id) ?? 0;
    seen.set(item.id, count + 1);
    if (count === 0) {
      return item;
    }
    return { ...item, id: `${item.id}-${count}` };
  });
}

export function serviceRequestToCareItem(request: ServiceRequest): TodayCareItem {
  const status = humanizeStatus(request.status);
  return {
    id: `service-request-${request.id}`,
    kind: 'service_request',
    title: request.serviceName,
    subtitle: status,
    status,
    icon: serviceRequestIcon(request.serviceName),
    sortAt: null,
    href: '/(tabs)/services',
  };
}

function serviceRequestIcon(serviceName: string): TodayCareItem['icon'] {
  const name = serviceName.toLowerCase();
  if (name.includes('meal') || name.includes('food') || name.includes('grocery')) {
    return 'restaurant';
  }
  if (name.includes('transport') || name.includes('cab') || name.includes('ride')) {
    return 'car';
  }
  if (name.includes('companion') || name.includes('care') || name.includes('walk')) {
    return 'people';
  }
  return 'grid';
}

/** Period buckets for schedule UI. Uses local clock hours from scheduledAt only. */
export function schedulePeriodForTime(sortAt: number | null): import('../types/home').SchedulePeriod {
  if (sortAt === null) {
    return 'unscheduled';
  }
  const hour = new Date(sortAt).getHours();
  if (hour < 12) {
    return 'morning';
  }
  if (hour < 17) {
    return 'afternoon';
  }
  return 'evening';
}

export function groupCareItemsByPeriod(items: TodayCareItem[]): {
  period: import('../types/home').SchedulePeriod;
  label: string;
  items: TodayCareItem[];
}[] {
  const labels: Record<import('../types/home').SchedulePeriod, string> = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    unscheduled: 'Also today',
  };
  const order: import('../types/home').SchedulePeriod[] = ['morning', 'afternoon', 'evening', 'unscheduled'];
  const buckets = new Map<import('../types/home').SchedulePeriod, TodayCareItem[]>();
  for (const item of items) {
    const period = schedulePeriodForTime(item.sortAt);
    const list = buckets.get(period) ?? [];
    list.push(item);
    buckets.set(period, list);
  }
  return order
    .filter((period) => (buckets.get(period)?.length ?? 0) > 0)
    .map((period) => ({
      period,
      label: labels[period],
      items: buckets.get(period) ?? [],
    }));
}

/**
 * Prefer catalog services that match product quick-actions.
 * Only returns services that exist in the API catalogue — never invents entries.
 */
export function pickQuickServices(services: CatalogService[]): CatalogService[] {
  const preferredPatterns: { match: RegExp; rank: number }[] = [
    { match: /companion|care\s*associate|care\s*visit/i, rank: 1 },
    { match: /food|meal|lunch|dinner/i, rank: 2 },
    { match: /grocery|market|shopping/i, rank: 3 },
    { match: /transport|cab|ride|mobility/i, rank: 4 },
    { match: /doctor|physician|clinic|appointment/i, rank: 5 },
    { match: /emergenc|sos|safety|security/i, rank: 6 },
    { match: /support|customer|help\s*desk|concierge/i, rank: 7 },
  ];

  const scored = services
    .map((service) => {
      const hit = preferredPatterns.find(
        (pattern) => pattern.match.test(service.name) || pattern.match.test(service.description),
      );
      const categoryRank =
        service.category === 'CARE'
          ? 10
          : service.category === 'FOOD_HOME'
            ? 20
            : service.category === 'MOBILITY'
              ? 30
              : service.category === 'HEALTH'
                ? 40
                : 50;
      return { service, rank: hit?.rank ?? categoryRank };
    })
    .sort((a, b) => a.rank - b.rank || a.service.name.localeCompare(b.service.name));

  const seen = new Set<string>();
  const picked: CatalogService[] = [];
  for (const row of scored) {
    if (seen.has(row.service.id)) {
      continue;
    }
    seen.add(row.service.id);
    picked.push(row.service);
    if (picked.length >= 8) {
      break;
    }
  }
  return picked;
}

export function buildTodayCareItems(input: {
  visits: Visit[];
  appointments: Appointment[];
  medications: Medication[];
  serviceRequests: ServiceRequest[];
}): TodayCareItem[] {
  const timed = [
    ...input.visits.map(visitToCareItem),
    ...input.appointments.map(appointmentToCareItem),
  ].sort((a, b) => {
    if (a.sortAt === null && b.sortAt === null) {
      return a.id.localeCompare(b.id);
    }
    if (a.sortAt === null) {
      return 1;
    }
    if (b.sortAt === null) {
      return -1;
    }
    return a.sortAt - b.sortAt;
  });

  const untimed = [
    ...input.medications.map(medicationToCareItem),
    ...input.serviceRequests.map(serviceRequestToCareItem),
  ];

  return uniquifyCareItemIds([...timed, ...untimed]);
}

export function summarizeTodayOverview(items: TodayCareItem[]): TodaySummaryTile[] {
  const visits = items.filter((item) => item.kind === 'visit');
  const appointments = items.filter((item) => item.kind === 'appointment');
  const medications = items.filter((item) => item.kind === 'medication');
  const services = items.filter((item) => item.kind === 'service_request');

  return [
    {
      key: 'visit',
      title: 'Care Visit',
      value: summaryValue(visits, 'None today', (count) => `${count} visit${count === 1 ? '' : 's'}`),
      href: '/visits',
      icon: 'people',
    },
    {
      key: 'appointment',
      title: 'Doctor Appt',
      value: summaryValue(appointments, 'None today', (count) => `${count} appt${count === 1 ? '' : 's'}`),
      href: '/health/appointments',
      icon: 'medkit',
    },
    {
      key: 'medication',
      title: 'Medications',
      value: medications.length === 0 ? 'None on file' : `${medications.length} on file`,
      href: '/health/medications',
      icon: 'water',
    },
    {
      key: 'service_request',
      title: 'Services',
      value: services.length === 0 ? 'None today' : `${services.length} request${services.length === 1 ? '' : 's'}`,
      href: '/(tabs)/services',
      icon: 'grid',
    },
  ];
}

function summaryValue(
  items: TodayCareItem[],
  empty: string,
  countLabel: (count: number) => string,
): string {
  if (items.length === 0) {
    return empty;
  }
  const timed = items.find((item) => item.subtitle.includes('·') || /^\d/.test(item.subtitle));
  if (timed) {
    return timed.subtitle.split(' · ')[0] ?? countLabel(items.length);
  }
  return countLabel(items.length);
}

export function getSectionState(input: {
  isPending: boolean;
  isError: boolean;
  isEmpty: boolean;
}): HomeSectionState {
  if (input.isPending) {
    return 'loading';
  }
  if (input.isError) {
    return 'error';
  }
  if (input.isEmpty) {
    return 'empty';
  }
  return 'ready';
}

export function buildHomeViewModel(input: {
  senior?: SeniorProfile;
  visits?: ListPage<Visit>;
  appointments?: ListPage<Appointment>;
  medications?: ListPage<Medication>;
  serviceRequests?: ListPage<ServiceRequest>;
  services?: CatalogService[];
  membership?: CurrentMembership;
  usage?: MembershipUsage[];
  notifications?: ListPage<Notification>;
}): HomeViewModel {
  return {
    greetingName: input.senior ? seniorDisplayName(input.senior) : null,
    todayItems: buildTodayCareItems({
      visits: input.visits?.items ?? [],
      appointments: input.appointments?.items ?? [],
      medications: input.medications?.items ?? [],
      serviceRequests: input.serviceRequests?.items ?? [],
    }),
    quickServices: pickQuickServices(input.services ?? []),
    membership:
      input.membership && input.usage
        ? {
            planName: input.membership.planName,
            status: input.membership.status,
            startDate: input.membership.startDate,
            endDate: input.membership.endDate,
            usage: input.usage,
          }
        : input.membership
          ? {
              planName: input.membership.planName,
              status: input.membership.status,
              startDate: input.membership.startDate,
              endDate: input.membership.endDate,
              usage: [],
            }
          : null,
    unreadNotificationCount: input.notifications?.total ?? 0,
  };
}

export async function refetchHomeQueries(refetchers: (() => Promise<unknown>)[]): Promise<void> {
  await Promise.allSettled(refetchers.map((refetch) => refetch()));
}
