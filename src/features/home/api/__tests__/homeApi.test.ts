import { apiClient } from '@/api/client';
import {
  fetchCurrentMembership,
  fetchMedications,
  fetchMembershipUsage,
  fetchMyVisits,
  fetchSeniorMe,
  fetchServiceRequests,
  fetchServices,
  fetchTodayVisits,
  fetchUnreadNotifications,
  fetchUpcomingAppointments,
} from '../homeApi';

jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const mockedGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;

function json(data: unknown) {
  mockedGet.mockResolvedValueOnce({ data } as never);
}

describe('homeApi', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('loads the authenticated senior profile from GET /seniors/me', async () => {
    json({
      id: 'senior-1',
      user_id: 'user-1',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1940-01-01',
      address: '123',
      emergency_contact: '911',
    });

    await expect(fetchSeniorMe()).resolves.toMatchObject({
      id: 'senior-1',
      firstName: 'John',
      lastName: 'Doe',
    });
    expect(mockedGet).toHaveBeenCalledWith('/seniors/me', { params: undefined });
  });

  it('loads today visits from GET /visits/?today=true', async () => {
    json({
      items: [
        {
          id: 'visit-1',
          senior_id: 'senior-1',
          care_manager_id: 'cm-1',
          status: 'SCHEDULED',
          scheduled_at: '2026-08-20T10:00:00Z',
          notes: null,
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });

    const result = await fetchTodayVisits();
    expect(result.items[0]).toMatchObject({
      id: 'visit-1',
      status: 'SCHEDULED',
      careManagerId: 'cm-1',
      notes: null,
    });
    expect(result.items[0]).not.toHaveProperty('care_manager_name');
    expect(mockedGet).toHaveBeenCalledWith('/visits/', { params: { today: true } });
  });

  it('loads all senior visits from GET /visits/ without a today filter', async () => {
    json({ items: [], total: 0, limit: 50, offset: 0 });
    await fetchMyVisits();
    expect(mockedGet).toHaveBeenCalledWith('/visits/', { params: undefined });
  });

  it('loads upcoming appointments from GET /appointments/?upcoming=true', async () => {
    json({
      items: [
        {
          id: 'appt-1',
          senior_id: 'senior-1',
          doctor_id: 'doc-1',
          doctor_name: 'Dr. Smith',
          status: 'REQUESTED',
          scheduled_at: '2026-08-20T11:30:00Z',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });

    const result = await fetchUpcomingAppointments();
    expect(result.items[0].doctorName).toBe('Dr. Smith');
    expect(mockedGet).toHaveBeenCalledWith('/appointments/', { params: { upcoming: true } });
  });

  it('loads medications from GET /healthcare/medications', async () => {
    json({
      items: [
        {
          medication_id: 'med-1',
          name: 'Aspirin',
          dosage: '100mg',
          schedule: '08:00',
          frequency: 'Daily',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });

    const result = await fetchMedications();
    expect(result.items[0]).toEqual({
      medicationId: 'med-1',
      name: 'Aspirin',
      dosage: '100mg',
      schedule: '08:00',
      frequency: 'Daily',
    });
    expect(mockedGet).toHaveBeenCalledWith('/healthcare/medications', { params: undefined });
  });

  it('loads service requests from GET /services/requests', async () => {
    json({
      items: [
        {
          id: 'req-1',
          senior_id: 'senior-1',
          service_id: 'svc-1',
          service_name: 'Physiotherapy',
          status: 'REQUESTED',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });

    const result = await fetchServiceRequests();
    expect(result.items[0].serviceName).toBe('Physiotherapy');
    expect(result.items[0]).not.toHaveProperty('scheduledAt');
    expect(result.items[0]).not.toHaveProperty('createdAt');
    expect(mockedGet).toHaveBeenCalledWith('/services/requests', { params: undefined });
  });

  it('loads the service catalogue from GET /services/', async () => {
    json([
      {
        id: 'svc-1',
        name: 'Physiotherapy',
        category: 'HEALTH',
        description: 'Test',
      },
    ]);

    await expect(fetchServices()).resolves.toEqual([
      {
        id: 'svc-1',
        name: 'Physiotherapy',
        category: 'HEALTH',
        description: 'Test',
      },
    ]);
    expect(mockedGet).toHaveBeenCalledWith('/services/', { params: undefined });
  });

  it('loads current membership and ledger usage', async () => {
    json({
      membership_id: 'mem-1',
      plan_id: 'plan-1',
      plan_name: 'Premium',
      status: 'ACTIVE',
      start_date: '2026-08-20T05:17:08.191517',
      end_date: '2026-08-20T05:17:08.191520',
      benefits: [{ benefit_id: 'ben-1', benefit_name: 'Doctor Visits', quota: 5 }],
    });
    json([
      {
        benefit_id: 'ben-1',
        benefit_name: 'Doctor Visits',
        quota: 5,
        used: 1,
        remaining: 4,
      },
    ]);

    await expect(fetchCurrentMembership()).resolves.toMatchObject({
      planName: 'Premium',
      status: 'ACTIVE',
    });
    await expect(fetchMembershipUsage()).resolves.toEqual([
      {
        benefitId: 'ben-1',
        benefitName: 'Doctor Visits',
        quota: 5,
        used: 1,
        remaining: 4,
      },
    ]);
    expect(mockedGet).toHaveBeenNthCalledWith(1, '/memberships/current', { params: undefined });
    expect(mockedGet).toHaveBeenNthCalledWith(2, '/memberships/current/usage', { params: undefined });
  });

  it('loads unread notifications from GET /notifications/?unread_only=true', async () => {
    json({
      items: [
        {
          id: 'n-1',
          title: 'Welcome',
          message: 'Welcome to AgeWell',
          priority: 'INFO',
          is_read: false,
          created_at: '2026-08-20T05:17:08.209718Z',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });

    const result = await fetchUnreadNotifications();
    expect(result.total).toBe(1);
    expect(result.items[0].isRead).toBe(false);
    expect(mockedGet).toHaveBeenCalledWith('/notifications/', { params: { unread_only: true } });
  });

  it('maps API failures through the shared error system', async () => {
    mockedGet.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 401, data: {} },
    });

    await expect(fetchSeniorMe()).rejects.toMatchObject({ name: 'ApiError', status: 401 });
  });
});
