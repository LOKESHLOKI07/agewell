import type { ServiceRequest, ServiceRequestStatus } from '@/features/home/types/home';
import { humanizeStatus } from '@/features/home/selectors/homeViewModel';
import type { MemberDelivery } from '@/features/deliveries/types';
import { findDeliveryForRequest, isDeliveryTrackable } from '@/features/deliveries/selectors';
import { staffDeliveryStatusPresentation } from '@/features/care/staffHomeModel';
import type { IconName } from '@/components/ui';

export const GROCERY_SERVICE_SLUG = 'grocery';

export type GroceryOrderTone = 'delivered' | 'en_route' | 'placed' | 'progress' | 'cancelled';

export type GroceryOrderView = {
  id: string;
  title: string;
  subtitle: string;
  whenLabel: string | null;
  itemsSummary: string;
  statusLabel: string;
  statusDetail: string;
  successBanner: string | null;
  tone: GroceryOrderTone;
  trackable: boolean;
  deliveryId: string | null;
};

const TONE_META: Record<GroceryOrderTone, { icon: IconName; color: string; soft: string }> = {
  delivered: { icon: 'checkmark-circle-outline', color: '#3D8B40', soft: '#F3FAF4' },
  en_route: { icon: 'bike', color: '#2F80ED', soft: '#F5F8FE' },
  placed: { icon: 'time-outline', color: '#6B6B6B', soft: '#F3F4F6' },
  progress: { icon: 'time-outline', color: '#E67E22', soft: '#FFF8F2' },
  cancelled: { icon: 'alert-circle-outline', color: '#E5484D', soft: '#FEF6F6' },
};

export function groceryOrderToneMeta(tone: GroceryOrderTone) {
  return TONE_META[tone];
}

export function filterGroceryRequests(requests: ServiceRequest[]): ServiceRequest[] {
  return requests.filter((item) => item.serviceSlug === GROCERY_SERVICE_SLUG);
}

function toneFromRequestStatus(status: ServiceRequestStatus): GroceryOrderTone {
  switch (status) {
    case 'COMPLETED':
      return 'delivered';
    case 'CANCELLED':
      return 'cancelled';
    case 'IN_PROGRESS':
      return 'progress';
    default:
      return 'placed';
  }
}

function titleFromNotes(notes: string | null): string {
  const text = notes?.trim() || '';
  if (/household/i.test(text)) {
    return 'Household Essentials';
  }
  if (/vegetable/i.test(text) && /grocery/i.test(text)) {
    return 'Grocery & Vegetables';
  }
  if (/vegetable/i.test(text)) {
    return 'Vegetables';
  }
  return 'Grocery & Vegetables';
}

function detailFromRequest(request: ServiceRequest, tone: GroceryOrderTone): string {
  if (request.notes?.trim()) {
    return request.notes.trim();
  }
  switch (tone) {
    case 'delivered':
      return 'Order delivered';
    case 'cancelled':
      return 'This order was cancelled';
    case 'progress':
    case 'en_route':
      return 'AgeWell is fulfilling your grocery list';
    default:
      return 'Grocery list received';
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatWhenLabel(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  const hours = parsed.getHours();
  const minutes = parsed.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  const min = String(minutes).padStart(2, '0');
  return `${parsed.getDate()} ${MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}, ${hour12}:${min} ${ampm}`;
}

function itemsSummaryFromDetail(detail: string): string {
  const cleaned = detail
    .replace(/^Typed grocery list:\s*/i, '')
    .replace(/^Handwritten grocery list photo:\s*/i, 'Photo list')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) {
    return 'Items: Grocery list';
  }
  const short = cleaned.length > 42 ? `${cleaned.slice(0, 39)}…` : cleaned;
  return `Items: ${short}`;
}

function statusLabelForTone(tone: GroceryOrderTone, fallback: string): string {
  if (tone === 'delivered') {
    return 'Delivered';
  }
  if (tone === 'cancelled') {
    return 'Cancelled';
  }
  if (tone === 'en_route' || tone === 'progress' || tone === 'placed') {
    return 'In Progress';
  }
  return fallback;
}

export function toGroceryOrderView(
  request: ServiceRequest,
  deliveries: MemberDelivery[],
): GroceryOrderView {
  const delivery = findDeliveryForRequest(request, deliveries);
  const trackable = isDeliveryTrackable(delivery);

  if (delivery) {
    const presentation = staffDeliveryStatusPresentation(delivery.status);
    let tone: GroceryOrderTone = 'progress';
    if (delivery.status === 'COMPLETED') {
      tone = 'delivered';
    } else if (delivery.status === 'EN_ROUTE') {
      tone = 'en_route';
    } else if (delivery.status === 'FAILED') {
      tone = 'cancelled';
    } else if (delivery.status === 'PENDING') {
      tone = 'placed';
    }
    const statusDetail = detailFromRequest(request, tone);
    const rawLabel = presentation.label === 'Completed' ? 'Delivered' : presentation.label;
    return {
      id: request.id,
      title: titleFromNotes(request.notes) || delivery.title || 'Grocery order',
      subtitle: delivery.executiveName ? `With ${delivery.executiveName}` : humanizeStatus(request.status),
      whenLabel: formatWhenLabel(request.createdAt),
      itemsSummary: itemsSummaryFromDetail(statusDetail),
      statusLabel: statusLabelForTone(tone, rawLabel),
      statusDetail,
      successBanner:
        delivery.status === 'COMPLETED'
          ? 'Order Delivered Successfully. Your items have been delivered. Payment to be made separately as per the bill.'
          : null,
      tone,
      trackable,
      deliveryId: delivery.id,
    };
  }

  const tone = toneFromRequestStatus(request.status);
  const statusDetail = detailFromRequest(request, tone);
  const rawLabel = request.status === 'COMPLETED' ? 'Delivered' : humanizeStatus(request.status);
  return {
    id: request.id,
    title: titleFromNotes(request.notes),
    subtitle: humanizeStatus(request.status),
    whenLabel: formatWhenLabel(request.createdAt),
    itemsSummary: itemsSummaryFromDetail(statusDetail),
    statusLabel: statusLabelForTone(tone, rawLabel),
    statusDetail,
    successBanner:
      request.status === 'COMPLETED'
        ? 'Order Delivered Successfully. Your items have been delivered. Payment to be made separately as per the bill.'
        : null,
    tone,
    trackable: false,
    deliveryId: null,
  };
}

export function toGroceryOrderViews(
  requests: ServiceRequest[],
  deliveries: MemberDelivery[],
): GroceryOrderView[] {
  return filterGroceryRequests(requests).map((request) => toGroceryOrderView(request, deliveries));
}

/** Current = active / in-flight; past = completed or cancelled. */
export function splitGroceryOrders(orders: GroceryOrderView[]): {
  current: GroceryOrderView[];
  past: GroceryOrderView[];
} {
  const current: GroceryOrderView[] = [];
  const past: GroceryOrderView[] = [];
  for (const order of orders) {
    if (order.tone === 'delivered' || order.tone === 'cancelled') {
      past.push(order);
    } else {
      current.push(order);
    }
  }
  return { current, past };
}
