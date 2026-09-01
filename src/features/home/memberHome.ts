import type { CommunityEvent } from '@/features/community/types';
import type { ServiceRequest } from '@/features/home/types/home';

const DELIVERY_SLUGS = new Set(['grocery', 'food', 'medicine']);

export function membershipMemberId(seniorId: string | undefined): string | null {
  if (!seniorId) {
    return null;
  }
  const compact = seniorId.replace(/-/g, '').slice(-6).toUpperCase();
  if (compact.length === 0) {
    return null;
  }
  return `AW${compact}`;
}

export function formatMembershipValidTill(endDate: string | null | undefined): string | null {
  if (!endDate) {
    return null;
  }
  const date = new Date(endDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function upcomingDeliveries(requests: ServiceRequest[], limit = 2): ServiceRequest[] {
  return requests.filter((item) => item.serviceSlug != null && DELIVERY_SLUGS.has(item.serviceSlug)).slice(0, limit);
}

export function upcomingCommunityEvents(events: CommunityEvent[], limit = 2, now = new Date()): CommunityEvent[] {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return events
    .filter((event) => {
      if (!event.eventDate) {
        return true;
      }
      const time = new Date(event.eventDate).getTime();
      return !Number.isNaN(time) && time >= start;
    })
    .sort((left, right) => {
      const a = left.eventDate ? new Date(left.eventDate).getTime() : Number.MAX_SAFE_INTEGER;
      const b = right.eventDate ? new Date(right.eventDate).getTime() : Number.MAX_SAFE_INTEGER;
      return a - b;
    })
    .slice(0, limit);
}

export function formatEventWhen(value: string | null): string {
  if (!value) {
    return 'Date to be announced';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function shortOrderId(id: string): string {
  return id.replace(/-/g, '').slice(-6).toUpperCase();
}
