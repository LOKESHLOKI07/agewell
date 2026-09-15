import type { ServiceRequest } from '@/features/home/types/home';
import type { MemberDelivery } from './types';

const SLUG_BY_TITLE: Record<string, string> = {
  grocery: 'grocery',
  food: 'food',
  medicine: 'medicine',
};

export function deliverySlugFromTitle(title: string): string | null {
  const key = title.trim().toLowerCase();
  if (SLUG_BY_TITLE[key]) {
    return SLUG_BY_TITLE[key];
  }
  if (key.includes('grocery')) {
    return 'grocery';
  }
  if (key.includes('food') || key.includes('meal')) {
    return 'food';
  }
  if (key.includes('medicine') || key.includes('pharmacy')) {
    return 'medicine';
  }
  return null;
}

export function isDeliveryTrackable(delivery: MemberDelivery | null | undefined): boolean {
  return delivery?.status === 'EN_ROUTE';
}

export function findDeliveryForRequest(
  request: ServiceRequest,
  deliveries: MemberDelivery[],
): MemberDelivery | null {
  const byRequest = deliveries.find((item) => item.serviceRequestId === request.id);
  if (byRequest) {
    return byRequest;
  }
  if (!request.serviceSlug) {
    return null;
  }
  return deliveries.find((item) => deliverySlugFromTitle(item.title) === request.serviceSlug) ?? null;
}

export function seniorDeliveryTrackHref(deliveryId: string) {
  return { pathname: '/deliveries/[id]/track' as const, params: { id: deliveryId } };
}

export function deliveryExecutiveShareHref(deliveryId: string) {
  return { pathname: '/care/deliveries/[id]/share' as const, params: { id: deliveryId } };
}

export function deliveryExecutiveDisplayName(delivery: MemberDelivery | null | undefined): string {
  return delivery?.executiveName?.trim() || 'Delivery Executive';
}
