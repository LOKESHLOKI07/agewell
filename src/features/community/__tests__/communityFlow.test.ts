import { apiClient } from '@/api/client';
import { ApiError } from '@/api/errors';
import { queryClient } from '@/api/queryClient';
import { FAMILY_FORBIDDEN_MESSAGE } from '@/features/family/selectors';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import {
  cancelRegistration,
  createCommunityEvent,
  deleteCommunityEvent,
  fetchCommunityEvent,
  fetchCommunityEvents,
  fetchCommunityRegistrations,
  registerForEvent,
  updateCommunityEvent,
} from '../api';
import {
  toCancelRegistrationBody,
  toCommunityEvent,
  toCommunityEventCreateBody,
  toCommunityEvents,
  toRegisterBody,
} from '../mappers';
import { communityQueryKeys, invalidateCommunityQueries } from '../queryKeys';
import { communityEventFormSchema } from '../schemas';
import {
  activeRegistrationForEvent,
  adminCommunityCreateHref,
  adminCommunityHref,
  canUseCommunity,
  capacityLabel,
  communityEventHref,
  eventDateForRegistration,
  familyCommunityEventHref,
  formatEventDate,
  getCommunityErrorMessage,
  isAuthorizedFamilySenior,
  registrationsForUser,
  toEventDateIso,
} from '../selectors';

jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockedPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
const mockedPatch = apiClient.patch as jest.MockedFunction<typeof apiClient.patch>;
const mockedDelete = apiClient.delete as jest.MockedFunction<typeof apiClient.delete>;

const eventPayload = {
  id: 'c8ff5842-ee8a-40bb-b82a-98e4227bdf52',
  title: 'Bingo',
  description: 'Fun',
  event_date: '2026-08-19T23:47:08.196599Z',
  capacity: 20,
  location: 'should-not-map',
  image_url: 'https://example.com/yoga.png',
};

const registrationPayload = {
  id: 'reg-1',
  event_id: eventPayload.id,
  user_id: 'senior-user',
  status: 'REGISTERED',
  event_title: 'Bingo',
};

const listPage = {
  items: [eventPayload],
  total: 1,
  limit: 50,
  offset: 0,
};

describe('community routing', () => {
  it('routes Senior, Family, and Admin community screens', () => {
    expect(communityEventHref('evt-1')).toEqual({ pathname: '/community/events/[id]', params: { id: 'evt-1' } });
    expect(familyCommunityEventHref('evt-1')).toEqual({
      pathname: '/family/community/events/[id]',
      params: { id: 'evt-1' },
    });
    expect(adminCommunityHref('evt-1')).toBe('/(admin)/community/evt-1');
    expect(adminCommunityCreateHref()).toBe('/(admin)/community/new');
  });

  it('keeps Community unavailable for Care Manager', () => {
    expect(canUseCommunity('SENIOR')).toBe(true);
    expect(canUseCommunity('FAMILY')).toBe(true);
    expect(canUseCommunity('ADMIN')).toBe(true);
    expect(canUseCommunity('OPERATIONS')).toBe(true);
    expect(canUseCommunity('CARE_MANAGER')).toBe(false);
  });
});

describe('community events', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedPatch.mockReset();
    mockedDelete.mockReset();
  });

  it('loads community events from GET /community/', async () => {
    mockedGet.mockResolvedValueOnce({ data: listPage } as never);
    const page = await fetchCommunityEvents();
    expect(page.items[0].title).toBe('Bingo');
    expect(page.items[0].capacity).toBe(20);
    expect(page.items[0]).not.toHaveProperty('location');
    expect(page.items[0]).not.toHaveProperty('imageUrl');
    expect(mockedGet).toHaveBeenCalledWith('/community/');
  });

  it('loads event detail from GET /community/{id}', async () => {
    mockedGet.mockResolvedValueOnce({ data: eventPayload } as never);
    const event = await fetchCommunityEvent(eventPayload.id);
    expect(event.description).toBe('Fun');
    expect(event).not.toHaveProperty('category');
    expect(event).not.toHaveProperty('whatToExpect');
    expect(mockedGet).toHaveBeenCalledWith(`/community/${eventPayload.id}`);
  });

  it('maps FastAPI event fields without invented extras', () => {
    const mapped = toCommunityEvent(eventPayload);
    expect(mapped).toEqual({
      id: eventPayload.id,
      title: 'Bingo',
      description: 'Fun',
      eventDate: eventPayload.event_date,
      capacity: 20,
    });
    expect(Object.keys(mapped).sort()).toEqual(['capacity', 'description', 'eventDate', 'id', 'title']);
  });

  it('does not use mock Yoga, Technology Workshop, or trip data', () => {
    const titles = toCommunityEvents(listPage).items.map((item) => item.title);
    expect(titles).toEqual(['Bingo']);
    expect(titles.join(' ')).not.toMatch(/Yoga|Technology Workshop|Botanical Gardens/i);
    expect(communityEventFormSchema.shape).not.toHaveProperty('location');
    expect(communityEventFormSchema.shape).not.toHaveProperty('imageUrl');
    expect(communityEventFormSchema.shape).not.toHaveProperty('tripType');
  });
});

describe('community registration', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedPatch.mockReset();
  });

  it('registers a senior with an empty body and no user_id', async () => {
    mockedPost.mockResolvedValueOnce({ data: registrationPayload } as never);
    const result = await registerForEvent(eventPayload.id);
    expect(result.status).toBe('REGISTERED');
    expect(mockedPost).toHaveBeenCalledWith(`/community/${eventPayload.id}/register`, {});
    expect(toRegisterBody()).toEqual({});
    expect(toRegisterBody()).not.toHaveProperty('user_id');
  });

  it('registers an authorized family senior with senior_id only', async () => {
    mockedPost.mockResolvedValueOnce({ data: registrationPayload } as never);
    await registerForEvent(eventPayload.id, 'senior-a');
    expect(mockedPost).toHaveBeenCalledWith(`/community/${eventPayload.id}/register`, { senior_id: 'senior-a' });
    expect(toRegisterBody('senior-a')).toEqual({ senior_id: 'senior-a' });
    expect(toRegisterBody('senior-a')).not.toHaveProperty('user_id');
  });

  it('selects only authorized family seniors', () => {
    const seniors = [
      { id: 'john', userId: 'u1', firstName: 'John', lastName: 'Doe', dateOfBirth: '1940-01-01', address: '1', emergencyContact: '911' },
    ];
    expect(isAuthorizedFamilySenior(seniors, 'john')).toBe(true);
    expect(isAuthorizedFamilySenior(seniors, 'jane')).toBe(false);
  });

  it('returns 409 for duplicate registration', async () => {
    mockedPost.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 409, data: { detail: 'Registration already exists' } },
    });
    await expect(registerForEvent(eventPayload.id)).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      message: 'You are already registered for this event.',
    });
  });

  it('returns 409 when capacity is reached', async () => {
    mockedPost.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 409, data: { detail: 'Event is at capacity' } },
    });
    await expect(registerForEvent(eventPayload.id)).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      message: 'This event is at capacity.',
    });
  });

  it('cancels with PATCH status CANCELLED only', async () => {
    mockedPatch.mockResolvedValueOnce({ data: { ...registrationPayload, status: 'CANCELLED' } } as never);
    const result = await cancelRegistration('reg-1');
    expect(result.status).toBe('CANCELLED');
    expect(mockedPatch).toHaveBeenCalledWith('/community/registrations/reg-1', toCancelRegistrationBody());
    expect(toCancelRegistrationBody()).toEqual({ status: 'CANCELLED' });
  });

  it('loads registrations and keeps family rows scoped to the selected senior', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        items: [registrationPayload, { ...registrationPayload, id: 'reg-2', user_id: 'other-user', event_title: 'Bingo' }],
        total: 2,
        limit: 50,
        offset: 0,
      },
    } as never);
    const page = await fetchCommunityRegistrations();
    expect(mockedGet).toHaveBeenCalledWith('/community/registrations');
    expect(registrationsForUser(page.items, 'senior-user').map((item) => item.id)).toEqual(['reg-1']);
    expect(activeRegistrationForEvent(page.items, eventPayload.id, 'senior-user')?.id).toBe('reg-1');
    expect(eventDateForRegistration(page.items[0], [toCommunityEvent(eventPayload)])).toBe(eventPayload.event_date);
  });

  it('surfaces family unauthorized senior as 403 with the family copy', async () => {
    mockedPost.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 403, data: { detail: 'forbidden' } },
    });
    await expect(registerForEvent(eventPayload.id, 'jane')).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
      message: FAMILY_FORBIDDEN_MESSAGE,
    });
    expect(getCommunityErrorMessage(new ApiError('x', 403))).toBe(FAMILY_FORBIDDEN_MESSAGE);
  });
});

describe('admin community management', () => {
  beforeEach(() => {
    mockedPost.mockReset();
    mockedPatch.mockReset();
    mockedDelete.mockReset();
  });

  it('creates an event with only supported fields', async () => {
    mockedPost.mockResolvedValueOnce({ data: eventPayload } as never);
    const created = await createCommunityEvent({
      title: 'Bingo',
      description: 'Fun',
      eventDate: toEventDateIso('2026-08-20', '17:00'),
      capacity: 20,
    });
    expect(created.title).toBe('Bingo');
    expect(mockedPost).toHaveBeenCalledWith(
      '/community/',
      toCommunityEventCreateBody({
        title: 'Bingo',
        description: 'Fun',
        eventDate: '2026-08-20T17:00:00+05:30',
        capacity: 20,
      }),
    );
    expect(toCommunityEventCreateBody({
      title: 'Bingo',
      description: 'Fun',
      eventDate: '2026-08-20T17:00:00+05:30',
      capacity: 20,
    })).not.toHaveProperty('location');
  });

  it('edits an event with PATCH of existing fields only', async () => {
    mockedPatch.mockResolvedValueOnce({ data: { ...eventPayload, title: 'Evening Bingo' } } as never);
    const updated = await updateCommunityEvent(eventPayload.id, { title: 'Evening Bingo' });
    expect(updated.title).toBe('Evening Bingo');
    expect(mockedPatch).toHaveBeenCalledWith(`/community/${eventPayload.id}`, { title: 'Evening Bingo' });
  });

  it('deletes an event', async () => {
    mockedDelete.mockResolvedValueOnce({ data: eventPayload } as never);
    await deleteCommunityEvent(eventPayload.id);
    expect(mockedDelete).toHaveBeenCalledWith(`/community/${eventPayload.id}`);
  });
});

describe('community query keys and states', () => {
  it('uses the documented React Query keys and invalidates the community family', async () => {
    expect(communityQueryKeys.events).toEqual(['community', 'events']);
    expect(communityQueryKeys.event('evt-1')).toEqual(['community', 'event', 'evt-1']);
    expect(communityQueryKeys.registrations).toEqual(['community', 'registrations']);
    expect(communityQueryKeys.eventRegistration('evt-1')).toEqual(['community', 'event', 'evt-1', 'registration']);
    const spy = jest.spyOn(queryClient, 'invalidateQueries');
    await invalidateCommunityQueries();
    expect(spy).toHaveBeenCalledWith({ queryKey: ['community'] });
    spy.mockRestore();
  });

  it('exposes loading and empty states', () => {
    expect(getSectionState({ isPending: true, isError: false, isEmpty: true })).toBe('loading');
    expect(getSectionState({ isPending: false, isError: false, isEmpty: true })).toBe('empty');
    expect(getSectionState({ isPending: false, isError: false, isEmpty: false })).toBe('ready');
    expect(capacityLabel(20)).toBe('Capacity: 20');
    expect(capacityLabel(null)).toBe('No capacity limit');
    expect(formatEventDate('2026-08-20T17:00:00+05:30')).toContain('2026');
  });
});

describe('community API errors', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('maps 401, 403, 404, 409, 422, and network errors', async () => {
    mockedGet.mockRejectedValueOnce({ isAxiosError: true, response: { status: 401, data: {} } });
    await expect(fetchCommunityEvents()).rejects.toMatchObject({ name: 'ApiError', status: 401 });

    mockedGet.mockRejectedValueOnce({ isAxiosError: true, response: { status: 403, data: {} } });
    await expect(fetchCommunityEvents()).rejects.toMatchObject({ name: 'ApiError', status: 403 });

    mockedGet.mockRejectedValueOnce({ isAxiosError: true, response: { status: 404, data: {} } });
    await expect(fetchCommunityEvent('missing')).rejects.toMatchObject({ name: 'ApiError', status: 404 });

    mockedPost.mockRejectedValueOnce({ isAxiosError: true, response: { status: 409, data: { detail: 'Registration already exists' } } });
    await expect(registerForEvent('evt-1')).rejects.toMatchObject({ name: 'ApiError', status: 409 });

    mockedPost.mockRejectedValueOnce({ isAxiosError: true, response: { status: 422, data: { detail: 'raw' } } });
    await expect(registerForEvent('evt-1')).rejects.toMatchObject({ name: 'ApiError', status: 422 });

    mockedGet.mockRejectedValueOnce({ isAxiosError: true, code: 'ERR_NETWORK', message: 'Network Error' });
    await expect(fetchCommunityEvents()).rejects.toBeInstanceOf(ApiError);
  });
});
