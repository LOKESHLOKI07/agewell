import { toAdminAccess, toAdminSenior } from '../mappers';
import { adminQueryKeys } from '../queryKeys';
import {
  createAdminVisit,
  deleteAdminCareManager,
  deleteAdminFamily,
  deleteAdminSenior,
  deleteAdminUser,
  fetchAdminFamily,
  fetchAdminVisits,
  grantAdminAccess,
  updateAdminFamily,
  updateAdminSenior,
  updateAdminUser,
} from '../api';
import { apiClient } from '@/api/client';
import { adminSeniorDisplay } from '../selectors';

jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    request: jest.fn(),
  },
}));

const mockedGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockedRequest = apiClient.request as jest.MockedFunction<typeof apiClient.request>;

describe('admin relationship mapping', () => {
  it('maps enriched senior and access payloads', () => {
    const senior = toAdminSenior({
      id: 's1',
      user_id: 'u1',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1940-01-01',
      address: 'Home',
      emergency_contact: '911',
      email: 'john@example.com',
      phone: '111',
      account_status: 'ACTIVE',
    });
    expect(adminSeniorDisplay(senior)).toBe('John Doe');
    expect(senior.phone).toBe('111');
    expect(senior.accountStatus).toBe('ACTIVE');

    const access = toAdminAccess({
      id: 'a1',
      family_id: 'f1',
      senior_id: 's1',
      created_at: '2026-08-01T00:00:00.000Z',
      family_name: 'Rahul Kumar',
      family_email: 'rahul@example.com',
      senior_name: 'John Doe',
      senior_email: 'john@example.com',
    });
    expect(access.familyName).toBe('Rahul Kumar');
    expect(access.seniorEmail).toBe('john@example.com');
  });
});

describe('admin relationship API calls', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedRequest.mockReset();
  });

  it('patches senior profiles', async () => {
    mockedRequest.mockResolvedValueOnce({
      data: {
        id: 's1',
        user_id: 'u1',
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1940-01-01',
        address: 'New',
        emergency_contact: '911',
        email: 'john@example.com',
        phone: '111',
        account_status: 'ACTIVE',
      },
    } as never);
    const senior = await updateAdminSenior('s1', { address: 'New' });
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'patch', url: '/seniors/s1', data: { address: 'New' } }),
    );
    expect(senior.address).toBe('New');
  });

  it('fetches and updates family profiles', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        id: 'f1',
        user_id: 'fu',
        first_name: 'Son',
        last_name: 'Doe',
        relationship: 'Son',
        requested_senior_reference: null,
        created_at: null,
        updated_at: null,
      },
    } as never);
    const family = await fetchAdminFamily('f1');
    expect(family.id).toBe('f1');

    mockedRequest.mockResolvedValueOnce({
      data: {
        id: 'f1',
        user_id: 'fu',
        first_name: 'Son',
        last_name: 'Doe',
        relationship: 'Daughter',
        requested_senior_reference: null,
        created_at: null,
        updated_at: null,
      },
    } as never);
    const updated = await updateAdminFamily('f1', { relationship: 'Daughter' });
    expect(updated.relationship).toBe('Daughter');
  });

  it('lists visits filtered by care manager', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { items: [], total: 0, limit: 20, offset: 0 },
    } as never);
    await fetchAdminVisits({ limit: 20, offset: 0, careManagerId: 'cm-1' });
    expect(mockedGet).toHaveBeenCalledWith(
      '/visits/',
      expect.objectContaining({ params: expect.objectContaining({ care_manager_id: 'cm-1' }) }),
    );
  });

  it('creates visits with senior and care associate', async () => {
    mockedRequest.mockResolvedValueOnce({
      data: {
        id: 'v1',
        senior_id: 's1',
        care_manager_id: 'cm1',
        status: 'SCHEDULED',
        notes: null,
        scheduled_at: null,
        employee_id: 'CA1',
        care_manager_name: 'Rohit',
      },
    } as never);
    const visit = await createAdminVisit({ seniorId: 's1', careManagerId: 'cm1', status: 'SCHEDULED' });
    expect(visit.careManagerId).toBe('cm1');
  });

  it('grants access and updates account status without role', async () => {
    mockedRequest.mockResolvedValueOnce({
      data: {
        id: 'a1',
        family_id: 'f1',
        senior_id: 's1',
        created_at: null,
        family_name: 'Family',
        senior_name: 'Senior',
      },
    } as never);
    const access = await grantAdminAccess('f1', 's1');
    expect(access.familyId).toBe('f1');

    mockedRequest.mockResolvedValueOnce({
      data: {
        id: 'u1',
        email: 'a@example.com',
        phone: '1',
        role: 'FAMILY',
        account_status: 'DISABLED',
        created_at: null,
        updated_at: null,
      },
    } as never);
    const user = await updateAdminUser('u1', { accountStatus: 'DISABLED' });
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({ data: { account_status: 'DISABLED' } }),
    );
    expect(user.accountStatus).toBe('DISABLED');
  });

  it('deletes people records through staff endpoints', async () => {
    mockedRequest.mockResolvedValueOnce({
      data: {
        id: 'u1',
        email: 'a@example.com',
        phone: '1',
        role: 'FAMILY',
        account_status: 'ACTIVE',
        created_at: null,
        updated_at: null,
      },
    } as never);
    await deleteAdminUser('u1');
    expect(mockedRequest).toHaveBeenCalledWith({ method: 'delete', url: '/users/u1', data: undefined });

    mockedRequest.mockResolvedValueOnce({
      data: {
        id: 's1',
        user_id: 'u1',
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1940-01-01',
        address: 'Home',
        emergency_contact: '911',
        email: 'john@example.com',
        phone: '111',
        account_status: 'ACTIVE',
      },
    } as never);
    await deleteAdminSenior('s1');
    expect(mockedRequest).toHaveBeenCalledWith({ method: 'delete', url: '/seniors/s1', data: undefined });

    mockedRequest.mockResolvedValueOnce({
      data: {
        id: 'f1',
        user_id: 'fu',
        first_name: 'Son',
        last_name: 'Doe',
        relationship: 'Son',
        requested_senior_reference: null,
        created_at: null,
        updated_at: null,
      },
    } as never);
    await deleteAdminFamily('f1');
    expect(mockedRequest).toHaveBeenCalledWith({ method: 'delete', url: '/families/f1', data: undefined });

    mockedRequest.mockResolvedValueOnce({
      data: {
        id: 'cm-1',
        user_id: 'u-cm',
        employee_id: 'CM01',
        first_name: 'Rohit',
        last_name: 'Sharma',
        skills: 'Nursing',
        status: 'ACTIVE',
      },
    } as never);
    await deleteAdminCareManager('cm-1');
    expect(mockedRequest).toHaveBeenCalledWith({ method: 'delete', url: '/care/cm-1', data: undefined });
  });

  it('uses family detail query key', () => {
    expect(adminQueryKeys.family('f1')).toEqual(['admin', 'families', 'f1']);
  });

  it('resolves senior profile by login user id for assignment UI', () => {
    const seniors = [
      toAdminSenior({
        id: 's1',
        user_id: '2235c91a-8012-4c44-c5d3-1d3d056cf99a',
        first_name: 'Akila',
        last_name: 'S',
        date_of_birth: '1950-01-01',
        address: 'Home',
        emergency_contact: '911',
        email: 'akila@gmail.com',
        phone: '908900809',
        account_status: 'ACTIVE',
      }),
    ];
    const match = seniors.find((item) => item.userId === '2235c91a-8012-4c44-c5d3-1d3d056cf99a');
    expect(match?.id).toBe('s1');
    expect(match?.email).toBe('akila@gmail.com');
  });
});
