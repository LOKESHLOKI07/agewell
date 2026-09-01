import { toListPage } from '@/features/home/api/mappers';
import type { ListPage } from '@/features/home/types/home';
import type { MembershipRequest, MembershipRequestStatus } from './membershipTypes';
import { isMembershipRequestStatus } from './membershipTypes';

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
  throw new Error(`Invalid ${label}`);
}

function asOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asOptionalNumber(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === 'string' && value.length > 0) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function toMembershipRequest(payload: unknown): MembershipRequest {
  const data = asRecord(payload, 'membership request');
  if (!isMembershipRequestStatus(data.status)) {
    throw new Error('Invalid membership request status');
  }
  return {
    id: asId(data.id, 'membership request.id'),
    seniorId: asId(data.senior_id, 'membership request.senior_id'),
    seniorName: asOptionalString(data.senior_name),
    planId: asId(data.plan_id, 'membership request.plan_id'),
    planName: asOptionalString(data.plan_name) ?? 'Membership plan',
    planPrice: asOptionalNumber(data.plan_price),
    status: data.status,
    notes: asOptionalString(data.notes),
    createdAt: asOptionalString(data.created_at),
    reviewedAt: asOptionalString(data.reviewed_at),
  };
}

export function toMembershipRequestPage(payload: unknown): ListPage<MembershipRequest> {
  return toListPage(payload, toMembershipRequest, 'membership requests');
}

export type { MembershipRequestStatus };
