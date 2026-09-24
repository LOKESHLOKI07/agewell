import type { HealthDocument, LabResult, ServiceRequest, ServiceRequestStatus } from '@/features/home/types/home';
import { humanizeStatus } from '@/features/home/selectors/homeViewModel';
import { formatRecordDate } from '@/features/health/selectors';
import type { IconName } from '@/components/ui';

export const MONTHLY_BLOOD_SERVICE_SLUG = 'monthly-blood-test';

const CBC_NAME = /\b(cbc|complete\s+blood|monthly\s+blood|haemogram|hemogram)\b/i;
const BLOOD_DOC = /\b(cbc|blood|lab|report)\b/i;

export type MonthlyBloodStatusView =
  | {
      kind: 'completed';
      reportTitle: string;
      completedOn: string;
      doctorSuggestion: string | null;
      href: string;
    }
  | {
      kind: 'pending';
      scheduledAt: string;
      collection: string;
      href: string;
    }
  | {
      kind: 'idle';
      title: string;
      body: string;
    };

export type MonthlyBloodActivityTone = 'completed' | 'progress' | 'available';

export type MonthlyBloodActivityView = {
  id: string;
  title: string;
  dateLabel: string | null;
  summary: string;
  statusLabel: string;
  tone: MonthlyBloodActivityTone;
  icon: IconName;
  href: string;
};

function isOpenStatus(status: ServiceRequestStatus): boolean {
  return (
    status === 'REQUESTED' ||
    status === 'CONFIRMED' ||
    status === 'ASSIGNED' ||
    status === 'SCHEDULED' ||
    status === 'IN_PROGRESS'
  );
}

export function filterMonthlyBloodRequests(requests: ServiceRequest[]): ServiceRequest[] {
  return requests.filter((item) => item.serviceSlug === MONTHLY_BLOOD_SERVICE_SLUG);
}

export function filterCbcLabs(labs: LabResult[]): LabResult[] {
  return labs.filter((item) => CBC_NAME.test(item.testName ?? ''));
}

export function filterBloodDocuments(documents: HealthDocument[]): HealthDocument[] {
  return documents.filter((item) => BLOOD_DOC.test(item.documentType ?? ''));
}

function suggestionFromNotes(notes: string | null | undefined): string | null {
  const text = notes?.trim();
  if (!text) {
    return null;
  }
  if (/suggestion|doctor|advice|recommend/i.test(text) || text.length > 24) {
    return text;
  }
  return text;
}

/**
 * Prefer open monthly-blood requests as pending; else latest completed CBC lab/doc/request.
 * Real data only — no mock status rows.
 */
export function toMonthlyBloodStatusView(input: {
  requests: ServiceRequest[];
  labs: LabResult[];
  documents: HealthDocument[];
}): MonthlyBloodStatusView {
  const requests = filterMonthlyBloodRequests(input.requests);
  const open = requests.find((item) => isOpenStatus(item.status));
  if (open) {
    return {
      kind: 'pending',
      scheduledAt: open.notes?.trim() || humanizeStatus(open.status),
      collection: 'Home sample collection · AgeWell will confirm the window',
      href: '/(tabs)/orders',
    };
  }

  const completedRequest = requests.find((item) => item.status === 'COMPLETED');
  const cbcLabs = filterCbcLabs(input.labs).sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });
  const latestLab = cbcLabs[0];
  const bloodDocs = filterBloodDocuments(input.documents);
  const latestDoc = bloodDocs[0];

  if (completedRequest || latestLab || latestDoc) {
    const reportTitle =
      latestLab?.testName?.trim() ||
      latestDoc?.documentType?.trim() ||
      completedRequest?.serviceName ||
      'Monthly CBC';
    const completedOn =
      formatRecordDate(latestLab?.date) ||
      (completedRequest ? 'Completed this month' : latestDoc ? 'Report on file' : 'Completed');
    return {
      kind: 'completed',
      reportTitle,
      completedOn,
      doctorSuggestion: suggestionFromNotes(completedRequest?.notes) || latestLab?.resultValue?.trim() || null,
      href: latestDoc?.fileUrl ? '/health/documents' : latestLab ? '/health/labs' : '/(tabs)/orders',
    };
  }

  return {
    kind: 'idle',
    title: 'No CBC on file this month',
    body: 'Request your included monthly CBC for home sample collection. Extra tests are available below.',
  };
}

export function monthlyBloodActivityToneMeta(tone: MonthlyBloodActivityTone): { color: string; soft: string } {
  switch (tone) {
    case 'completed':
      return { color: '#3D8B40', soft: '#F3FAF4' };
    case 'progress':
      return { color: '#2F80ED', soft: '#F5F8FE' };
    case 'available':
      return { color: '#3D8B40', soft: '#F3FAF4' };
  }
}

/** Recent monthly-blood activity from real requests, labs, and documents. */
export function toMonthlyBloodActivityViews(input: {
  requests: ServiceRequest[];
  labs: LabResult[];
  documents: HealthDocument[];
  limit?: number;
}): MonthlyBloodActivityView[] {
  const limit = input.limit ?? 20;
  const fromRequests: MonthlyBloodActivityView[] = filterMonthlyBloodRequests(input.requests).map((request) => {
    const open = isOpenStatus(request.status);
    const completed = request.status === 'COMPLETED';
    return {
      id: `req-${request.id}`,
      title: request.serviceName?.trim() || 'Monthly Blood Test',
      dateLabel: null,
      summary: request.notes?.trim() || (open ? 'Home sample collection' : 'CBC'),
      statusLabel: completed ? 'Completed' : open ? 'In Progress' : humanizeStatus(request.status),
      tone: completed ? 'completed' : open ? 'progress' : 'available',
      icon: open ? 'document-text-outline' : 'calendar-outline',
      href: '/(tabs)/orders',
    };
  });

  const fromLabs: MonthlyBloodActivityView[] = filterCbcLabs(input.labs).map((lab) => ({
    id: `lab-${lab.id}`,
    title: lab.testName?.trim() || 'Monthly Blood Test',
    dateLabel: formatRecordDate(lab.date),
    summary: lab.resultValue?.trim() || 'CBC (Home Sample Collection)',
    statusLabel: 'Completed',
    tone: 'completed' as const,
    icon: 'calendar-outline' as IconName,
    href: '/health/labs',
  }));

  const fromDocs: MonthlyBloodActivityView[] = filterBloodDocuments(input.documents).map((doc) => ({
    id: `doc-${doc.id}`,
    title: doc.documentType?.trim() || 'Blood Test Report',
    dateLabel: null,
    summary: 'Report on file',
    statusLabel: doc.fileUrl ? 'Report Ready' : 'On File',
    tone: 'available' as const,
    icon: 'document-text-outline' as IconName,
    href: '/health/documents',
  }));

  return [...fromRequests, ...fromLabs, ...fromDocs].slice(0, limit);
}
