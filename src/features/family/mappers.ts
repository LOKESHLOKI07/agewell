import { toSeniorProfile } from '@/features/home/api/mappers';
import type { SeniorProfile } from '@/features/home/types/home';
import type { FamilyMember, FamilyMemberResponse } from './types';

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

export function toFamilyMember(payload: unknown): FamilyMember {
  const data = asRecord(payload, 'family member') as unknown as FamilyMemberResponse;
  return {
    id: asId(data.id, 'family.id'),
    userId: asId(data.user_id, 'family.user_id'),
    firstName: asOptionalString(data.first_name),
    lastName: asOptionalString(data.last_name),
    relationship: asOptionalString(data.relationship),
    requestedSeniorReference: asOptionalString(data.requested_senior_reference),
    createdAt: asOptionalString(data.created_at),
    updatedAt: asOptionalString(data.updated_at),
  };
}

export function toFamilySeniors(payload: unknown): SeniorProfile[] {
  if (!Array.isArray(payload)) {
    throw new Error('Invalid family seniors');
  }
  return payload.map(toSeniorProfile);
}

export function familyDisplayName(member: Pick<FamilyMember, 'firstName' | 'lastName'>): string {
  return [member.firstName, member.lastName].filter(Boolean).join(' ').trim();
}

export function resolveSelectedSeniorId(
  seniors: SeniorProfile[],
  selectedSeniorId: string | null,
): string | null {
  if (seniors.length === 0) {
    return null;
  }
  if (selectedSeniorId && seniors.some((senior) => senior.id === selectedSeniorId)) {
    return selectedSeniorId;
  }
  return seniors[0].id;
}
