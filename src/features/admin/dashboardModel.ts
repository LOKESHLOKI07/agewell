import type { IconName } from '@/components/ui';
import { emergencyTypeLabel } from '@/features/emergency/selectors';
import type { EmergencyCase } from '@/features/emergency/types/emergency';
import type { ServiceRequest, Visit, VisitStatus } from '@/features/home/types/home';
import { formatRelativeTimestamp, formatTime } from '@/utils/date';
import { ADMIN_NAV, adminSeniorDisplay, humanizeStatus } from './selectors';
import type {
  AdminActivityRow,
  AdminAttentionItem,
  AdminAuditLog,
  AdminChartSlice,
  AdminDashboardMetric,
  AdminMetricBreakdown,
  AdminSenior,
  AdminService,
  AdminUpcomingVisitRow,
} from './types';

const CHART = {
  safe: '#22A06B',
  warning: '#F59E0B',
  emergency: '#E5484D',
  info: '#2F80ED',
  muted: '#8A8A8A',
  sidebarActive: '#4A35B8',
  primary: '#3D8B40',
} as const;

type QueryTotal = { isPending: boolean; isError: boolean; data?: { total: number } };

const VISIT_COMPLETED: ReadonlySet<VisitStatus> = new Set(['COMPLETED', 'CHECKED_OUT']);
const VISIT_UPCOMING: ReadonlySet<VisitStatus> = new Set(['SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS']);

const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  CARE: 'Home Care',
  FOOD_HOME: 'Food & Home',
  HEALTH: 'Medical Assistance',
  MOBILITY: 'Transportation',
  COMMUNITY: 'Community',
  ADD_ON: 'Add-ons',
};

export function greetingForHour(hour: number): string {
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

export function formatDashboardDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function visitStatusCounts(visits: Visit[]): { completed: number; upcoming: number; missed: number } {
  return visits.reduce(
    (acc, visit) => {
      if (VISIT_COMPLETED.has(visit.status)) {
        acc.completed += 1;
      } else if (VISIT_UPCOMING.has(visit.status)) {
        acc.upcoming += 1;
      } else if (visit.status === 'NO_SHOW') {
        acc.missed += 1;
      }
      return acc;
    },
    { completed: 0, upcoming: 0, missed: 0 },
  );
}

export function serviceRequestCategoryBars(
  requests: ServiceRequest[],
  services: AdminService[],
): AdminChartSlice[] {
  const byId = new Map(services.map((service) => [service.id, service]));
  const counts = new Map<string, number>();
  for (const request of requests) {
    const category = byId.get(request.serviceId)?.category;
    const label = (category && SERVICE_CATEGORY_LABELS[category]) || request.serviceName || 'Other';
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const palette = [CHART.info, CHART.primary, CHART.warning, CHART.sidebarActive, CHART.emergency, CHART.safe];
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value], index) => ({
      label,
      value,
      color: palette[index % palette.length],
    }));
}

function queryMetric(
  key: string,
  label: string,
  href: string,
  query: QueryTotal,
  extras: {
    tone?: AdminDashboardMetric['tone'];
    icon?: IconName;
    breakdown?: AdminMetricBreakdown[];
  } = {},
): AdminDashboardMetric {
  return {
    key,
    label,
    href,
    tone: extras.tone ?? 'default',
    icon: extras.icon,
    breakdown: extras.breakdown,
    state: query.isPending ? 'loading' : query.isError ? 'error' : 'ready',
    value: query.isPending || query.isError ? null : (query.data?.total ?? 0),
  };
}

export function buildDashboardCards(input: {
  seniors: QueryTotal;
  membershipSeniors: QueryTotal;
  outsideAreaSeniors: QueryTotal;
  inAreaNoMembershipSeniors: QueryTotal;
  todayVisits: QueryTotal & { items?: Visit[] };
  openEmergencies: QueryTotal & { items?: EmergencyCase[] };
  pendingRequests: QueryTotal;
  assignedRequests: QueryTotal;
  users: QueryTotal;
  careManagerUsers: QueryTotal;
  adminUsers: QueryTotal;
}): AdminDashboardMetric[] {
  const visitCounts = visitStatusCounts(input.todayVisits.items ?? []);
  const openItems = input.openEmergencies.items ?? [];
  const medical = openItems.filter((item) => item.type === 'MEDICAL' || item.type === 'HOSPITAL').length;
  const awaiting = Math.max(0, openItems.length - medical);
  const othersUsers = Math.max(
    0,
    (input.users.data?.total ?? 0) - (input.careManagerUsers.data?.total ?? 0) - (input.adminUsers.data?.total ?? 0),
  );

  return [
    queryMetric('seniors', 'Total Seniors', '/(admin)/seniors', input.seniors, {
      tone: 'safe',
      icon: 'accessibility-outline',
      breakdown: [
        { label: 'membership', value: input.membershipSeniors.data?.total ?? 0, color: CHART.safe },
        { label: 'need attention', value: input.inAreaNoMembershipSeniors.data?.total ?? 0, color: CHART.warning },
        { label: 'outside area', value: input.outsideAreaSeniors.data?.total ?? 0, color: CHART.emergency },
      ],
    }),
    queryMetric('visits', "Today's Visits", '/(admin)/visits', input.todayVisits, {
      tone: 'info',
      icon: 'calendar-outline',
      breakdown: [
        { label: 'completed', value: visitCounts.completed, color: CHART.safe },
        { label: 'upcoming', value: visitCounts.upcoming, color: CHART.info },
        { label: 'missed', value: visitCounts.missed, color: CHART.muted },
      ],
    }),
    queryMetric('emergencies', 'Open Emergencies', '/(admin)/emergencies', input.openEmergencies, {
      tone: 'emergency',
      icon: 'warning-outline',
      breakdown: [
        { label: 'critical', value: medical, color: CHART.emergency },
        { label: 'awaiting response', value: awaiting, color: CHART.warning },
      ],
    }),
    queryMetric('requests', 'Pending Requests', '/(admin)/requests', input.pendingRequests, {
      tone: 'warning',
      icon: 'clipboard-outline',
      breakdown: [
        { label: 'pending', value: input.pendingRequests.data?.total ?? 0, color: CHART.warning },
        { label: 'assigned', value: input.assignedRequests.data?.total ?? 0, color: CHART.info },
      ],
    }),
    queryMetric('users', 'Total Users', '/(admin)/users', input.users, {
      tone: 'accent',
      icon: 'people-outline',
      breakdown: [
        { label: 'care managers', value: input.careManagerUsers.data?.total ?? 0, color: CHART.sidebarActive },
        { label: 'admins', value: input.adminUsers.data?.total ?? 0, color: CHART.primary },
        { label: 'others', value: othersUsers, color: CHART.muted },
      ],
    }),
  ];
}

export function seniorStatusSlices(input: {
  membership: number;
  inAreaNoMembership: number;
  outsideArea: number;
}): AdminChartSlice[] {
  return [
    { label: 'Membership', value: input.membership, color: CHART.safe },
    { label: 'Needs attention', value: input.inAreaNoMembership, color: CHART.warning },
    { label: 'Outside area', value: input.outsideArea, color: CHART.emergency },
  ].filter((slice) => slice.value > 0);
}

export function todayVisitSlices(visits: Visit[]): AdminChartSlice[] {
  const counts = visitStatusCounts(visits);
  return [
    { label: 'Completed', value: counts.completed, color: CHART.safe },
    { label: 'Upcoming', value: counts.upcoming, color: CHART.info },
    { label: 'Missed', value: counts.missed, color: CHART.muted },
  ].filter((slice) => slice.value > 0);
}

export function buildAttentionItems(input: {
  emergencies: EmergencyCase[];
  requests: ServiceRequest[];
  missedVisits: Visit[];
  seniors: AdminSenior[];
}): AdminAttentionItem[] {
  const seniorName = (seniorId: string) => {
    const senior = input.seniors.find((item) => item.id === seniorId);
    return senior ? adminSeniorDisplay(senior) : 'Senior';
  };

  const emergencies: AdminAttentionItem[] = input.emergencies.slice(0, 4).map((item) => ({
    id: `emergency-${item.id}`,
    kind: 'emergency',
    title: item.caseNumber ? `#${item.caseNumber}` : emergencyTypeLabel(item.type),
    detail: `${seniorName(item.seniorId)} · ${humanizeStatus(item.status)}`,
    timestamp: item.createdAt,
    actionLabel: 'Respond',
    href: `/(admin)/emergencies/${item.id}`,
  }));

  const requests: AdminAttentionItem[] = input.requests
    .filter((item) => item.status === 'REQUESTED')
    .slice(0, 4)
    .map((item) => ({
      id: `request-${item.id}`,
      kind: 'request',
      title: item.serviceName,
      detail: `${seniorName(item.seniorId)} · Pending assignment`,
      timestamp: null,
      actionLabel: 'Assign',
      href: '/(admin)/requests',
    }));

  const visits: AdminAttentionItem[] = input.missedVisits.slice(0, 3).map((item) => ({
    id: `visit-${item.id}`,
    kind: 'visit',
    title: 'Missed visit',
    detail: `${seniorName(item.seniorId)} · ${item.scheduledAt ? formatTime(item.scheduledAt) : 'Unscheduled'}`,
    timestamp: item.scheduledAt,
    actionLabel: 'Review',
    href: `/(admin)/visits/${item.id}`,
  }));

  return [...emergencies, ...requests, ...visits].slice(0, 6);
}

export function buildUpcomingVisitRows(input: {
  visits: Visit[];
  seniors: AdminSenior[];
}): AdminUpcomingVisitRow[] {
  return input.visits.slice(0, 6).map((visit) => {
    const senior = input.seniors.find((item) => item.id === visit.seniorId);
    const upcoming = VISIT_UPCOMING.has(visit.status);
    return {
      id: visit.id,
      time: visit.scheduledAt ? formatTime(visit.scheduledAt) : '—',
      name: senior ? adminSeniorDisplay(senior) : 'Senior',
      type: visit.notes?.trim() || visit.careManagerName || 'Home visit',
      status: upcoming && visit.status === 'SCHEDULED' ? 'Scheduled' : humanizeStatus(visit.status),
      href: `/(admin)/visits/${visit.id}`,
    };
  });
}

export function buildActivityRows(logs: AdminAuditLog[]): AdminActivityRow[] {
  return logs.slice(0, 6).map((log) => ({
    id: log.id,
    title: humanizeStatus(log.action ?? 'Updated'),
    detail: [log.entityName, log.entityId].filter(Boolean).join(' · ') || 'Record change',
    timestamp: log.createdAt,
  }));
}

export function relativeOrEmpty(value: string | null, now = new Date()): string {
  if (!value) {
    return '';
  }
  return formatRelativeTimestamp(value, now);
}

export function resolveAdminSearchTarget(query: string): { href: string; params?: Record<string, string> } {
  const needle = query.trim();
  if (!needle) {
    return { href: '/(admin)' };
  }
  const lower = needle.toLowerCase();
  const nav = ADMIN_NAV.find(
    (item) => item.label.toLowerCase().includes(lower) || item.key.toLowerCase().includes(lower),
  );
  if (nav) {
    return { href: nav.href };
  }
  if (needle.includes('@')) {
    return { href: '/(admin)/users', params: { email: needle } };
  }
  return { href: '/(admin)/seniors', params: { q: needle } };
}

