import type { IconName } from '@/components/ui';

export type MembershipVisit = {
  id: string;
  label: string;
  when: string;
  status: 'Upcoming' | 'Completed';
  notes?: string;
};

export type MembershipCarePerson = {
  id: string;
  roleLabel: string;
  name: string;
  phone: string;
  photoUri: string | null;
  nextVisit: MembershipVisit;
  history: MembershipVisit[];
};

export type CompanionActivity = {
  id: string;
  when: string;
  title: string;
  body: string;
  icon: IconName;
  tone: 'green' | 'blue' | 'pink';
};

export type CompanionProfile = {
  id: string;
  roleLabel: string;
  name: string;
  phone: string;
  photoUri: string | null;
  experience: string;
  serviceAreas: string;
  traits: string;
  activities: CompanionActivity[];
};

/** Phase 1 mock data — replace with /care + /visits later. */
export const MOCK_CARE_MANAGER: MembershipCarePerson = {
  id: 'cm-priya',
  roleLabel: 'Care Manager',
  name: 'Priya Sharma',
  phone: '+91 98765 43210',
  photoUri: null,
  nextVisit: {
    id: 'cm-next',
    label: 'Monthly wellbeing check',
    when: 'Thu, 4 Sep · 11:00 AM',
    status: 'Upcoming',
    notes: 'Overall condition review and service follow-up.',
  },
  history: [
    {
      id: 'cm-h1',
      label: 'Monthly wellbeing check',
      when: 'Mon, 4 Aug · 10:30 AM',
      status: 'Completed',
      notes: 'All good. Medicine refill coordinated.',
    },
    {
      id: 'cm-h2',
      label: 'Home safety follow-up',
      when: 'Wed, 9 Jul · 4:00 PM',
      status: 'Completed',
    },
  ],
};

/** Demo companion shown on the member Companion Visit screen. */
export const MOCK_COMPANION: CompanionProfile = {
  id: 'comp-anjali',
  roleLabel: 'Companion Caregiver',
  name: 'Anjali Patil',
  phone: '+91 99887 76655',
  photoUri: null,
  experience: '4+ years in eldercare support',
  serviceAreas: 'Kandivali & Borivali',
  traits: 'Friendly • Patient • Trustworthy',
  activities: [
    {
      id: 'comp-a1',
      when: '12 Aug 2026',
      title: 'Home Visit Completed',
      body: 'Assisted with daily activities and a short walk.',
      icon: 'checkmark-circle-outline',
      tone: 'green',
    },
    {
      id: 'comp-a2',
      when: '05 Aug 2026',
      title: 'Accompanied to Doctor Visit',
      body: 'Visited Dr. Mehta at Apex Hospital.',
      icon: 'calendar-outline',
      tone: 'blue',
    },
    {
      id: 'comp-a3',
      when: '28 Jul 2026',
      title: 'Companion Support',
      body: 'Helped with grocery shopping and household work.',
      icon: 'heart-outline',
      tone: 'pink',
    },
  ],
};
