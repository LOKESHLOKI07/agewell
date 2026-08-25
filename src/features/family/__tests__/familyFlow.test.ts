import { apiClient } from '@/api/client';
import { queryClient } from '@/api/queryClient';
import { ApiError } from '@/api/errors';
import { authenticatedHomeHref } from '@/features/auth/roleRouting';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { seniorDisplayName } from '@/features/home/api/mappers';
import {
  fetchFamilyAppointments,
  fetchFamilyEmergencyCases,
  fetchFamilyMe,
  fetchFamilyMedicationSchedules,
  fetchFamilyMembership,
  fetchFamilyMembershipUsage,
  fetchFamilyNotifications,
  fetchFamilySeniors,
  fetchFamilyServiceRequests,
  fetchFamilyTodayVisits,
  fetchFamilyUpcomingVisits,
} from '../api';
import { useFamilyStore } from '../familyStore';
import { familyDisplayName, resolveSelectedSeniorId, toFamilyMember, toFamilySeniors } from '../mappers';
import { familyQueryKeys, familySeniorScopeParams } from '../queryKeys';
import {
  FAMILY_FORBIDDEN_MESSAGE,
  familyCarePlanLabel,
  familyCareStatusCopy,
  familyDashboardStats,
  familyLastCheckIn,
  familyRecentActivity,
  familyUpcomingVisit,
  familyVisitDetailHref,
  familyAppointmentBookHref,
  familyAppointmentDetailHref,
  getFamilyLoadErrorMessage,
  invalidateFamilySeniorQueries,
  isLiveVisit,
} from '../selectors';

jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const mockedGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;

function json(data: unknown) {
  mockedGet.mockResolvedValueOnce({ data } as never);
}

const john = {
  id: '0b3922d7-6ec2-4810-a259-58d0ec262f69',
  user_id: '11111111-1111-1111-1111-111111111111',
  first_name: 'John',
  last_name: 'Doe',
  date_of_birth: '1940-01-01',
  address: '123',
  emergency_contact: '911',
};

const jane = {
  ...john,
  id: '22222222-2222-2222-2222-222222222222',
  first_name: 'Jane',
};

const familyMe = {
  id: 'fam-1',
  user_id: 'family-user',
  first_name: 'Son',
  last_name: 'Doe',
  created_at: '2026-08-01T00:00:00.000Z',
  updated_at: null,
};

const visitPayload = {
  id: 'visit-1',
  senior_id: john.id,
  care_manager_id: 'cm-1',
  employee_id: 'CM01',
  care_manager_name: 'Rohit Sharma',
  status: 'SCHEDULED',
  scheduled_at: '2026-08-20T10:00:00.000Z',
  notes: 'Bring reports',
};

describe('Family Mode routing', () => {
  it('sends FAMILY to Family Mode', () => {
    expect(authenticatedHomeHref('FAMILY')).toBe('/(family)');
  });

  it('keeps Senior and Care Manager routing unchanged', () => {
    expect(authenticatedHomeHref('SENIOR')).toBe('/(tabs)');
    expect(authenticatedHomeHref('CARE_MANAGER')).toBe('/(care)');
    expect(authenticatedHomeHref('ADMIN')).toBe('/(admin)');
  });
});

describe('family profile and seniors', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('loads the authenticated family profile', async () => {
    json(familyMe);
    const profile = await fetchFamilyMe();
    expect(profile).toMatchObject({ firstName: 'Son', lastName: 'Doe', userId: 'family-user' });
    expect(familyDisplayName(profile)).toBe('Son Doe');
    expect(mockedGet).toHaveBeenCalledWith('/families/me', { params: undefined });
  });

  it('loads authorized seniors only', async () => {
    json([john]);
    const seniors = await fetchFamilySeniors();
    expect(seniors).toHaveLength(1);
    expect(seniorDisplayName(seniors[0])).toBe('John Doe');
    expect(seniors[0].id).toBe(john.id);
    expect(mockedGet).toHaveBeenCalledWith('/families/seniors', { params: undefined });
  });

  it('maps a senior list without unrelated parents', () => {
    const seniors = toFamilySeniors([john]);
    expect(seniors.map((item) => item.id)).toEqual([john.id]);
    expect(seniors.map((item) => item.id)).not.toContain(jane.id);
  });
});

describe('senior selector', () => {
  it('auto-selects the only senior', () => {
    const seniors = toFamilySeniors([john]);
    expect(resolveSelectedSeniorId(seniors, null)).toBe(john.id);
  });

  it('keeps a valid selected senior and falls back when the selection is missing', () => {
    const seniors = toFamilySeniors([john, jane]);
    expect(resolveSelectedSeniorId(seniors, jane.id)).toBe(jane.id);
    expect(resolveSelectedSeniorId(seniors, 'missing')).toBe(john.id);
    expect(resolveSelectedSeniorId([], 'missing')).toBeNull();
  });

  it('stores the selected senior in Family Mode state', () => {
    useFamilyStore.getState().reset();
    useFamilyStore.getState().selectSenior(john.id);
    expect(useFamilyStore.getState().selectedSeniorId).toBe(john.id);
    useFamilyStore.getState().reset();
    expect(useFamilyStore.getState().selectedSeniorId).toBeNull();
  });
});

describe('family senior-scoped APIs', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('passes selected senior_id to visits, appointments, medications, services, membership, and emergency', async () => {
    json({ items: [visitPayload], total: 1, limit: 50, offset: 0 });
    json({ items: [visitPayload], total: 1, limit: 50, offset: 0 });
    json({
      items: [
        {
          id: 'appt-1',
          senior_id: john.id,
          doctor_id: 'doc-1',
          doctor_name: 'Dr. Smith',
          status: 'REQUESTED',
          scheduled_at: '2026-08-21T10:00:00.000Z',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });
    json({
      items: [
        {
          id: 'sched-1',
          medication_id: 'med-1',
          medication_name: 'Aspirin',
          dosage: '100mg',
          schedule_time: '08:00',
          frequency: 'Daily',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });
    json({
      items: [
        {
          id: 'req-1',
          senior_id: john.id,
          service_id: 'svc-1',
          service_name: 'Physiotherapy',
          status: 'REQUESTED',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });
    json({
      membership_id: 'mem-1',
      plan_id: 'plan-1',
      plan_name: 'Premium',
      status: 'ACTIVE',
      start_date: '2026-01-01T00:00:00.000Z',
      end_date: '2026-12-31T00:00:00.000Z',
      benefits: [{ benefit_id: 'b-1', benefit_name: 'Doctor Visits', quota: 5 }],
    });
    json([{ benefit_id: 'b-1', benefit_name: 'Doctor Visits', quota: 5, used: 1, remaining: 4 }]);
    json({
      items: [
        {
          id: 'em-1',
          senior_id: john.id,
          type: 'MEDICAL',
          status: 'OPEN',
          created_at: '2026-08-20T10:00:00.000Z',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });

    const today = await fetchFamilyTodayVisits(john.id);
    const upcoming = await fetchFamilyUpcomingVisits(john.id);
    const appointments = await fetchFamilyAppointments(john.id, true);
    const medications = await fetchFamilyMedicationSchedules(john.id);
    const services = await fetchFamilyServiceRequests(john.id);
    const membership = await fetchFamilyMembership(john.id);
    const usage = await fetchFamilyMembershipUsage(john.id);
    const emergency = await fetchFamilyEmergencyCases(john.id);

    expect(today.items[0].careManagerName).toBe('Rohit Sharma');
    expect(today.items[0].employeeId).toBe('CM01');
    expect(upcoming.total).toBe(1);
    expect(appointments.items[0].doctorName).toBe('Dr. Smith');
    expect(medications.items[0].medicationName).toBe('Aspirin');
    expect(services.items[0].serviceName).toBe('Physiotherapy');
    expect(membership.planName).toBe('Premium');
    expect(usage[0]).toMatchObject({ used: 1, remaining: 4, quota: 5 });
    expect(emergency.items[0].status).toBe('OPEN');

    expect(mockedGet).toHaveBeenCalledWith('/visits/', {
      params: { ...familySeniorScopeParams(john.id), today: true },
    });
    expect(mockedGet).toHaveBeenCalledWith('/visits/', {
      params: { ...familySeniorScopeParams(john.id), upcoming: true },
    });
    expect(mockedGet).toHaveBeenCalledWith('/appointments/', {
      params: { ...familySeniorScopeParams(john.id), upcoming: true },
    });
    expect(mockedGet).toHaveBeenCalledWith('/healthcare/medication-schedules', {
      params: familySeniorScopeParams(john.id),
    });
    expect(mockedGet).toHaveBeenCalledWith('/services/requests', {
      params: familySeniorScopeParams(john.id),
    });
    expect(mockedGet).toHaveBeenCalledWith('/memberships/current', {
      params: familySeniorScopeParams(john.id),
    });
    expect(mockedGet).toHaveBeenCalledWith('/memberships/current/usage', {
      params: familySeniorScopeParams(john.id),
    });
    expect(mockedGet).toHaveBeenCalledWith('/emergency/', {
      params: familySeniorScopeParams(john.id),
    });
  });

  it('loads user-scoped family notifications without a senior_id', async () => {
    json({
      items: [
        {
          id: 'n-1',
          title: 'Emergency request for John',
          message: 'John created a Medical Emergency request in AgeWell.',
          priority: 'EMERGENCY',
          is_read: false,
          created_at: '2026-08-20T10:00:00.000Z',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });
    const result = await fetchFamilyNotifications();
    expect(result.items[0].priority).toBe('EMERGENCY');
    expect(mockedGet).toHaveBeenCalledWith('/notifications/');
  });

  it('surfaces unauthorized senior access as 403', async () => {
    mockedGet.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 403, data: {} },
    });
    await expect(fetchFamilyTodayVisits(jane.id)).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
    });
    expect(getFamilyLoadErrorMessage(new ApiError('forbidden', 403))).toBe(FAMILY_FORBIDDEN_MESSAGE);
    expect(ApiError).toBeDefined();
  });
});

describe('family query states and keys', () => {
  it('reports loading, empty, and error states', () => {
    expect(getSectionState({ isPending: true, isError: false, isEmpty: true })).toBe('loading');
    expect(getSectionState({ isPending: false, isError: false, isEmpty: true })).toBe('empty');
    expect(getSectionState({ isPending: false, isError: true, isEmpty: true })).toBe('error');
    expect(getSectionState({ isPending: false, isError: false, isEmpty: false })).toBe('ready');
  });

  it('uses family query keys and visit detail href', () => {
    expect(familyQueryKeys.me).toEqual(['family', 'me']);
    expect(familyQueryKeys.seniors).toEqual(['family', 'seniors']);
    expect(familyQueryKeys.visits(john.id)).toEqual(['family', 'visits', john.id]);
    expect(familyQueryKeys.appointments(john.id)).toEqual(['family', 'appointments', john.id]);
    expect(familyQueryKeys.medications(john.id)).toEqual(['family', 'medications', john.id]);
    expect(familyQueryKeys.serviceRequests(john.id)).toEqual(['family', 'serviceRequests', john.id]);
    expect(familyQueryKeys.membership(john.id)).toEqual(['family', 'membership', john.id]);
    expect(familyQueryKeys.membershipUsage(john.id)).toEqual(['family', 'membershipUsage', john.id]);
    expect(familyQueryKeys.emergency(john.id)).toEqual(['family', 'emergency', john.id]);
    expect(familyQueryKeys.notifications).toEqual(['family', 'notifications']);
    expect(familyVisitDetailHref('visit-1')).toEqual({
      pathname: '/family/visits/[id]',
      params: { id: 'visit-1' },
    });
    expect(familyAppointmentBookHref()).toBe('/family/health/appointments/new');
    expect(familyAppointmentDetailHref('appt-1')).toEqual({
      pathname: '/family/health/appointments/[id]',
      params: { id: 'appt-1' },
    });
  });

  it('invalidates senior-scoped family queries when the selected senior changes', async () => {
    const spy = jest.spyOn(queryClient, 'invalidateQueries');
    useFamilyStore.getState().selectSenior(jane.id);
    await invalidateFamilySeniorQueries();
    expect(spy).toHaveBeenCalledWith({ queryKey: familyQueryKeys.all });
    spy.mockRestore();
  });

  it('clears family selection on logout reset', () => {
    useFamilyStore.getState().selectSenior(john.id);
    useFamilyStore.getState().reset();
    expect(useFamilyStore.getState().selectedSeniorId).toBeNull();
  });

  it('does not use hardcoded mock family data modules', () => {
    expect(toFamilyMember(familyMe).firstName).toBe('Son');
    expect(familyQueryKeys.me[0]).toBe('family');
  });
});

describe('family dashboard copy', () => {
  it('summarizes today without membership promotion', () => {
    const stats = familyDashboardStats({
      visitCount: 1,
      medicationCount: 2,
      appointmentCount: 9,
      hasEmergency: true,
      emergencyId: 'em-1',
    });
    expect(stats.map((item) => item.title)).toEqual(["Today's Care", 'Medications', 'Health', 'Safety']);
    expect(stats[0].value).toBe('1 visit');
    expect(stats[0].detail).toBe('1 scheduled');
    expect(stats[3].value).toBe('1 alert');
    expect(stats[3].href).toEqual({ pathname: '/emergency/[id]', params: { id: 'em-1' } });
  });

  it('describes care status from emergency state', () => {
    expect(familyCarePlanLabel(null)).toBe('Care Plan: Care');
    expect(familyCarePlanLabel('Premium')).toBe('Care Plan: Premium');
    expect(
      familyCareStatusCopy({ firstName: 'John', hasEmergency: false, lastCheckIn: '2026-08-20T11:47:00.000Z' }).title,
    ).toBe('John is doing well');
    expect(familyCareStatusCopy({ firstName: 'John', hasEmergency: true, lastCheckIn: null }).subtitle).toBe(
      'An AgeWell emergency request is open',
    );
  });

  it('builds a visit-first timeline and live-visit flag', () => {
    const visit = {
      id: 'visit-1',
      seniorId: john.id,
      careManagerId: 'cm-1',
      employeeId: 'CM01',
      careManagerName: 'Rohit Sharma',
      status: 'SCHEDULED' as const,
      scheduledAt: '2026-08-20T10:00:00.000Z',
      notes: null,
    };
    const appointment = {
      id: 'appt-1',
      seniorId: john.id,
      doctorId: 'doc-1',
      doctorName: 'Dr. Smith',
      status: 'REQUESTED' as const,
      scheduledAt: '2026-08-19T10:00:00.000Z',
    };
    expect(familyLastCheckIn([visit])).toBe(visit.scheduledAt);
    expect(familyUpcomingVisit([visit], [])?.id).toBe('visit-1');
    expect(isLiveVisit('IN_PROGRESS')).toBe(true);
    expect(isLiveVisit('SCHEDULED')).toBe(false);
    const activity = familyRecentActivity({
      visits: [visit],
      appointments: [appointment],
      services: [{ id: 'req-1', seniorId: john.id, serviceId: 'svc-1', serviceName: 'Grocery', status: 'COMPLETED' }],
    });
    expect(activity[0].title).toBe('Care visit scheduled');
    expect(activity.some((item) => item.title === 'Doctor appointment requested')).toBe(true);
  });
});
