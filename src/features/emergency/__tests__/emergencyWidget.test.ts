import { createEmergency } from '../api/emergencyApi';
import { isFirstResponseFullyNotified, toEmergencyCase, toEmergencyCreateBody } from '../mappers';
import {
  EMERGENCY_WIDGET_COPY,
  EMERGENCY_WIDGET_HOLD_MS,
  EMERGENCY_WIDGET_NAME,
  EMERGENCY_WIDGET_PATH,
  EMERGENCY_WIDGET_TRIGGER,
  EMERGENCY_WIDGET_TYPE,
  EMERGENCY_WIDGET_URI,
  isEmergencyWidgetUrl,
  widgetPropsArePublic,
} from '../widget/widgetLink';
import { ApiError } from '@/api/errors';
import { getEmergencyCreateErrorMessage } from '../selectors';
import { apiClient } from '@/api/client';

jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockedPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

describe('AgeWell Emergency Widget', () => {
  it('identifies the widget deep link without exposing secrets', () => {
    expect(EMERGENCY_WIDGET_NAME).toBe('AgeWellEmergency');
    expect(EMERGENCY_WIDGET_PATH).toBe('/emergency/widget-sos');
    expect(EMERGENCY_WIDGET_URI).toBe('agewell://emergency/widget-sos');
    expect(isEmergencyWidgetUrl('agewell://emergency/widget-sos')).toBe(true);
    expect(isEmergencyWidgetUrl('agewell://emergency/widget-sos?source=android')).toBe(true);
    expect(isEmergencyWidgetUrl('agewell://(tabs)/sos')).toBe(false);
    expect(isEmergencyWidgetUrl(null)).toBe(false);
    expect(widgetPropsArePublic({ title: EMERGENCY_WIDGET_COPY.title })).toBe(true);
    expect(widgetPropsArePublic({ accessToken: 'secret' })).toBe(false);
    expect(widgetPropsArePublic({ password: 'x' })).toBe(false);
    expect(widgetPropsArePublic({ email: 'a@b.c' })).toBe(false);
  });

  it('uses a confirmation hold instead of a single widget tap', () => {
    expect(EMERGENCY_WIDGET_HOLD_MS).toBe(3000);
    expect(EMERGENCY_WIDGET_COPY.widgetAction).toBe('SOS');
    expect(EMERGENCY_WIDGET_COPY.widgetHint).toBe('Tap for Help');
    expect(EMERGENCY_WIDGET_COPY.action).toBe('GET HELP');
  });

  it('posts MEDICAL with HOME_PANIC_BUTTON and reads first_response', async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        id: 'case-1',
        senior_id: 'senior-1',
        type: 'MEDICAL',
        status: 'OPEN',
        created_at: '2026-09-10T10:00:00.000Z',
        trigger_source: 'HOME_PANIC_BUTTON',
        first_response: { family: 'SENT', companion: 'SENT' },
      },
    } as never);
    expect(toEmergencyCreateBody(EMERGENCY_WIDGET_TYPE, EMERGENCY_WIDGET_TRIGGER)).toEqual({
      type: 'MEDICAL',
      trigger_source: 'HOME_PANIC_BUTTON',
    });
    const created = await createEmergency(EMERGENCY_WIDGET_TYPE, EMERGENCY_WIDGET_TRIGGER);
    expect(created.triggerSource).toBe('HOME_PANIC_BUTTON');
    expect(created.firstResponse).toEqual({ family: 'SENT', companion: 'SENT' });
    expect(isFirstResponseFullyNotified(created)).toBe(true);
    expect(mockedPost).toHaveBeenCalledWith('/emergency/', {
      type: 'MEDICAL',
      trigger_source: 'HOME_PANIC_BUTTON',
    });
  });

  it('treats partial first_response as not fully notified', () => {
    const partial = toEmergencyCase({
      id: 'case-2',
      senior_id: 'senior-1',
      type: 'MEDICAL',
      status: 'OPEN',
      created_at: '2026-09-10T10:00:00.000Z',
      first_response: { family: 'SENT', companion: 'NO_CONTACT' },
    });
    expect(isFirstResponseFullyNotified(partial)).toBe(false);
  });

  it('handles duplicate active emergencies without bypassing authorization', () => {
    expect(getEmergencyCreateErrorMessage(new ApiError('An emergency request is already active. Open it from Emergency Support.', 409))).toBe(
      'An emergency request is already active. Open it from Emergency Support.',
    );
  });

  it('handles API failure without leaking backend dumps', () => {
    expect(
      getEmergencyCreateErrorMessage(new ApiError('Unable to connect to AgeWell. Please check your internet connection.')),
    ).toBe('Unable to create emergency request. Please check your connection and try again.');
    expect(getEmergencyCreateErrorMessage(new ApiError("You don't have permission to access this information.", 403))).toBe(
      "You don't have permission to access this information.",
    );
    expect(getEmergencyCreateErrorMessage(new ApiError('Your session has expired. Please sign in again.', 401))).toBe(
      'Your session has expired. Please sign in again.',
    );
  });
});
