export type LifestyleEvent = {
  id: string;
  kind: 'event' | 'trip';
  title: string;
  when: string;
  place: string;
  costLabel: string;
  itinerary: string;
  interestTag: string;
};

export type InspectionArea = {
  id: string;
  name: string;
  status: 'OK' | 'Attention';
  note: string;
};

export type InspectionReport = {
  id: string;
  monthLabel: string;
  inspectedOn: string;
  overall: 'All clear' | 'Needs attention';
  areas: InspectionArea[];
};

export type CctvActivity = {
  id: string;
  when: string;
  label: string;
};

export const LIFESTYLE_ITEMS: LifestyleEvent[] = [
  {
    id: 'e1',
    kind: 'event',
    title: 'Marathi Play — Evening Show',
    when: 'Sat, 6 Sep · 6:30 PM',
    place: 'Near home · Cultural hall',
    costLabel: '₹350 / person',
    itinerary: 'Pickup optional · 2 hr show · drop after',
    interestTag: 'Theatre',
  },
  {
    id: 'e2',
    kind: 'event',
    title: 'Classical Music Morning',
    when: 'Sun, 14 Sep · 10:00 AM',
    place: 'Local auditorium',
    costLabel: '₹200 / person',
    itinerary: 'Seated concert · light refreshments',
    interestTag: 'Music',
  },
  {
    id: 't1',
    kind: 'trip',
    title: 'Lonavala One Day Trip',
    when: 'Sat, 20 Sep · 7:00 AM departure',
    place: 'Fixed departure · AgeWell outing',
    costLabel: '₹1,800 / person',
    itinerary: 'Bhushi Dam · lunch · evening return · members get first priority',
    interestTag: 'Outing',
  },
  {
    id: 't2',
    kind: 'trip',
    title: 'Private Family Day Outing',
    when: 'Choose your date',
    place: 'Flexible · private-family option',
    costLabel: 'Custom costing',
    itinerary: 'Driver + companion support · itinerary on request',
    interestTag: 'Family',
  },
];

export const INSPECTION_REPORTS: InspectionReport[] = [
  {
    id: 'ir1',
    monthLabel: 'August 2026',
    inspectedOn: '28 Aug 2026',
    overall: 'All clear',
    areas: [
      { id: 'a1', name: 'Washroom', status: 'OK', note: 'Non-slip mat in place' },
      { id: 'a2', name: 'Bedroom', status: 'OK', note: 'Night light working' },
      { id: 'a3', name: 'Entrance', status: 'OK', note: 'Lock and lighting checked' },
      { id: 'a4', name: 'Kitchen', status: 'Attention', note: 'Recommend tighter gas hose check next month' },
    ],
  },
  {
    id: 'ir2',
    monthLabel: 'July 2026',
    inspectedOn: '26 Jul 2026',
    overall: 'All clear',
    areas: [
      { id: 'b1', name: 'Washroom', status: 'OK', note: 'Grab bar secure' },
      { id: 'b2', name: 'Bedroom', status: 'OK', note: 'Clear pathways' },
      { id: 'b3', name: 'Entrance', status: 'OK', note: 'No hazards' },
    ],
  },
];

export const CCTV_ACTIVITY: CctvActivity[] = [
  { id: 'c1', when: 'Today · 9:12 AM', label: 'Motion detected — Entrance' },
  { id: 'c2', when: 'Today · 7:40 AM', label: 'Motion detected — Entrance' },
  { id: 'c3', when: 'Yesterday · 6:55 PM', label: 'Visitor at door' },
  { id: 'c4', when: 'Yesterday · 11:20 AM', label: 'Motion detected — Entrance' },
];
