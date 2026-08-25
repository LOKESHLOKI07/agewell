import { apiClient } from '@/api/client';
import { ApiError } from '@/api/errors';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import {
  createEmergency,
  fetchEmergencyCase,
  fetchEmergencyCases,
  fetchEmergencyEvents,
} from '../api/emergencyApi';
import { findActiveEmergency, toEmergencyCase, toEmergencyCreateBody, toEmergencyEvent } from '../mappers';
import { emergencyQueryKeys } from '../queryKeys';
import {
  EMERGENCY_TYPE_OPTIONS,
  canSubmitEmergency,
  emergencyBannerCopy,
  emergencyBannerHref,
  emergencyDetailHref,
  emergencyHelpHref,
  emergencyStatusLabel,
  emergencyTypeLabel,
  getEmergencyCreateErrorMessage,
} from '../selectors';

jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockedGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockedPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

function jsonGet(data: unknown) {
  mockedGet.mockResolvedValueOnce({ data } as never);
}

const casePayload = {
  id: 'b7b95a6c-a1bb-4a7c-a1c1-5c6f3bdfccc1',
  senior_id: '0b3922d7-6ec2-4810-a259-58d0ec262f69',
  type: 'MEDICAL',
  status: 'OPEN',
  created_at: '2026-08-20T10:15:00.000Z',
};

describe('Emergency banner navigation', () => {
  it('sends Home to Emergency Help when there is no active case', () => {
    expect(emergencyHelpHref()).toBe('/emergency');
    expect(emergencyBannerHref(null)).toBe('/emergency');
    expect(emergencyBannerCopy(null)).toEqual({
      title: 'Emergency Help',
      subtitle: 'Press for immediate assistance',
      accessibilityLabel: 'Emergency Help. Press for immediate assistance',
    });
  });

  it('sends Home to the active case status when one exists', () => {
    const active = toEmergencyCase(casePayload);
    expect(emergencyBannerHref(active)).toEqual({
      pathname: '/emergency/[id]',
      params: { id: casePayload.id },
    });
    expect(emergencyBannerCopy(active).title).toBe('Emergency Assistance Active');
    expect(emergencyBannerCopy(active).subtitle).toBe('View Emergency Status');
  });
});

describe('Emergency type selection', () => {
  it('renders all supported emergency types', () => {
    expect(EMERGENCY_TYPE_OPTIONS.map((item) => item.type)).toEqual([
      'MEDICAL',
      'HOSPITAL',
      'CARE_MANAGER',
      'AGEWELL_SUPPORT',
    ]);
  });

  it('maps MEDICAL correctly', () => {
    expect(emergencyTypeLabel('MEDICAL')).toBe('Medical Emergency');
    expect(toEmergencyCreateBody('MEDICAL')).toEqual({ type: 'MEDICAL' });
  });

  it('maps HOSPITAL correctly', () => {
    expect(emergencyTypeLabel('HOSPITAL')).toBe('Hospital Assistance');
    expect(toEmergencyCreateBody('HOSPITAL')).toEqual({ type: 'HOSPITAL' });
  });

  it('maps CARE_MANAGER correctly', () => {
    expect(emergencyTypeLabel('CARE_MANAGER')).toBe('Care Manager Assistance');
    expect(toEmergencyCreateBody('CARE_MANAGER')).toEqual({ type: 'CARE_MANAGER' });
  });

  it('maps AGEWELL_SUPPORT correctly', () => {
    expect(emergencyTypeLabel('AGEWELL_SUPPORT')).toBe('AgeWell Support');
    expect(toEmergencyCreateBody('AGEWELL_SUPPORT')).toEqual({ type: 'AGEWELL_SUPPORT' });
  });
});

describe('confirmation and create payload', () => {
  beforeEach(() => {
    mockedPost.mockReset();
    mockedGet.mockReset();
  });

  it('uses a confirmation step before POST', () => {
    expect(emergencyTypeLabel('MEDICAL')).toBe('Medical Emergency');
    expect(canSubmitEmergency(false)).toBe(true);
  });

  it('does not create an API request on cancel', () => {
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('sends the exact EmergencyCreate payload without a client senior id', async () => {
    mockedPost.mockResolvedValueOnce({ data: casePayload } as never);
    const created = await createEmergency('MEDICAL');
    expect(created.id).toBe(casePayload.id);
    expect(mockedPost).toHaveBeenCalledWith('/emergency/', { type: 'MEDICAL' });
    expect(mockedPost.mock.calls[0][1]).not.toHaveProperty('senior_id');
  });

  it('prevents double submission while creating', () => {
    expect(canSubmitEmergency(true)).toBe(false);
    expect(canSubmitEmergency(false)).toBe(true);
  });

  it('navigates to detail after a successful create', () => {
    expect(emergencyDetailHref(casePayload.id)).toEqual({
      pathname: '/emergency/[id]',
      params: { id: casePayload.id },
    });
  });
});

describe('emergency detail and timeline', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('loads a real emergency case', async () => {
    jsonGet(casePayload);
    const detail = await fetchEmergencyCase(casePayload.id);
    expect(detail).toMatchObject({
      id: casePayload.id,
      seniorId: casePayload.senior_id,
      type: 'MEDICAL',
      status: 'OPEN',
    });
    expect(mockedGet).toHaveBeenCalledWith(`/emergency/${casePayload.id}`);
  });

  it('loads real emergency events', async () => {
    jsonGet({
      items: [
        {
          id: 'evt-1',
          case_id: casePayload.id,
          event_description: 'Emergency case created.',
          created_at: '2026-08-20T10:15:00.000Z',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });
    const events = await fetchEmergencyEvents(casePayload.id);
    expect(events.items[0].eventDescription).toBe('Emergency case created.');
    expect(mockedGet).toHaveBeenCalledWith(`/emergency/${casePayload.id}/events`);
  });

  it('maps backend statuses to senior-friendly labels', () => {
    expect(emergencyStatusLabel('OPEN')).toBe('Open');
    expect(emergencyStatusLabel('ACKNOWLEDGED')).toBe('Acknowledged');
    expect(emergencyStatusLabel('ASSIGNED')).toBe('Assigned');
    expect(emergencyStatusLabel('IN_PROGRESS')).toBe('Assistance in progress');
    expect(emergencyStatusLabel('RESOLVED')).toBe('Resolved');
    expect(emergencyStatusLabel('CANCELLED')).toBe('Cancelled');
  });
});

describe('emergency errors and safety', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('maps 401 through the shared error system', async () => {
    mockedGet.mockRejectedValueOnce({ isAxiosError: true, response: { status: 401, data: {} } });
    await expect(fetchEmergencyCases()).rejects.toMatchObject({ name: 'ApiError', status: 401 });
  });

  it('maps 403 through the shared error system', async () => {
    mockedGet.mockRejectedValueOnce({ isAxiosError: true, response: { status: 403, data: {} } });
    await expect(fetchEmergencyCase(casePayload.id)).rejects.toMatchObject({ name: 'ApiError', status: 403 });
  });

  it('maps 404 through the shared error system', async () => {
    mockedGet.mockRejectedValueOnce({ isAxiosError: true, response: { status: 404, data: {} } });
    await expect(fetchEmergencyEvents(casePayload.id)).rejects.toMatchObject({ name: 'ApiError', status: 404 });
  });

  it('maps 422 without exposing raw validation text', async () => {
    mockedPost.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 422, data: { detail: 'raw validation dump' } },
    });
    await expect(createEmergency('MEDICAL')).rejects.toMatchObject({ name: 'ApiError', status: 422 });
    expect(getEmergencyCreateErrorMessage(new ApiError('Please check the information you entered and try again.', 422))).toBe(
      'Please check the information you entered and try again.',
    );
  });

  it('maps network errors to a create-safe message', () => {
    expect(getEmergencyCreateErrorMessage(new ApiError('Unable to connect to AgeWell. Please check your internet connection.'))).toBe(
      'Unable to create emergency request. Please check your connection and try again.',
    );
  });

  it('does not use mock emergency data or hardcoded senior UUIDs in the create body', () => {
    expect(toEmergencyCreateBody('HOSPITAL')).toEqual({ type: 'HOSPITAL' });
    expect(JSON.stringify(toEmergencyCreateBody('HOSPITAL'))).not.toMatch(/0b3922d7/);
    expect(emergencyQueryKeys.list).toEqual(['emergency', 'list']);
    expect(emergencyQueryKeys.detail('abc')).toEqual(['emergency', 'abc']);
    expect(emergencyQueryKeys.events('abc')).toEqual(['emergency', 'abc', 'events']);
  });

  it('does not request GPS or claim dispatch', () => {
    const copy = JSON.stringify({
      options: EMERGENCY_TYPE_OPTIONS,
      labels: [emergencyStatusLabel('OPEN'), emergencyStatusLabel('IN_PROGRESS')],
    });
    expect(copy).not.toMatch(/gps|location permission|ambulance is on the way|emergency services have been contacted/i);
    expect(findActiveEmergency([toEmergencyCase(casePayload)])?.id).toBe(casePayload.id);
    expect(findActiveEmergency([toEmergencyCase({ ...casePayload, status: 'RESOLVED' })])).toBeNull();
    expect(getSectionState({ isPending: true, isError: false, isEmpty: true })).toBe('loading');
    expect(toEmergencyEvent({
      id: 'evt-1',
      case_id: casePayload.id,
      event_description: 'Emergency case created.',
      created_at: '2026-08-20T10:15:00.000Z',
    }).eventDescription).not.toMatch(/Ambulance dispatched/i);
  });
});
