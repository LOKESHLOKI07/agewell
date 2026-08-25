import type { CareManager } from '@/types';

export const mockCareManagers: CareManager[] = [
  {
    id: 'cm-priya',
    firstName: 'Priya',
    lastName: 'Nair',
    phone: '+91 XXXXX XXXXX',
    title: 'Care Manager',
  },
];

export const mockCareManager: CareManager = mockCareManagers[0] as CareManager;
