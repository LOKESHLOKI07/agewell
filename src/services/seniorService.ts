import { mockSeniors } from '@/mock/seniors';
import { mockMemberships } from '@/mock/memberships';
import type { Membership, Senior } from '@/types';
import { delay } from '@/utils/delay';

export async function getSeniorsByFamilyId(familyId: string): Promise<Senior[]> {
  await delay(250);
  return mockSeniors.filter((senior) => senior.familyId === familyId);
}

export async function getSeniorById(id: string): Promise<Senior | null> {
  await delay(200);
  return mockSeniors.find((senior) => senior.id === id) ?? null;
}

export async function getMembershipById(id: string): Promise<Membership | null> {
  await delay(200);
  return mockMemberships.find((membership) => membership.id === id) ?? null;
}
