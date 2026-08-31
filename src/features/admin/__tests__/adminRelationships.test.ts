import { toAdminSenior } from '../mappers';
import {
  createAdminVisit,
  deleteAdminCareManager,
  deleteAdminSenior,
  deleteAdminUser,
  fetchAdminVisits,
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
  it('maps enriched senior payloads', () => {
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

  it('updates account status without role', async () => {
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
