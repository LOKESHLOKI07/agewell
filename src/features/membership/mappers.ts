import { toListPage } from '@/features/home/api/mappers';
import type { ListPage } from '@/features/home/types/home';
import type { MembershipRequest, MembershipRequestStatus } from './membershipTypes';
import { isMembershipApplicationStage, isMembershipRequestStatus } from './membershipTypes';

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
  const stage = isMembershipApplicationStage(data.stage) ? data.stage : 'SUBMITTED';
  return {
    id: asId(data.id, 'membership request.id'),
    seniorId: asId(data.senior_id, 'membership request.senior_id'),
    seniorName: asOptionalString(data.senior_name),
    planId: asId(data.plan_id, 'membership request.plan_id'),
    planName: asOptionalString(data.plan_name) ?? 'Membership plan',
    planPrice: asOptionalNumber(data.plan_price),
    status: data.status,
    stage,
    notes: asOptionalString(data.notes),
    familyContact1Name: asOptionalString(data.family_contact_1_name),
    familyContact1Phone: asOptionalString(data.family_contact_1_phone),
    familyContact2Name: asOptionalString(data.family_contact_2_name),
    familyContact2Phone: asOptionalString(data.family_contact_2_phone),
    preferredHospital: asOptionalString(data.preferred_hospital),
    visitPlannedAt: asOptionalString(data.visit_planned_at),
    visitScheduledStart: asOptionalString(data.visit_scheduled_start),
    visitScheduledEnd: asOptionalString(data.visit_scheduled_end),
    visitCompletedAt: asOptionalString(data.visit_completed_at),
    reviewCompletedAt: asOptionalString(data.review_completed_at),
    acceptedAt: asOptionalString(data.accepted_at),
    paidAt: asOptionalString(data.paid_at),
    careManagerId: asOptionalString(data.care_manager_id),
    careManagerName: asOptionalString(data.care_manager_name),
    companionId: asOptionalString(data.companion_id),
    companionName: asOptionalString(data.companion_name),
    createdAt: asOptionalString(data.created_at),
    reviewedAt: asOptionalString(data.reviewed_at),
  };
}

export function toMembershipRequestPage(payload: unknown): ListPage<MembershipRequest> {
  return toListPage(payload, toMembershipRequest, 'membership requests');
}

export type { MembershipRequestStatus };
