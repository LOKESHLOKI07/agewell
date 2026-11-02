import type { SeniorProfile } from '@/features/home/types/home';
import type { FamilyCircleMember } from './api/familyInviteApi';

export interface MembershipInviteSuggestion {
  key: string;
  firstName: string;
  lastName: string;
  phone: string;
  label: string;
  relationship: string;
}

export function phoneDigits(value: string | null | undefined): string {
  return (value || '').replace(/\D/g, '');
}

export function splitContactName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: 'Family', lastName: '' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/** Contacts saved on membership / senior profile that are not yet linked. */
export function membershipInviteSuggestions(
  senior: SeniorProfile | null | undefined,
  members: FamilyCircleMember[],
): MembershipInviteSuggestion[] {
  if (!senior) return [];

  const taken = new Set(
    members.map((member) => phoneDigits(member.phone)).filter((digits) => digits.length >= 8),
  );

  const raw: Array<{
    key: string;
    name: string | null | undefined;
    phone: string | null | undefined;
    label: string;
    relationship: string;
  }> = [
    {
      key: 'family1',
      name: senior.familyContact1Name,
      phone: senior.familyContact1Phone,
      label: 'Family contact 1',
      relationship: 'Family',
    },
    {
      key: 'family2',
      name: senior.familyContact2Name,
      phone: senior.familyContact2Phone,
      label: 'Family contact 2',
      relationship: 'Family',
    },
  ];

  const emergencyName = senior.emergencyContactName?.trim() || null;
  const emergencyPhone = phoneDigits(senior.emergencyContact);
  if (emergencyPhone.length >= 8) {
    raw.push({
      key: 'emergency',
      name: emergencyName || 'Emergency contact',
      phone: emergencyPhone,
      label: 'Emergency contact',
      relationship: 'Emergency contact',
    });
  }

  const seen = new Set<string>();
  const out: MembershipInviteSuggestion[] = [];

  for (const row of raw) {
    const digits = phoneDigits(row.phone);
    if (digits.length < 8) continue;
    if (taken.has(digits) || seen.has(digits)) continue;
    seen.add(digits);
    const { firstName, lastName } = splitContactName(row.name || 'Family');
    out.push({
      key: row.key,
      firstName,
      lastName,
      phone: digits,
      label: row.label,
      relationship: row.relationship,
    });
  }

  return out;
}
