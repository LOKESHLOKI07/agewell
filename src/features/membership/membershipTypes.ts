export type MembershipRequestStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED';

export interface MembershipRequest {
  id: string;
  seniorId: string;
  seniorName: string | null;
  planId: string;
  planName: string;
  planPrice: number | null;
  status: MembershipRequestStatus;
  notes: string | null;
  createdAt: string | null;
  reviewedAt: string | null;
}

export const MEMBERSHIP_REQUEST_STATUSES: MembershipRequestStatus[] = ['REQUESTED', 'APPROVED', 'REJECTED'];

export function isMembershipRequestStatus(value: unknown): value is MembershipRequestStatus {
  return value === 'REQUESTED' || value === 'APPROVED' || value === 'REJECTED';
}
