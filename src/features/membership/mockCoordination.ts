export type TechHelpTopic = {
  id: string;
  title: string;
  description: string;
};

export type RepairCategory = {
  id: string;
  title: string;
  description: string;
};

export const TECH_HELP_TOPICS: TechHelpTopic[] = [
  {
    id: 'mobile',
    title: 'Mobile issues',
    description: 'Calls, settings, storage and basic phone troubleshooting.',
  },
  {
    id: 'apps',
    title: 'App installation',
    description: 'Install or set up WhatsApp, Zoom, food and grocery apps.',
  },
  {
    id: 'bills',
    title: 'Electricity / gas bill payments',
    description: 'Help paying utility bills through digital platforms.',
  },
  {
    id: 'ordering',
    title: 'Ordering on other platforms',
    description: 'Food or grocery orders on external apps with companion help.',
  },
  {
    id: 'other',
    title: 'Other digital help',
    description: 'Similar technology assistance as needed.',
  },
];

export const REPAIR_CATEGORIES: RepairCategory[] = [
  { id: 'plumbing', title: 'Plumbing', description: 'Taps, leaks, bathroom and kitchen plumbing.' },
  { id: 'electrical', title: 'Electrical', description: 'Switches, lights, fans and wiring checks.' },
  { id: 'carpentry', title: 'Carpentry', description: 'Doors, cabinets, furniture and fittings.' },
  { id: 'ac', title: 'AC Service', description: 'AC cleaning, service and cooling issues.' },
  { id: 'other', title: 'Other', description: 'Any other household maintenance support.' },
];

export const TRANSPORT_DURATIONS = ['Half day', 'Full day', '2 days', 'Custom'];
export const TRANSPORT_PEOPLE = ['1–2 people', '3–4 people', '5+ people'];
