import type { ListPage } from '@/features/home/types/home';
import { DELIVERY_STATUSES, type DeliveryStatus } from '@/features/care/types';
import type { MemberDelivery, MemberDeliveryResponse } from './types';

function asRecord(payload: unknown, label: string): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    throw new Error(`Invalid ${label}`);
  }
  return payload as Record<string, unknown>;
}

function asId(value: unknown, label: string): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  throw new Error(`Invalid ${label}`);
}

function asString(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}

function asOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}

function asDeliveryStatus(value: unknown): DeliveryStatus {
  if (typeof value === 'string' && (DELIVERY_STATUSES as readonly string[]).includes(value)) {
    return value as DeliveryStatus;
  }
  throw new Error('Invalid delivery status');
}

export function toMemberDelivery(payload: unknown): MemberDelivery {
  const data = asRecord(payload, 'delivery') as unknown as MemberDeliveryResponse;
  return {
    id: asId(data.id, 'delivery.id'),
    careManagerId: asId(data.care_manager_id, 'delivery.care_manager_id'),
    seniorId: asOptionalString(data.senior_id),
    serviceRequestId: asOptionalString(data.service_request_id),
    title: asString(data.title, 'delivery.title'),
    customerName: asOptionalString(data.customer_name),
    location: asOptionalString(data.location),
    status: asDeliveryStatus(data.status),
    scheduledAt: asOptionalString(data.scheduled_at),
    executiveName: asOptionalString(data.executive_name),
  };
}

export function toMemberDeliveryPage(payload: unknown): ListPage<MemberDelivery> {
  const data = asRecord(payload, 'deliveries');
  if (!Array.isArray(data.items)) {
    throw new Error('Invalid deliveries');
  }
  return {
    items: data.items.map(toMemberDelivery),
    total: asNumber(data.total, 'deliveries.total'),
    limit: asNumber(data.limit, 'deliveries.limit'),
    offset: asNumber(data.offset, 'deliveries.offset'),
  };
}
