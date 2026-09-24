import type { IconName } from '@/components/ui';
import type { HealthDocument, LabResult, ServiceRequest, ServiceRequestStatus } from '@/features/home/types/home';
import { humanizeStatus } from '@/features/home/selectors/homeViewModel';
import { formatRecordDate } from '@/features/health/selectors';

export const HEALTH_CHECK_SERVICE_SLUG = 'health-check';
export const LAB_TESTING_SERVICE_SLUG = 'lab-testing';

export type HealthReadingView = {
  id: string;
  label: string;
  value: string;
  dateLabel: string | null;
  icon: IconName;
};

export type HealthReportTone = 'available' | 'submitted' | 'completed' | 'progress' | 'cancelled';

export type HealthReportView = {
  id: string;
  title: string;
  dateLabel: string | null;
  summary: string;
  statusLabel: string;
  tone: HealthReportTone;
  kind: 'request' | 'document' | 'lab';
  href: string;
};

const READING_ICONS: { match: RegExp; icon: IconName; label?: string }[] = [
  { match: /blood\s*pressure|\bbp\b/i, icon: 'heart-outline', label: 'Blood Pressure' },
  { match: /sugar|glucose|hba1c|fasting/i, icon: 'water', label: 'Blood Sugar' },
  { match: /weight|bmi/i, icon: 'accessibility-outline', label: 'Weight' },
  { match: /cholesterol|lipid|hdl|ldl/i, icon: 'water', label: 'Cholesterol' },
  { match: /pulse|heart\s*rate/i, icon: 'heart-outline', label: 'Pulse' },
  { match: /spo2|oxygen/i, icon: 'medkit-outline', label: 'SpO₂' },
  { match: /temp/i, icon: 'time-outline', label: 'Temperature' },
];

function readingIconFor(testName: string | null): { icon: IconName; label: string } {
  const name = testName?.trim() || 'Reading';
  for (const rule of READING_ICONS) {
    if (rule.match.test(name)) {
      return { icon: rule.icon, label: rule.label ?? name };
    }
  }
  return { icon: 'flask-outline', label: name };
}

/** Latest lab results as reading cards — real data only, newest first. */
export function toHealthReadingViews(results: LabResult[], limit = 4): HealthReadingView[] {
  const sorted = [...results].sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });
  const seen = new Set<string>();
  const views: HealthReadingView[] = [];
  for (const item of sorted) {
    if (!item.resultValue?.trim()) {
      continue;
    }
    const meta = readingIconFor(item.testName);
    const key = meta.label.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    views.push({
      id: item.id,
      label: meta.label,
      value: item.resultValue.trim(),
      dateLabel: formatRecordDate(item.date),
      icon: meta.icon,
    });
    if (views.length >= limit) {
      break;
    }
  }
  return views;
}

function reportToneFromRequest(status: ServiceRequestStatus): HealthReportTone {
  switch (status) {
    case 'COMPLETED':
      return 'completed';
    case 'CANCELLED':
      return 'cancelled';
    case 'REQUESTED':
    case 'CONFIRMED':
      return 'submitted';
    default:
      return 'progress';
  }
}

function reportStatusLabel(status: ServiceRequestStatus): string {
  if (status === 'COMPLETED') {
    return 'Completed';
  }
  if (status === 'REQUESTED' || status === 'CONFIRMED') {
    return 'Request Submitted';
  }
  return humanizeStatus(status);
}

export function filterHealthCheckRequests(requests: ServiceRequest[]): ServiceRequest[] {
  return requests.filter(
    (item) =>
      item.serviceSlug === HEALTH_CHECK_SERVICE_SLUG || item.serviceSlug === LAB_TESTING_SERVICE_SLUG,
  );
}

/** Real reports from service requests + documents + labs with values. No mock rows. */
export function toHealthReportViews(input: {
  requests: ServiceRequest[];
  documents: HealthDocument[];
  labs: LabResult[];
  limit?: number;
}): HealthReportView[] {
  const limit = input.limit ?? 20;
  const fromRequests: HealthReportView[] = filterHealthCheckRequests(input.requests).map((request) => {
    const tone = reportToneFromRequest(request.status);
    return {
      id: `req-${request.id}`,
      title: request.serviceName,
      dateLabel: null,
      summary: request.notes?.trim() || 'AgeWell health check request',
      statusLabel: reportStatusLabel(request.status),
      tone,
      kind: 'request',
      href: '/(tabs)/orders',
    };
  });

  const fromDocs: HealthReportView[] = input.documents.map((doc) => ({
    id: `doc-${doc.id}`,
    title: doc.documentType?.trim() || 'Health document',
    dateLabel: null,
    summary: doc.fileUrl ? 'Report file on record' : 'Document on file',
    statusLabel: doc.fileUrl ? 'Reports Available' : 'On File',
    tone: 'available' as const,
    kind: 'document' as const,
    href: '/health/documents',
  }));

  const fromLabs: HealthReportView[] = input.labs
    .filter((item) => item.testName || item.resultValue)
    .map((lab) => ({
      id: `lab-${lab.id}`,
      title: lab.testName?.trim() || 'Lab result',
      dateLabel: formatRecordDate(lab.date),
      summary: lab.resultValue?.trim() || 'Result on file',
      statusLabel: 'Reports Available',
      tone: 'available' as const,
      kind: 'lab' as const,
      href: '/health/labs',
    }));

  // Prefer actionable requests, then documents, then labs.
  return [...fromRequests, ...fromDocs, ...fromLabs].slice(0, limit);
}

export function healthReportToneMeta(tone: HealthReportTone): { color: string; soft: string } {
  switch (tone) {
    case 'available':
      return { color: '#3D8B40', soft: '#F3FAF4' };
    case 'submitted':
      return { color: '#2F80ED', soft: '#F5F8FE' };
    case 'completed':
      return { color: '#6B6B6B', soft: '#F3F4F6' };
    case 'progress':
      return { color: '#E67E22', soft: '#FFF8F2' };
    case 'cancelled':
      return { color: '#E5484D', soft: '#FEF6F6' };
  }
}
