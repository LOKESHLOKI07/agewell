import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';

export interface FamilyInvite {
  id: string;
  seniorId: string;
  firstName: string;
  lastName: string;
  relationship: string;
  email: string | null;
  phone: string | null;
  status: string;
  expiresAt: string;
  createdAt: string | null;
  acceptedAt: string | null;
  accessId: string | null;
  initialPassword: string | null;
  accountCreated: boolean;
  alreadyLinked: boolean;
}

export interface FamilyCircleMember {
  accessId: string;
  familyId: string;
  firstName: string;
  lastName: string;
  relationship: string | null;
  email: string | null;
  phone: string | null;
  linkedAt: string | null;
}

export interface FamilyCircle {
  invites: FamilyInvite[];
  members: FamilyCircleMember[];
}

interface InviteApi {
  id: string;
  senior_id: string;
  first_name: string;
  last_name: string;
  relationship: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  expires_at: string;
  created_at?: string | null;
  accepted_at?: string | null;
  access_id?: string | null;
  initial_password?: string | null;
  account_created?: boolean;
  already_linked?: boolean;
}

interface MemberApi {
  access_id: string;
  family_id: string;
  first_name: string;
  last_name: string;
  relationship?: string | null;
  email?: string | null;
  phone?: string | null;
  linked_at?: string | null;
}

function mapInvite(row: InviteApi): FamilyInvite {
  return {
    id: row.id,
    seniorId: row.senior_id,
    firstName: row.first_name,
    lastName: row.last_name,
    relationship: row.relationship,
    email: row.email ?? null,
    phone: row.phone ?? null,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at ?? null,
    acceptedAt: row.accepted_at ?? null,
    accessId: row.access_id ?? null,
    initialPassword: row.initial_password ?? null,
    accountCreated: Boolean(row.account_created),
    alreadyLinked: Boolean(row.already_linked),
  };
}

function mapMember(row: MemberApi): FamilyCircleMember {
  return {
    accessId: row.access_id,
    familyId: row.family_id,
    firstName: row.first_name,
    lastName: row.last_name,
    relationship: row.relationship ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    linkedAt: row.linked_at ?? null,
  };
}

export async function fetchFamilyCircle(): Promise<FamilyCircle> {
  try {
    const response = await apiClient.get<{ invites: InviteApi[]; members: MemberApi[] }>(
      '/families/circle',
    );
    return {
      invites: (response.data.invites ?? []).map(mapInvite),
      members: (response.data.members ?? []).map(mapMember),
    };
  } catch (error) {
    throw toApiError(error);
  }
}

export async function createFamilyInvite(input: {
  firstName: string;
  lastName: string;
  relationship: string;
  email?: string;
  phone: string;
}): Promise<FamilyInvite> {
  try {
    const response = await apiClient.post<InviteApi>('/families/invites', {
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      relationship: input.relationship.trim(),
      email: input.email?.trim() || null,
      phone: input.phone.trim(),
    });
    return mapInvite(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function revokeFamilyAccess(accessId: string): Promise<void> {
  try {
    await apiClient.delete(`/families/circle/access/${accessId}`);
  } catch (error) {
    throw toApiError(error);
  }
}
