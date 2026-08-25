import type { AppNotification } from '@/types';

export const mockNotifications: AppNotification[] = [
  {
    id: 'notif-visit-completed',
    title: 'Visit completed',
    description: 'The 15 August wellbeing visit for Lakshmi was completed successfully.',
    type: 'visit',
    createdAt: '2026-08-15T17:10:00+05:30',
    read: false,
  },
  {
    id: 'notif-appointment-reminder',
    title: 'Appointment reminder',
    description: 'Dr. Mehta, Cardiology — tomorrow at 11:30 AM at Mock Hospital.',
    type: 'appointment',
    createdAt: '2026-08-18T09:00:00+05:30',
    read: false,
  },
  {
    id: 'notif-care-update',
    title: 'Care update',
    description: 'Lakshmi was comfortable during the last visit and had no immediate concerns.',
    type: 'care',
    createdAt: '2026-08-15T17:20:00+05:30',
    read: true,
  },
  {
    id: 'notif-payment-success',
    title: 'Payment successful',
    description: 'AgeWell Family membership payment of ₹9,999 was received.',
    type: 'payment',
    createdAt: '2026-08-18T08:05:00+05:30',
    read: true,
  },
  {
    id: 'notif-service-received',
    title: 'Service request received',
    description: 'AgeWell will contact you shortly about your latest service request.',
    type: 'service',
    createdAt: '2026-08-17T14:40:00+05:30',
    read: false,
  },
];
