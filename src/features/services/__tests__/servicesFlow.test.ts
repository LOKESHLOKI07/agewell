import { apiClient } from '@/api/client';
import { ApiError } from '@/api/errors';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';
import { toCreatedServiceRequest, toServiceRequestCreateBody } from '@/features/home/api/mappers';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { createServiceRequest } from '../api';
import {
  findServiceById,
  groupServicesByCategory,
  serviceDetailsHref,
  serviceRequestHref,
} from '../selectors';
import type { CatalogService } from '@/features/home/types/home';

jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockedPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

const physio: CatalogService = {
  id: 'ba4584f8-c9be-4ec1-b702-89148630d430',
  name: 'Physiotherapy',
  category: 'HEALTH',
  description: 'Test',
};

describe('services catalogue', () => {
  it('groups real API services by backend category and does not invent extras', () => {
    const groups = groupServicesByCategory([physio]);
    expect(groups).toEqual([
      {
        category: 'HEALTH',
        label: 'Health',
        services: [physio],
      },
    ]);
    expect(groups.flatMap((group) => group.services)).toHaveLength(1);
  });

  it('reports loading, error, and empty catalogue states', () => {
    expect(getSectionState({ isPending: true, isError: false, isEmpty: true })).toBe('loading');
    expect(getSectionState({ isPending: false, isError: true, isEmpty: true })).toBe('error');
    expect(getSectionState({ isPending: false, isError: false, isEmpty: true })).toBe('empty');
    expect(getSectionState({ isPending: false, isError: false, isEmpty: false })).toBe('ready');
  });

  it('finds service details from the API catalogue by real id', () => {
    expect(findServiceById([physio], physio.id)).toEqual(physio);
    expect(findServiceById([physio], 'svc-companion')).toBeNull();
  });

  it('passes the real service id to details and request routes', () => {
    expect(serviceDetailsHref(physio.id)).toEqual({
      pathname: '/services/[id]',
      params: { id: physio.id },
    });
    expect(serviceRequestHref(physio.id)).toEqual({
      pathname: '/services/[id]/request',
      params: { id: physio.id },
    });
  });
});

describe('create service request', () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it('posts the FastAPI payload senior_id and service_id', async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        id: 'req-2',
        senior_id: 'senior-1',
        service_id: physio.id,
        status: 'REQUESTED',
      },
    } as never);

    await expect(
      createServiceRequest({ seniorId: 'senior-1', serviceId: physio.id }),
    ).resolves.toEqual({
      id: 'req-2',
      seniorId: 'senior-1',
      serviceId: physio.id,
      status: 'REQUESTED',
    });

    expect(mockedPost).toHaveBeenCalledWith(
      '/services/requests',
      toServiceRequestCreateBody('senior-1', physio.id),
    );
    expect(toServiceRequestCreateBody('senior-1', physio.id)).toEqual({
      senior_id: 'senior-1',
      service_id: physio.id,
    });
  });

  it('maps a successful create response without invented date fields', () => {
    const created = toCreatedServiceRequest({
      id: 'req-2',
      senior_id: 'senior-1',
      service_id: physio.id,
      status: 'REQUESTED',
    });
    expect(created).not.toHaveProperty('scheduledAt');
    expect(created).not.toHaveProperty('createdAt');
    expect(created).not.toHaveProperty('preferredDate');
  });

  it('invalidates the shared serviceRequests query used by Home and history', () => {
    expect(homeQueryKeys.serviceRequests).toEqual(['serviceRequests']);
  });

  it('treats a newly created request as visible in history using API fields', () => {
    const history = [
      {
        id: 'req-1',
        seniorId: 'senior-1',
        serviceId: physio.id,
        serviceName: 'Physiotherapy',
        status: 'REQUESTED' as const,
      },
      {
        id: 'req-2',
        seniorId: 'senior-1',
        serviceId: physio.id,
        serviceName: 'Physiotherapy',
        status: 'REQUESTED' as const,
      },
    ];
    expect(history.map((item) => item.id)).toContain('req-2');
    expect(history[1]).not.toHaveProperty('scheduledAt');
  });

  it('handles 403 through the shared API error system', async () => {
    mockedPost.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 403, data: {} },
    });
    await expect(
      createServiceRequest({ seniorId: 'other-senior', serviceId: physio.id }),
    ).rejects.toMatchObject({ name: 'ApiError', status: 403 });
  });

  it('handles 422 through the shared API error system', async () => {
    mockedPost.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 422, data: { detail: 'raw' } },
    });
    await expect(
      createServiceRequest({ seniorId: 'not-a-uuid', serviceId: 'also-bad' }),
    ).rejects.toMatchObject({ name: 'ApiError', status: 422 });
  });

  it('handles network failure through the shared API error system', async () => {
    mockedPost.mockRejectedValueOnce({
      isAxiosError: true,
      code: 'ERR_NETWORK',
      message: 'Network Error',
    });
    await expect(
      createServiceRequest({ seniorId: 'senior-1', serviceId: physio.id }),
    ).rejects.toBeInstanceOf(ApiError);
    mockedPost.mockRejectedValueOnce({
      isAxiosError: true,
      code: 'ERR_NETWORK',
      message: 'Network Error',
    });
    await expect(
      createServiceRequest({ seniorId: 'senior-1', serviceId: physio.id }),
    ).rejects.toMatchObject({ message: 'Unable to connect to AgeWell. Please check your internet connection.' });
  });
});
