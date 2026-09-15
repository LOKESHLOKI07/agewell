import type { HealthDocument, LabResult, ServiceRequest, ServiceRequestStatus } from '@/features/home/types/home';
import { humanizeStatus } from '@/features/home/selectors/homeViewModel';
import { formatRecordDate } from '@/features/health/selectors';

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
