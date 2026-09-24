import type { ServiceRequest, ServiceRequestStatus } from '@/features/home/types/home';
import { humanizeStatus } from '@/features/home/selectors/homeViewModel';
import type { MemberDelivery } from '@/features/deliveries/types';
import { findDeliveryForRequest, isDeliveryTrackable } from '@/features/deliveries/selectors';
import { staffDeliveryStatusPresentation } from '@/features/care/staffHomeModel';
import type { IconName } from '@/components/ui';

export const MEDICINE_SERVICE_SLUG = 'medicine';

export type MedicineOrderTone = 'delivered' | 'en_route' | 'placed' | 'progress' | 'cancelled';

export type MedicineOrderView = {
  id: string;
  orderCode: string;
  subtitle: string;
  statusLabel: string;
  statusDetail: string;
  tone: MedicineOrderTone;
  trackable: boolean;
  deliveryId: string | null;
};

const TONE_META: Record<MedicineOrderTone, { icon: IconName; color: string; soft: string }> = {
  delivered: { icon: 'checkmark-circle-outline', color: '#3D8B40', soft: '#F3FAF4' },
  en_route: { icon: 'bike', color: '#2F80ED', soft: '#F5F8FE' },
  placed: { icon: 'time-outline', color: '#6B6B6B', soft: '#F3F4F6' },
  progress: { icon: 'time-outline', color: '#E67E22', soft: '#FFF8F2' },
  cancelled: { icon: 'alert-circle-outline', color: '#E5484D', soft: '#FEF6F6' },
};

export function medicineOrderToneMeta(tone: MedicineOrderTone) {
  return TONE_META[tone];
}

export function filterMedicineRequests(requests: ServiceRequest[]): ServiceRequest[] {
  return requests.filter((item) => item.serviceSlug === MEDICINE_SERVICE_SLUG);
}

export function medicineOrderCode(request: ServiceRequest): string {
  const short = request.id.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `#AW-MED-${short}`;
}

function toneFromRequestStatus(status: ServiceRequestStatus): MedicineOrderTone {
  switch (status) {
    case 'COMPLETED':
      return 'delivered';
    case 'CANCELLED':
      return 'cancelled';
    case 'IN_PROGRESS':
      return 'progress';
    case 'REQUESTED':
    case 'CONFIRMED':
    case 'ASSIGNED':
    case 'SCHEDULED':
    default:
      return 'placed';
  }
}

function detailFromRequest(request: ServiceRequest, tone: MedicineOrderTone): string {
  if (request.notes?.trim()) {
    return request.notes.trim();
  }
  switch (tone) {
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'This order was cancelled';
    case 'progress':
      return 'AgeWell is preparing your medicines';
    default:
      return 'Prescription received';
  }
}

export function toMedicineOrderView(
  request: ServiceRequest,
  deliveries: MemberDelivery[],
): MedicineOrderView {
  const delivery = findDeliveryForRequest(request, deliveries);
  const trackable = isDeliveryTrackable(delivery);

  if (delivery) {
    const presentation = staffDeliveryStatusPresentation(delivery.status);
    let tone: MedicineOrderTone = 'progress';
    if (delivery.status === 'COMPLETED') {
      tone = 'delivered';
    } else if (delivery.status === 'EN_ROUTE') {
      tone = 'en_route';
    } else if (delivery.status === 'FAILED') {
      tone = 'cancelled';
    } else if (delivery.status === 'PENDING') {
      tone = 'placed';
    }
    return {
      id: request.id,
      orderCode: medicineOrderCode(request),
      subtitle: delivery.executiveName ? `With ${delivery.executiveName}` : humanizeStatus(request.status),
      statusLabel: presentation.label,
      statusDetail: detailFromRequest(request, tone),
      tone,
      trackable,
      deliveryId: delivery.id,
    };
  }

  const tone = toneFromRequestStatus(request.status);
  return {
    id: request.id,
    orderCode: medicineOrderCode(request),
    subtitle: humanizeStatus(request.status),
    statusLabel: humanizeStatus(request.status),
    statusDetail: detailFromRequest(request, tone),
    tone,
    trackable: false,
    deliveryId: null,
  };
}

export function toMedicineOrderViews(
  requests: ServiceRequest[],
  deliveries: MemberDelivery[],
): MedicineOrderView[] {
  return filterMedicineRequests(requests).map((request) => toMedicineOrderView(request, deliveries));
}
