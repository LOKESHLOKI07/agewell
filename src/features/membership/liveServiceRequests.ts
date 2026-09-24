import type { IconName } from '@/components/ui';
import type { ServiceRequest, ServiceRequestStatus } from '@/features/home/types/home';
import { humanizeStatus } from '@/features/home/selectors/homeViewModel';

export type LiveRequestTone = 'completed' | 'scheduled' | 'progress' | 'placed' | 'cancelled';

export type LiveRequestView = {
  id: string;
  title: string;
  detail: string;
  dateLabel: string;
  statusLabel: string;
  tone: LiveRequestTone;
};

const TONE_META: Record<LiveRequestTone, { color: string; soft: string; icon: IconName }> = {
  completed: { color: '#3D8B40', soft: '#F3FAF4', icon: 'checkmark-circle-outline' },
  scheduled: { color: '#2F80ED', soft: '#F5F8FE', icon: 'time-outline' },
  progress: { color: '#E67E22', soft: '#FFF8F2', icon: 'time-outline' },
  placed: { color: '#6B6B6B', soft: '#F3F4F6', icon: 'clipboard-outline' },
  cancelled: { color: '#E5484D', soft: '#FEF6F6', icon: 'alert-circle-outline' },
};

export function liveRequestToneMeta(tone: LiveRequestTone) {
  return TONE_META[tone];
}

export function filterRequestsBySlug(requests: ServiceRequest[], slug: string): ServiceRequest[] {
  return requests.filter((item) => item.serviceSlug === slug);
}

function toneFromStatus(status: ServiceRequestStatus): LiveRequestTone {
  switch (status) {
    case 'COMPLETED':
      return 'completed';
    case 'CANCELLED':
      return 'cancelled';
    case 'SCHEDULED':
    case 'CONFIRMED':
    case 'ASSIGNED':
      return 'scheduled';
    case 'IN_PROGRESS':
      return 'progress';
    default:
      return 'placed';
  }
}

function titleFromNotes(notes: string | null, fallback: string): string {
  const text = notes?.trim() || '';
  if (!text) return fallback;
  const beforeDot = text.split('.')[0]?.trim();
  if (beforeDot && beforeDot.length <= 64) return beforeDot;
  return text.length > 48 ? `${text.slice(0, 48)}…` : text;
}

function formatRequestDate(iso: string | null | undefined): string {
  if (!iso) return 'Recently';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function toLiveRequestViews(
  requests: ServiceRequest[],
  options?: { fallbackTitle?: string; limit?: number },
): LiveRequestView[] {
  const fallback = options?.fallbackTitle ?? 'Service request';
  const limit = options?.limit ?? 5;
  return requests.slice(0, limit).map((request) => {
    const tone = toneFromStatus(request.status);
    return {
      id: request.id,
      title: titleFromNotes(request.notes, fallback),
      detail: request.notes?.trim() || humanizeStatus(request.status),
      dateLabel: formatRequestDate(request.createdAt),
      statusLabel: humanizeStatus(request.status),
      tone,
    };
  });
}
