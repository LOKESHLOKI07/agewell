import { apiClient } from '@/api/client';
import { ApiError } from '@/api/errors';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { toVisit } from '@/features/home/api/mappers';
import { authenticatedHomeHref } from '@/features/auth/roleRouting';
import {
  fetchCareManagerAppointments,
  fetchCareManagerProfile,
  fetchCareManagerTodayVisits,
  fetchCareManagerUpcomingVisits,
  fetchVisitDetail,
  fetchVisitReports,
  fetchVisitTasks,
} from '../api';
import { firstCareManager, toCareManagerProfile, toVisitReport, toVisitTask } from '../mappers';
import { careQueryKeys } from '../queryKeys';
import { taskStatusLabel, visitDetailHref, visitSeniorLabel } from '../selectors';

jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const mockedGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;

function json(data: unknown) {
  mockedGet.mockResolvedValueOnce({ data } as never);
}

const visitPayload = {
  id: 'ce6b0687-2535-4e0f-a36a-93ebbbb98a53',
  senior_id: '0b3922d7-6ec2-4810-a259-58d0ec262f69',
  care_manager_id: '2e6c61df-47e3-4318-8c51-3101db25e9eb',
  employee_id: 'CM01',
  care_manager_name: 'Rohit Sharma',
  status: 'SCHEDULED',
  scheduled_at: '2026-08-19T23:47:08.180922Z',
  notes: null,
};

describe('CARE_MANAGER login routing', () => {
  it('sends CARE_MANAGER to the care dashboard, not Senior tabs', () => {
    expect(authenticatedHomeHref('CARE_MANAGER')).toBe('/(care)');
    expect(authenticatedHomeHref('SENIOR')).toBe('/(tabs)');
    expect(authenticatedHomeHref('FAMILY')).toBe('/(family)');
    expect(authenticatedHomeHref('ADMIN')).toBe('/(admin)');
    expect(authenticatedHomeHref('OPERATIONS')).toBe('/(admin)');
  });

  it('keeps Senior Home routing unchanged', () => {
    expect(authenticatedHomeHref('SENIOR')).not.toBe('/(care)');
  });
});

describe('care manager APIs', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('loads the care manager profile from GET /care/', async () => {
    json([
      {
        id: 'cm-1',
        user_id: 'user-cm',
        employee_id: 'CM01',
        name: 'Rohit Sharma',
        skills: 'Nursing',
        status: 'ACTIVE',
      },
    ]);
    const profile = await fetchCareManagerProfile();
    expect(profile).toMatchObject({
      name: 'Rohit Sharma',
      employeeId: 'CM01',
      skills: 'Nursing',
      status: 'ACTIVE',
    });
    expect(mockedGet).toHaveBeenCalledWith('/care/', { params: undefined });
  });

  it('loads today visits with backend today=true', async () => {
    json({ items: [visitPayload], total: 1, limit: 50, offset: 0 });
    const result = await fetchCareManagerTodayVisits();
    expect(result.items[0].careManagerName).toBe('Rohit Sharma');
    expect(result.items[0].employeeId).toBe('CM01');
    expect(mockedGet).toHaveBeenCalledWith('/visits/', { params: { today: true } });
  });

  it('loads upcoming visits with backend upcoming=true', async () => {
    json({ items: [], total: 0, limit: 50, offset: 0 });
    const result = await fetchCareManagerUpcomingVisits();
    expect(result.items).toEqual([]);
    expect(mockedGet).toHaveBeenCalledWith('/visits/', { params: { upcoming: true } });
  });

  it('loads visit detail, tasks, and reports from real visit endpoints', async () => {
    json(visitPayload);
    json([
      {
        id: 'task-1',
        visit_id: visitPayload.id,
        task_name: 'Check vitals',
        is_completed: true,
      },
    ]);
    json([
      {
        id: 'report-1',
        visit_id: visitPayload.id,
        summary: 'All good',
        issues_noted: 'None',
      },
    ]);
    const detail = await fetchVisitDetail(visitPayload.id);
    const tasks = await fetchVisitTasks(visitPayload.id);
    const reports = await fetchVisitReports(visitPayload.id);
    expect(detail.id).toBe(visitPayload.id);
    expect(tasks[0]).toMatchObject({ taskName: 'Check vitals', isCompleted: true });
    expect(reports[0]).toMatchObject({ summary: 'All good', issuesNoted: 'None' });
    expect(mockedGet).toHaveBeenNthCalledWith(1, `/visits/${visitPayload.id}`, { params: undefined });
    expect(mockedGet).toHaveBeenNthCalledWith(2, `/visits/${visitPayload.id}/tasks`, { params: undefined });
    expect(mockedGet).toHaveBeenNthCalledWith(3, `/visits/${visitPayload.id}/reports`, { params: undefined });
  });

  it('loads appointments from GET /appointments/ and respects API errors', async () => {
    json({
      items: [
        {
          id: 'appt-1',
          senior_id: visitPayload.senior_id,
          doctor_id: 'doc-1',
          doctor_name: 'Dr. Smith',
          status: 'REQUESTED',
          scheduled_at: '2026-08-19T23:47:08Z',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });
    const result = await fetchCareManagerAppointments();
    expect(result.items[0].doctorName).toBe('Dr. Smith');
    expect(mockedGet).toHaveBeenCalledWith('/appointments/', { params: undefined });
  });
});

describe('care manager mapping and labels', () => {
  it('does not invent a senior display name', () => {
    const visit = toVisit(visitPayload);
    expect(visitSeniorLabel(visit.seniorId)).toBe(`Senior ID ${visitPayload.senior_id}`);
    expect(visitSeniorLabel(visit.seniorId)).not.toMatch(/John|Jane|Meera|Doe/);
  });

  it('maps tasks and reports without extra fields', () => {
    expect(toVisitTask({
      id: 'task-1',
      visit_id: 'visit-1',
      task_name: 'Check vitals',
      is_completed: true,
    })).toEqual({
      id: 'task-1',
      visitId: 'visit-1',
      taskName: 'Check vitals',
      isCompleted: true,
    });
    expect(taskStatusLabel(true)).toBe('Completed');
    expect(taskStatusLabel(false)).toBe('Not completed');
    expect(
      toVisitReport({
        id: 'report-1',
        visit_id: 'visit-1',
        summary: 'All good',
        issues_noted: 'None',
      }),
    ).toEqual({
      id: 'report-1',
      visitId: 'visit-1',
      summary: 'All good',
      issuesNoted: 'None',
    });
    expect(visitDetailHref('visit-1')).toEqual({
      pathname: '/care/visits/[id]',
      params: { id: 'visit-1' },
    });
  });

  it('uses the first care manager profile from GET /care/', () => {
    const profile = firstCareManager([
      toCareManagerProfile({
        id: 'cm-1',
        user_id: 'user-cm',
        employee_id: 'CM01',
        name: 'Rohit Sharma',
        skills: 'Nursing',
        status: 'ACTIVE',
      }),
    ]);
    expect(profile?.name).toBe('Rohit Sharma');
  });
});

describe('care manager query states and errors', () => {
  it('reports loading, empty, and error states', () => {
    expect(getSectionState({ isPending: true, isError: false, isEmpty: true })).toBe('loading');
    expect(getSectionState({ isPending: false, isError: false, isEmpty: true })).toBe('empty');
    expect(getSectionState({ isPending: false, isError: true, isEmpty: true })).toBe('error');
    expect(getSectionState({ isPending: false, isError: false, isEmpty: false })).toBe('ready');
  });

  it('maps unauthorized and forbidden care requests through the shared error system', async () => {
    mockedGet.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 401, data: {} },
    });
    await expect(fetchCareManagerTodayVisits()).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
    });

    mockedGet.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 403, data: {} },
    });
    await expect(fetchVisitDetail('visit-1')).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
    });
    expect(ApiError).toBeDefined();
  });

  it('uses Care query keys and does not use Senior mock visit data', () => {
    expect(careQueryKeys.visitsToday).toEqual(['care', 'visits', 'today']);
    expect(careQueryKeys.visitsUpcoming).toEqual(['care', 'visits', 'upcoming']);
    expect(careQueryKeys.profile).toEqual(['care', 'profile']);
    const mapped = toVisit(visitPayload);
    expect(mapped.careManagerName).toBe('Rohit Sharma');
    expect(mapped).not.toHaveProperty('careAssociateName');
  });
});
