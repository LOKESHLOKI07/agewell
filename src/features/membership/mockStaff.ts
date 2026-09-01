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

export const MOCK_COMPANION: MembershipCarePerson = {
  id: 'comp-anita',
  roleLabel: 'Companion',
  name: 'Anita Desai',
  phone: '+91 99887 76655',
  photoUri: null,
  nextVisit: {
    id: 'comp-next',
    label: 'Daily companion visit',
    when: 'Today · 5:30 PM',
    status: 'Upcoming',
    notes: 'Up to 30 minutes — conversation and light assistance.',
  },
  history: [
    {
      id: 'comp-h1',
      label: 'Daily companion visit',
      when: 'Yesterday · 5:15 PM',
      status: 'Completed',
      notes: 'Walked in the garden; groceries list noted.',
    },
    {
      id: 'comp-h2',
      label: 'Daily companion visit',
      when: 'Sun, 30 Aug · 5:20 PM',
      status: 'Completed',
    },
  ],
};
