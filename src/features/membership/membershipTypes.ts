export type MembershipRequestStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED';

export type MembershipApplicationStage =
  | 'SUBMITTED'
  | 'VISIT_PLANNED'
  | 'VISIT_SCHEDULED'
  | 'VISIT_COMPLETED'
  | 'IN_REVIEW'
  | 'ACCEPTED'
  | 'APPROVED'
  | 'REJECTED';

export const MEMBERSHIP_APPLICATION_STAGES: MembershipApplicationStage[] = [
  'SUBMITTED',
  'VISIT_PLANNED',
  'VISIT_SCHEDULED',
  'VISIT_COMPLETED',
  'IN_REVIEW',
  'ACCEPTED',
  'APPROVED',
  'REJECTED',
];

export interface MembershipRequest {
  id: string;
  seniorId: string;
  seniorName: string | null;
  planId: string;
  planName: string;
  planPrice: number | null;
  status: MembershipRequestStatus;
  stage: MembershipApplicationStage;
  notes: string | null;
  familyContact1Name: string | null;
  familyContact1Phone: string | null;
  familyContact2Name: string | null;
  familyContact2Phone: string | null;
  preferredHospital: string | null;
  visitPlannedAt: string | null;
  visitScheduledStart: string | null;
  visitScheduledEnd: string | null;
  visitCompletedAt: string | null;
  reviewCompletedAt: string | null;
  acceptedAt: string | null;
  paidAt: string | null;
  careManagerId: string | null;
  careManagerName: string | null;
  companionId: string | null;
  companionName: string | null;
  createdAt: string | null;
  reviewedAt: string | null;
}

export const MEMBERSHIP_REQUEST_STATUSES: MembershipRequestStatus[] = ['REQUESTED', 'APPROVED', 'REJECTED'];

export function isMembershipRequestStatus(value: unknown): value is MembershipRequestStatus {
  return value === 'REQUESTED' || value === 'APPROVED' || value === 'REJECTED';
}

export function isMembershipApplicationStage(value: unknown): value is MembershipApplicationStage {
  return typeof value === 'string' && MEMBERSHIP_APPLICATION_STAGES.includes(value as MembershipApplicationStage);
}
