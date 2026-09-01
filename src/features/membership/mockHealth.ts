export type LabTestOption = {
  id: string;
  name: string;
  amountLabel: string;
};

export type DoctorProfile = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  experience: string;
  languages: string;
  nextSlot: string;
};

export type HistoryCategory = 'Blood' | 'Lab' | 'Notes' | 'Prescriptions' | 'Immunizations';

export type HistoryRecord = {
  id: string;
  category: HistoryCategory;
  title: string;
  date: string;
  summary: string;
};

export type MonthlyBloodStatus =
  | { kind: 'completed'; reportTitle: string; completedOn: string; doctorSuggestion: string }
  | { kind: 'pending'; scheduledAt: string; collection: string };

export const LAB_TESTS: LabTestOption[] = [
  { id: 'lt1', name: 'Complete Blood Count (CBC)', amountLabel: '₹499' },
  { id: 'lt2', name: 'Lipid Profile', amountLabel: '₹699' },
  { id: 'lt3', name: 'Thyroid (TSH)', amountLabel: '₹450' },
  { id: 'lt4', name: 'HbA1c', amountLabel: '₹550' },
  { id: 'lt5', name: 'Vitamin D', amountLabel: '₹899' },
];

export const LAB_SLOTS = [
  'Tomorrow · 8:00 AM',
  'Tomorrow · 10:30 AM',
  'Wed, 3 Sep · 9:00 AM',
  'Thu, 4 Sep · 11:00 AM',
];

export const MOCK_DOCTORS: DoctorProfile[] = [
  {
    id: 'd1',
    name: 'Dr. Ananya Mehta',
    specialty: 'General Physician',
    rating: 4.8,
    reviews: 126,
    experience: '14 years',
    languages: 'English, Hindi, Marathi',
    nextSlot: 'Today · 5:30 PM',
  },
  {
    id: 'd2',
    name: 'Dr. Rohan Patil',
    specialty: 'Cardiologist',
    rating: 4.9,
    reviews: 88,
    experience: '18 years',
    languages: 'English, Marathi',
    nextSlot: 'Tomorrow · 11:00 AM',
  },
];

export const HISTORY_CATEGORIES: HistoryCategory[] = [
  'Blood',
  'Lab',
  'Notes',
  'Prescriptions',
  'Immunizations',
];

export const MEDICAL_HISTORY: HistoryRecord[] = [
  {
    id: 'h1',
    category: 'Blood',
    title: 'Monthly complete body test',
    date: '4 Aug 2026',
    summary: 'Report uploaded · doctor reviewed',
  },
  {
    id: 'h2',
    category: 'Lab',
    title: 'Lipid Profile',
    date: '12 Jul 2026',
    summary: 'Home sample collection · normal range',
  },
  {
    id: 'h3',
    category: 'Notes',
    title: 'GP consultation note',
    date: '12 Jul 2026',
    summary: 'Continue current medication · review in 30 days',
  },
  {
    id: 'h4',
    category: 'Prescriptions',
    title: 'Dr. Mehta prescription',
    date: '12 Jul 2026',
    summary: 'BP and cholesterol medicines',
  },
  {
    id: 'h5',
    category: 'Immunizations',
    title: 'Influenza vaccine',
    date: '20 May 2026',
    summary: 'Annual flu shot recorded',
  },
  {
    id: 'h6',
    category: 'Blood',
    title: 'Monthly complete body test',
    date: '4 Jul 2026',
    summary: 'Report + suggestion on file',
  },
];

/** Flip to pending to demo the alternate UI state. */
export const MONTHLY_BLOOD_STATUS: MonthlyBloodStatus = {
  kind: 'completed',
  reportTitle: 'August complete body test',
  completedOn: '4 Aug 2026 · 9:20 AM',
  doctorSuggestion:
    'Vitamin D is slightly low. Continue supplements and schedule a short walk daily. Next test next month.',
};
