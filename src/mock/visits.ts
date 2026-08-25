import type { Visit, VisitReport } from '@/types';

export const mockVisits: Visit[] = [
  {
    id: 'visit-2026-08-18',
    seniorId: 'senior-lakshmi',
    careManagerId: 'cm-priya',
    type: 'Weekly Wellbeing Visit',
    scheduledAt: '2026-08-18T16:00:00+05:30',
    durationMinutes: 60,
    status: 'scheduled',
  },
  {
    id: 'visit-2026-08-15',
    seniorId: 'senior-lakshmi',
    careManagerId: 'cm-priya',
    type: 'Wellbeing Visit',
    scheduledAt: '2026-08-15T16:00:00+05:30',
    durationMinutes: 55,
    status: 'completed',
    summary:
      "Today's visit was completed successfully. Lakshmi was comfortable and had no immediate concerns.",
  },
  {
    id: 'visit-2026-08-12',
    seniorId: 'senior-lakshmi',
    careManagerId: 'cm-priya',
    type: 'Doctor Appointment Assistance',
    scheduledAt: '2026-08-12T11:00:00+05:30',
    durationMinutes: 90,
    status: 'completed',
    summary: 'Accompanied Lakshmi to her cardiology review and helped capture follow-up notes.',
  },
];

export const mockVisitReports: VisitReport[] = [
  {
    id: 'report-visit-2026-08-18',
    visitId: 'visit-2026-08-18',
    careSummary:
      'Visit is scheduled. A complete report will appear here after the Care Manager completes the session.',
    observations: ['No report yet — this visit has not started.'],
    nextSteps: ['Care Manager Priya Nair will arrive at 4:00 PM.'],
    fullReportAvailable: false,
  },
  {
    id: 'report-visit-2026-08-15',
    visitId: 'visit-2026-08-15',
    careSummary:
      'Visited Lakshmi and checked general wellbeing. Assisted with medication organization and discussed upcoming doctor appointment.',
    observations: [
      'Mood was calm and conversational throughout the visit.',
      'Medications were organized for the coming week.',
      'No immediate health concerns were reported.',
      'Home environment appeared tidy and familiar.',
    ],
    nextSteps: [
      'Confirm transport for the cardiology appointment tomorrow.',
      'Share a short family update after the next visit.',
    ],
    fullReportAvailable: true,
  },
  {
    id: 'report-visit-2026-08-12',
    visitId: 'visit-2026-08-12',
    careSummary:
      'Accompanied Lakshmi to Mock Hospital for her cardiology review and helped her feel settled before and after the appointment.',
    observations: [
      'Arrived on time and waited with Lakshmi in a quiet area.',
      'Doctor advised continuing the current care plan.',
      'Lakshmi was tired after the visit but comfortable at home.',
    ],
    nextSteps: ['Schedule the next wellbeing visit.', 'Keep the prescription copy in the care file.'],
    fullReportAvailable: true,
  },
];
