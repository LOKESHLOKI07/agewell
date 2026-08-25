import type { SeniorProfile } from '@/features/home/types/home';

/** Matches FastAPI FamilyMemberResponse. */
export interface FamilyMemberResponse {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface FamilyMember {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type FamilySenior = SeniorProfile;
