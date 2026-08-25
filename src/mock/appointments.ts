import type { Appointment } from '@/types';

export const mockAppointments: Appointment[] = [
  {
    id: 'appt-mehta-2026-08-19',
    seniorId: 'senior-lakshmi',
    doctorName: 'Dr. Mehta',
    specialty: 'Cardiology',
    hospital: 'Mock Hospital',
    scheduledAt: '2026-08-19T11:30:00+05:30',
    purpose: 'Routine cardiology follow-up',
    status: 'confirmed',
  },
];
