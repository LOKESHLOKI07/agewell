import { apiClient } from '@/api/client';
import { ApiError } from '@/api/errors';
import { authenticatedHomeHref, isStaffRole } from '@/features/auth/roleRouting';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import {
  createAdminCareManager,
  createAdminService,
  createAdminUser,
  createAdminVisit,
  fetchAdminAccess,
  fetchAdminAppointments,
  fetchAdminAuditLogs,
  fetchAdminCareManagers,
  fetchAdminEmergencies,
  fetchAdminFamilies,
  fetchAdminMembershipPlans,
  fetchAdminNotifications,
  fetchAdminSeniors,
  fetchAdminServiceRequests,
  fetchAdminServices,
  fetchAdminUsers,
  fetchAdminVisits,
  grantAdminAccess,
  revokeAdminAccess,
  updateAdminEmergencyStatus,
  updateAdminService,
  updateAdminServiceRequest,
  updateAdminUser,
  updateAdminVisit,
} from '../api';
import { toAdminAccess, toAdminCareManager, toAdminSenior, toAdminUser } from '../mappers';
import { adminQueryKeys } from '../queryKeys';
import {
  ADMIN_FORBIDDEN_MESSAGE,
  ADMIN_NAV,
  AUDIT_ACTOR_NOTICE,
  adminCareManagerDisplay,
  adminOverflowNav,
  adminSeniorDisplay,
  buildDashboardMetrics,
  canEnterAdminUi,
  containsSecretField,
  getAdminErrorMessage,
  isAdminPathActive,
  isDesktopWidth,
} from '../selectors';

jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    request: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockedRequest = apiClient.request as jest.MockedFunction<typeof apiClient.request>;

function jsonGet(data: unknown) {
  mockedGet.mockResolvedValueOnce({ data } as never);
}

function jsonRequest(data: unknown) {
  mockedRequest.mockResolvedValueOnce({ data } as never);
}

const userPayload = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'admin@example.com',
  phone: '666',
  role: 'ADMIN',
  created_at: '2026-08-01T00:00:00.000Z',
  updated_at: '2026-08-02T00:00:00.000Z',
  hashed_password: 'should-never-appear',
};

const seniorPayload = {
  id: '0b3922d7-6ec2-4810-a259-58d0ec262f69',
  user_id: '11111111-1111-1111-1111-111111111111',
  first_name: 'John',
  last_name: 'Doe',
  date_of_birth: '1940-01-01',
  address: '123',
  emergency_contact: '911',
  email: 'senior@example.com',
};

const familyPage = {
  items: [
    {
      id: 'fam-1',
      user_id: 'family-user',
      first_name: 'Son',
      last_name: 'Doe',
      created_at: '2026-08-01T00:00:00.000Z',
      updated_at: null,
    },
  ],
  total: 1,
  limit: 20,
  offset: 0,
};

const accessPayload = {
  id: 'access-1',
  family_id: 'fam-1',
  senior_id: seniorPayload.id,
  created_at: '2026-08-01T00:00:00.000Z',
};

describe('Admin / Operations routing', () => {
  it('sends ADMIN and OPERATIONS to the Admin workspace', () => {
    expect(authenticatedHomeHref('ADMIN')).toBe('/(admin)');
    expect(authenticatedHomeHref('OPERATIONS')).toBe('/(admin)');
    expect(canEnterAdminUi('ADMIN')).toBe(true);
    expect(canEnterAdminUi('OPERATIONS')).toBe(true);
    expect(isStaffRole('OPERATIONS')).toBe(true);
  });

  it('does not send Senior, Family, or Care Manager to Admin UI', () => {
    expect(authenticatedHomeHref('SENIOR')).toBe('/(tabs)');
    expect(authenticatedHomeHref('FAMILY')).toBe('/(family)');
    expect(authenticatedHomeHref('CARE_MANAGER')).toBe('/(care)');
    expect(canEnterAdminUi('SENIOR')).toBe(false);
    expect(canEnterAdminUi('FAMILY')).toBe(false);
    expect(canEnterAdminUi('CARE_MANAGER')).toBe(false);
  });
});

describe('admin layout helpers', () => {
  it('uses a desktop sidebar breakpoint and overflow mobile nav', () => {
    expect(isDesktopWidth(899)).toBe(false);
    expect(isDesktopWidth(900)).toBe(true);
    expect(ADMIN_NAV.some((item) => item.label === 'Dashboard')).toBe(true);
    expect(adminOverflowNav().some((item) => item.label === 'Audit Logs')).toBe(true);
    expect(isAdminPathActive('/users', '/(admin)/users')).toBe(true);
    expect(isAdminPathActive('/users/abc', '/(admin)/users')).toBe(true);
    expect(isAdminPathActive('/', '/(admin)')).toBe(true);
    expect(isAdminPathActive('/users', '/(admin)')).toBe(false);
  });
});

describe('admin APIs', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedRequest.mockReset();
  });

  it('lists users with pagination, role, and email filters and never maps secrets', async () => {
    jsonGet({ items: [userPayload], total: 6, limit: 20, offset: 0 });
    const page = await fetchAdminUsers({ limit: 20, offset: 0, role: 'ADMIN', email: 'admin@' });
    expect(page.total).toBe(6);
    expect(page.items[0]).toEqual({
      id: userPayload.id,
      email: userPayload.email,
      phone: userPayload.phone,
      role: 'ADMIN',
      createdAt: userPayload.created_at,
      updatedAt: userPayload.updated_at,
    });
    expect(containsSecretField(page.items[0])).toBe(false);
    expect(mockedGet).toHaveBeenCalledWith('/users/', {
      params: { limit: 20, offset: 0, role: 'ADMIN', email: 'admin@' },
    });
  });

  it('creates and patches users through staff endpoints', async () => {
    jsonRequest(userPayload);
    const created = await createAdminUser({
      email: 'ops@example.com',
      phone: '777',
      role: 'OPERATIONS',
      password: 'password123',
    });
    expect(created.email).toBe('admin@example.com');
    expect(mockedRequest).toHaveBeenCalledWith({
      method: 'post',
      url: '/users/',
      data: { email: 'ops@example.com', phone: '777', role: 'OPERATIONS', password: 'password123' },
    });

    jsonRequest({ ...userPayload, role: 'FAMILY' });
    const patched = await updateAdminUser(userPayload.id, { role: 'FAMILY' });
    expect(patched.role).toBe('FAMILY');
  });

  it('lists seniors and families from paginated APIs', async () => {
    jsonGet({ items: [seniorPayload], total: 2, limit: 20, offset: 0 });
    const seniors = await fetchAdminSeniors({ limit: 20, offset: 0 });
    expect(adminSeniorDisplay(seniors.items[0])).toBe('John Doe');
    expect(seniors.items[0].email).toBe('senior@example.com');

    jsonGet(familyPage);
    const families = await fetchAdminFamilies({ limit: 20, offset: 0 });
    expect(families.total).toBe(1);
    expect(families.items[0].firstName).toBe('Son');
  });

  it('grants access, reports duplicate 409, and revokes access', async () => {
    jsonGet({ items: [accessPayload], total: 1, limit: 20, offset: 0 });
    const listed = await fetchAdminAccess({ limit: 20, offset: 0, familyId: 'fam-1' });
    expect(listed.items[0].familyId).toBe('fam-1');
    expect(mockedGet).toHaveBeenCalledWith('/access/', {
      params: { limit: 20, offset: 0, family_id: 'fam-1' },
    });

    jsonRequest(accessPayload);
    const granted = await grantAdminAccess('fam-1', seniorPayload.id);
    expect(granted).toEqual({
      id: 'access-1',
      familyId: 'fam-1',
      seniorId: seniorPayload.id,
      createdAt: accessPayload.created_at,
    });
    expect((granted as unknown as { permission?: string }).permission).toBeUndefined();

    mockedRequest.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 409, data: { detail: 'Access relationship already exists' } },
    });
    await expect(grantAdminAccess('fam-1', seniorPayload.id)).rejects.toMatchObject({ status: 409 });
    expect(getAdminErrorMessage(new ApiError('conflict', 409), 'access')).toBe(
      'This family already has access to that senior.',
    );

    jsonRequest(accessPayload);
    const revoked = await revokeAdminAccess('access-1');
    expect(revoked.id).toBe('access-1');
    expect(mockedRequest).toHaveBeenLastCalledWith({ method: 'delete', url: '/access/access-1', data: undefined });
  });

  it('creates and edits care managers and maps Rohit Sharma', async () => {
    const cm = {
      id: 'cm-1',
      user_id: 'user-cm',
      employee_id: 'CM01',
      name: 'Rohit Sharma',
      first_name: 'Rohit',
      last_name: 'Sharma',
      skills: 'Nursing',
      status: 'ACTIVE',
    };
    jsonGet([cm]);
    const list = await fetchAdminCareManagers();
    expect(adminCareManagerDisplay(list[0])).toBe('Rohit Sharma');
    expect(list[0].employeeId).toBe('CM01');

    jsonRequest(cm);
    await createAdminCareManager({
      userId: 'user-cm',
      employeeId: 'CM02',
      firstName: 'Asha',
      lastName: 'Khan',
      skills: 'Nursing',
      status: 'ACTIVE',
    });
    expect(mockedRequest).toHaveBeenCalledWith({
      method: 'post',
      url: '/care/',
      data: {
        user_id: 'user-cm',
        employee_id: 'CM02',
        first_name: 'Asha',
        last_name: 'Khan',
        skills: 'Nursing',
        status: 'ACTIVE',
      },
    });
  });

  it('creates and edits catalogue services and updates request status', async () => {
    jsonGet([{ id: 'svc-1', name: 'Nurse visit', category: 'HEALTH', description: 'Help' }]);
    const services = await fetchAdminServices();
    expect(services[0].name).toBe('Nurse visit');

    jsonRequest({ id: 'svc-2', name: 'Meal', category: 'FOOD_HOME', description: 'Lunch' });
    await createAdminService({ name: 'Meal', category: 'FOOD_HOME', description: 'Lunch' });

    jsonRequest({ id: 'svc-1', name: 'Nurse visit', category: 'HEALTH', description: 'Updated' });
    await updateAdminService('svc-1', { description: 'Updated' });

    jsonGet({
      items: [{ id: 'req-1', senior_id: seniorPayload.id, service_id: 'svc-1', service_name: 'Nurse visit', status: 'REQUESTED' }],
      total: 1,
      limit: 20,
      offset: 0,
    });
    const requests = await fetchAdminServiceRequests({ limit: 20, offset: 0, status: 'REQUESTED' });
    expect(requests.items[0].status).toBe('REQUESTED');

    jsonRequest({
      id: 'req-1',
      senior_id: seniorPayload.id,
      service_id: 'svc-1',
      service_name: 'Nurse visit',
      status: 'CONFIRMED',
    });
    const updated = await updateAdminServiceRequest('req-1', 'CONFIRMED');
    expect(updated.status).toBe('CONFIRMED');
  });

  it('creates visits and reassigns care managers', async () => {
    jsonGet({
      items: [
        {
          id: 'visit-1',
          senior_id: seniorPayload.id,
          care_manager_id: 'cm-1',
          employee_id: 'CM01',
          care_manager_name: 'Rohit Sharma',
          status: 'SCHEDULED',
          scheduled_at: '2026-08-20T10:00:00.000Z',
          notes: 'Admin assigned visit',
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    });
    const listed = await fetchAdminVisits({ limit: 20, offset: 0, today: true });
    expect(listed.total).toBe(1);
    expect(mockedGet).toHaveBeenCalledWith('/visits/', { params: { limit: 20, offset: 0, today: true } });

    const visit = {
      id: 'visit-1',
      senior_id: seniorPayload.id,
      care_manager_id: 'cm-1',
      employee_id: 'CM01',
      care_manager_name: 'Rohit Sharma',
      status: 'SCHEDULED',
      scheduled_at: '2026-08-20T10:00:00.000Z',
      notes: 'Admin assigned visit',
    };
    jsonRequest(visit);
    const created = await createAdminVisit({
      seniorId: seniorPayload.id,
      careManagerId: 'cm-1',
      status: 'SCHEDULED',
      notes: 'Admin assigned visit',
    });
    expect(created.careManagerId).toBe('cm-1');

    jsonRequest({ ...visit, care_manager_id: 'cm-2', status: 'CANCELLED' });
    const patched = await updateAdminVisit('visit-1', { careManagerId: 'cm-2', status: 'CANCELLED' });
    expect(patched.status).toBe('CANCELLED');
    expect(patched.careManagerId).toBe('cm-2');
  });

  it('lists appointments with a status filter for booking operations', async () => {
    jsonGet({
      items: [
        {
          id: 'appt-1',
          senior_id: seniorPayload.id,
          doctor_id: 'doc-1',
          doctor_name: 'Dr. Smith',
          status: 'REQUESTED',
          scheduled_at: '2026-09-15T10:00:00.000Z',
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    });
    const listed = await fetchAdminAppointments({ limit: 20, offset: 0, status: 'REQUESTED' });
    expect(listed.items[0].doctorName).toBe('Dr. Smith');
    expect(listed.items[0]).not.toHaveProperty('hospital');
    expect(mockedGet).toHaveBeenCalledWith('/appointments/', {
      params: { limit: 20, offset: 0, status: 'REQUESTED' },
    });
  });

  it('reads membership plans and updates emergency status', async () => {
    jsonGet({ items: [{ id: 'plan-1', name: 'Gold', price: 499 }], total: 1, limit: 20, offset: 0 });
    const plans = await fetchAdminMembershipPlans({ limit: 20, offset: 0 });
    expect(plans.items[0].name).toBe('Gold');

    jsonGet({
      items: [
        {
          id: 'em-1',
          senior_id: seniorPayload.id,
          type: 'AGEWELL_SUPPORT',
          status: 'OPEN',
          created_at: '2026-08-20T10:00:00.000Z',
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    });
    const emergencies = await fetchAdminEmergencies({ limit: 20, offset: 0, status: 'OPEN' });
    expect(emergencies.total).toBe(1);

    jsonRequest({
      id: 'em-1',
      senior_id: seniorPayload.id,
      type: 'AGEWELL_SUPPORT',
      status: 'ACKNOWLEDGED',
      created_at: '2026-08-20T10:00:00.000Z',
    });
    const updated = await updateAdminEmergencyStatus('em-1', 'ACKNOWLEDGED');
    expect(updated.status).toBe('ACKNOWLEDGED');
  });

  it('lists admin notifications and audit logs without claiming an actor', async () => {
    jsonGet({
      items: [
        {
          id: 'n-1',
          user_id: 'user-1',
          title: 'Hello',
          message: 'World',
          priority: 'INFO',
          is_read: false,
          created_at: '2026-08-20T10:00:00.000Z',
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    });
    const notes = await fetchAdminNotifications({ limit: 20, offset: 0, isRead: false });
    expect(notes.items[0].userId).toBe('user-1');
    expect(notes.items[0].isRead).toBe(false);

    jsonGet({
      items: [
        {
          id: 'a-1',
          entity_name: 'users',
          entity_id: userPayload.id,
          action: 'UPDATE',
          changes: '{"role":"FAMILY"}',
          created_at: '2026-08-20T10:00:00.000Z',
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    });
    const logs = await fetchAdminAuditLogs({ limit: 20, offset: 0 });
    expect(logs.items[0].action).toBe('UPDATE');
    expect(AUDIT_ACTOR_NOTICE).toContain('Actor information is not available');
  });

  it('surfaces 401, 403, 404, 422, and network errors from staff APIs', async () => {
    mockedGet.mockRejectedValueOnce({ isAxiosError: true, response: { status: 401 } });
    await expect(fetchAdminUsers({ limit: 20, offset: 0 })).rejects.toMatchObject({ status: 401 });

    mockedGet.mockRejectedValueOnce({ isAxiosError: true, response: { status: 403 } });
    await expect(fetchAdminSeniors({ limit: 20, offset: 0 })).rejects.toMatchObject({ status: 403 });

    mockedGet.mockRejectedValueOnce({ isAxiosError: true, response: { status: 404 } });
    await expect(fetchAdminUsers({ limit: 20, offset: 0 })).rejects.toMatchObject({ status: 404 });

    mockedRequest.mockRejectedValueOnce({ isAxiosError: true, response: { status: 422 } });
    await expect(updateAdminUser(userPayload.id, { role: 'SENIOR' })).rejects.toMatchObject({ status: 422 });

    mockedGet.mockRejectedValueOnce({ isAxiosError: true, message: 'Network Error', code: 'ERR_NETWORK' });
    await expect(fetchAdminFamilies({ limit: 20, offset: 0 })).rejects.toMatchObject({
      message: 'Unable to connect to AgeWell. Please check your internet connection.',
    });
  });
});

describe('admin error and empty states', () => {
  it('maps 401, 403, 404, 409, 422, and network errors', () => {
    expect(getAdminErrorMessage(new ApiError('expired', 401))).toBe('expired');
    expect(getAdminErrorMessage(new ApiError('nope', 403))).toBe(ADMIN_FORBIDDEN_MESSAGE);
    expect(getAdminErrorMessage(new ApiError('missing', 404))).toBe('missing');
    expect(getAdminErrorMessage(new ApiError('dup', 409), 'care')).toBe('This employee ID is already in use.');
    expect(getAdminErrorMessage(new ApiError('dup', 409), 'user')).toBe('This email or phone is already in use.');
    expect(getAdminErrorMessage(new ApiError('bad', 422))).toBe('bad');
  });

  it('separates loading, empty, and error section states', () => {
    expect(getSectionState({ isPending: true, isError: false, isEmpty: false })).toBe('loading');
    expect(getSectionState({ isPending: false, isError: true, isEmpty: false })).toBe('error');
    expect(getSectionState({ isPending: false, isError: false, isEmpty: true })).toBe('empty');
    expect(getSectionState({ isPending: false, isError: false, isEmpty: false })).toBe('ready');
  });

  it('builds dashboard metrics from real totals and never invents values', () => {
    const metrics = buildDashboardMetrics({
      users: { isPending: false, isError: false, data: { total: 6 } },
      seniors: { isPending: false, isError: false, data: { total: 2 } },
      families: { isPending: false, isError: true },
      careManagers: { isPending: false, isError: false, data: [{ id: 'cm-1' }] },
      todayVisits: { isPending: true, isError: false },
      openEmergencies: { isPending: false, isError: false, data: { total: 0 } },
      pendingRequests: { isPending: false, isError: false, data: { total: 3 } },
    });
    expect(metrics.find((item) => item.key === 'users')?.value).toBe(6);
    expect(metrics.find((item) => item.key === 'families')?.state).toBe('error');
    expect(metrics.find((item) => item.key === 'families')?.value).toBeNull();
    expect(metrics.find((item) => item.key === 'visits')?.state).toBe('loading');
    expect(metrics.find((item) => item.key === 'emergencies')?.value).toBe(0);
    expect(metrics.find((item) => item.key === 'careManagers')?.value).toBe(1);
  });

  it('uses admin query keys', () => {
    expect(adminQueryKeys.users().slice(0, 2)).toEqual(['admin', 'users']);
    expect(adminQueryKeys.access().slice(0, 2)).toEqual(['admin', 'access']);
    expect(adminQueryKeys.emergencies().slice(0, 2)).toEqual(['admin', 'emergencies']);
  });
});

describe('admin mappers', () => {
  it('maps users, seniors, access, and care managers without secret fields', () => {
    const user = toAdminUser(userPayload);
    const senior = toAdminSenior(seniorPayload);
    const access = toAdminAccess(accessPayload);
    const care = toAdminCareManager({
      id: 'cm-1',
      user_id: 'u',
      employee_id: 'CM01',
      first_name: 'Rohit',
      last_name: 'Sharma',
      skills: 'Nursing',
      status: 'ACTIVE',
    });
    expect(user).not.toHaveProperty('hashed_password');
    expect(senior.firstName).toBe('John');
    expect(access).not.toHaveProperty('permission');
    expect(adminCareManagerDisplay(care)).toBe('Rohit Sharma');
  });
});
