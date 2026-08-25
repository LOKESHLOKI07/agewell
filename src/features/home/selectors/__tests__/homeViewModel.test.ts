import { homeQueryKeys } from '../../api/homeQueryKeys';
import {
  appointmentToCareItem,
  buildHomeViewModel,
  buildTodayCareItems,
  getSectionState,
  medicationToCareItem,
  refetchHomeQueries,
  serviceRequestToCareItem,
  summarizeTodayOverview,
  visitToCareItem,
} from '../homeViewModel';
import type { Appointment, Medication, ServiceRequest, Visit } from '../../types/home';

const visit: Visit = {
  id: 'visit-1',
  seniorId: 'senior-1',
  careManagerId: 'cm-1',
  employeeId: 'CM01',
  careManagerName: 'Rohit Sharma',
  status: 'SCHEDULED',
  scheduledAt: '2026-08-20T12:00:00.000Z',
  notes: null,
};

const laterVisit: Visit = {
  ...visit,
  id: 'visit-2',
  scheduledAt: '2026-08-20T15:00:00.000Z',
};

const appointment: Appointment = {
  id: 'appt-1',
  seniorId: 'senior-1',
  doctorId: 'doc-1',
  doctorName: 'Dr. Smith',
  status: 'REQUESTED',
  scheduledAt: '2026-08-20T11:00:00.000Z',
};

const medication: Medication = {
  medicationId: 'med-1',
  name: 'Aspirin',
  dosage: '100mg',
  schedule: '08:00',
  frequency: 'Daily',
};

const serviceRequest: ServiceRequest = {
  id: 'req-1',
  seniorId: 'senior-1',
  serviceId: 'svc-1',
  serviceName: 'Physiotherapy',
  status: 'REQUESTED',
};

describe('today care view model', () => {
  it('renders a visit from API fields without inventing a manager name or time range', () => {
    const item = visitToCareItem(visit);
    expect(item.title).toBe('Visit');
    expect(item.subtitle).toContain('Scheduled');
    expect(item.subtitle).not.toContain('10:00 AM – 11:00 AM');
    expect(item.subtitle).not.toMatch(/care manager/i);
  });

  it('renders an appointment using doctor_name and status', () => {
    const item = appointmentToCareItem(appointment);
    expect(item.title).toBe('Dr. Smith');
    expect(item.subtitle).toContain('Requested');
  });

  it('renders a medication using name, dosage, schedule, and frequency', () => {
    expect(medicationToCareItem(medication)).toMatchObject({
      title: 'Aspirin',
      subtitle: '100mg · 08:00 · Daily',
    });
  });

  it('renders a service request using service_name and status only', () => {
    const item = serviceRequestToCareItem(serviceRequest);
    expect(item.title).toBe('Physiotherapy');
    expect(item.subtitle).toBe('Requested');
    expect(item.subtitle).not.toMatch(/\d{1,2}:\d{2}/);
  });

  it('sorts timed items chronologically and keeps untimed items after them', () => {
    const items = buildTodayCareItems({
      visits: [laterVisit, visit],
      appointments: [appointment],
      medications: [medication],
      serviceRequests: [serviceRequest],
    });

    expect(items.map((item) => item.id)).toEqual([
      'appointment-appt-1',
      'visit-visit-1',
      'visit-visit-2',
      'medication-med-1-08:00',
      'service-request-req-1',
    ]);
  });

  it('summarizes today into four tiles without inventing times', () => {
    const tiles = summarizeTodayOverview(
      buildTodayCareItems({
        visits: [visit],
        appointments: [appointment],
        medications: [medication],
        serviceRequests: [serviceRequest],
      }),
    );
    expect(tiles.map((tile) => tile.title)).toEqual(['Care Visit', 'Doctor Appt', 'Medications', 'Services']);
    expect(tiles[2]?.value).toBe('1 on file');
    expect(tiles[3]?.value).toBe('1 request');
  });

  it('keeps distinct keys when the same medication has multiple schedule rows', () => {
    const evening: Medication = { ...medication, schedule: '20:00' };
    const items = buildTodayCareItems({
      visits: [],
      appointments: [],
      medications: [medication, evening, evening],
      serviceRequests: [],
    });

    expect(items.map((item) => item.id)).toEqual([
      'medication-med-1-08:00',
      'medication-med-1-20:00',
      'medication-med-1-20:00-1',
    ]);
  });
});

describe('home view model', () => {
  it('builds greeting, services, membership usage, and unread count from API data', () => {
    const viewModel = buildHomeViewModel({
      senior: {
        id: 'senior-1',
        userId: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1940-01-01',
        address: '123',
        emergencyContact: '911',
      },
      visits: { items: [visit], total: 1, limit: 50, offset: 0 },
      appointments: { items: [appointment], total: 1, limit: 50, offset: 0 },
      medications: { items: [medication], total: 1, limit: 50, offset: 0 },
      serviceRequests: { items: [serviceRequest], total: 1, limit: 50, offset: 0 },
      services: [{ id: 'svc-1', name: 'Physiotherapy', category: 'HEALTH', description: 'Test' }],
      membership: {
        membershipId: 'mem-1',
        planId: 'plan-1',
        planName: 'Premium',
        status: 'ACTIVE',
        startDate: null,
        endDate: null,
        benefits: [],
      },
      usage: [
        {
          benefitId: 'ben-1',
          benefitName: 'Doctor Visits',
          quota: 5,
          used: 1,
          remaining: 4,
        },
      ],
      notifications: {
        items: [
          {
            id: 'n-1',
            title: 'Welcome',
            message: 'Welcome to AgeWell',
            priority: 'INFO',
            isRead: false,
            createdAt: '2026-08-20T05:17:08Z',
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
      },
    });

    expect(viewModel.greetingName).toBe('John Doe');
    expect(viewModel.quickServices).toEqual([
      { id: 'svc-1', name: 'Physiotherapy', category: 'HEALTH', description: 'Test' },
    ]);
    expect(viewModel.membership).toEqual({
      planName: 'Premium',
      status: 'ACTIVE',
      startDate: null,
      endDate: null,
      usage: [
        {
          benefitId: 'ben-1',
          benefitName: 'Doctor Visits',
          quota: 5,
          used: 1,
          remaining: 4,
        },
      ],
    });
    expect(viewModel.unreadNotificationCount).toBe(1);
    expect(viewModel.todayItems).toHaveLength(4);
  });

  it('does not invent membership usage while the ledger request is missing', () => {
    const viewModel = buildHomeViewModel({
      membership: {
        membershipId: 'mem-1',
        planId: 'plan-1',
        planName: 'Premium',
        status: 'ACTIVE',
        startDate: null,
        endDate: null,
        benefits: [{ benefitId: 'ben-1', benefitName: 'Meals', quota: 40 }],
      },
    });

    expect(viewModel.membership?.usage).toEqual([]);
    expect(viewModel.membership?.usage.some((item) => item.used === 32)).toBe(false);
  });
});

describe('section and refresh helpers', () => {
  it('reports loading, error, empty, and ready states', () => {
    expect(getSectionState({ isPending: true, isError: false, isEmpty: true })).toBe('loading');
    expect(getSectionState({ isPending: false, isError: true, isEmpty: true })).toBe('error');
    expect(getSectionState({ isPending: false, isError: false, isEmpty: true })).toBe('empty');
    expect(getSectionState({ isPending: false, isError: false, isEmpty: false })).toBe('ready');
  });

  it('refetches every Home query even if one fails', async () => {
    const ok = jest.fn().mockResolvedValue('ok');
    const fail = jest.fn().mockRejectedValue(new Error('network'));
    await expect(refetchHomeQueries([ok, fail, ok])).resolves.toBeUndefined();
    expect(ok).toHaveBeenCalledTimes(2);
    expect(fail).toHaveBeenCalledTimes(1);
  });

  it('uses the required React Query keys', () => {
    expect(homeQueryKeys).toEqual({
      seniorMe: ['senior', 'me'],
      visitsToday: ['visits', 'today'],
      visitsUpcoming: ['visits', 'upcoming'],
      visitsMine: ['visits', 'mine'],
      appointmentsUpcoming: ['appointments', 'upcoming'],
      medications: ['medications'],
      serviceRequests: ['serviceRequests'],
      services: ['services'],
      membershipCurrent: ['membership', 'current'],
      membershipUsage: ['membership', 'usage'],
      notificationsUnread: ['notifications', 'unread'],
    });
  });
});
