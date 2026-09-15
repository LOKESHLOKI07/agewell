import * as Location from 'expo-location';
import {
  LOCATION_ISSUE_COPY,
  getOnboardingLocationDraft,
  onboardingLocationApiFields,
  requestOnboardingLocation,
  setOnboardingGps,
  setOnboardingManualLocation,
} from '../onboardingLocation';

const hasServicesEnabledAsync = Location.hasServicesEnabledAsync as jest.MockedFunction<
  typeof Location.hasServicesEnabledAsync
>;
const requestForegroundPermissionsAsync = Location.requestForegroundPermissionsAsync as jest.MockedFunction<
  typeof Location.requestForegroundPermissionsAsync
>;
const getCurrentPositionAsync = Location.getCurrentPositionAsync as jest.MockedFunction<
  typeof Location.getCurrentPositionAsync
>;
const getLastKnownPositionAsync = Location.getLastKnownPositionAsync as jest.MockedFunction<
  typeof Location.getLastKnownPositionAsync
>;
const enableNetworkProviderAsync = Location.enableNetworkProviderAsync as jest.MockedFunction<
  typeof Location.enableNetworkProviderAsync
>;

describe('onboarding location draft', () => {
  it('stores GPS for registration / account sync', () => {
    setOnboardingGps(19.205, 72.852);
    expect(getOnboardingLocationDraft()).toMatchObject({
      source: 'gps',
      latitude: 19.205,
      longitude: 72.852,
      query: null,
    });
    expect(onboardingLocationApiFields()).toEqual({
      locationLat: 19.205,
      locationLng: 72.852,
      locationQuery: null,
      locationSource: 'gps',
    });
  });

  it('stores manually typed place for registration / account sync', () => {
    setOnboardingManualLocation('  Kandivali West  ');
    expect(getOnboardingLocationDraft()).toMatchObject({
      source: 'manual',
      latitude: null,
      longitude: null,
      query: 'Kandivali West',
    });
    expect(onboardingLocationApiFields()).toEqual({
      locationLat: null,
      locationLng: null,
      locationQuery: 'Kandivali West',
      locationSource: 'manual',
    });
  });
});

describe('requestOnboardingLocation', () => {
  beforeEach(() => {
    hasServicesEnabledAsync.mockReset();
    requestForegroundPermissionsAsync.mockReset();
    getCurrentPositionAsync.mockReset();
    getLastKnownPositionAsync.mockReset();
    enableNetworkProviderAsync.mockReset();
    hasServicesEnabledAsync.mockResolvedValue(true);
    enableNetworkProviderAsync.mockResolvedValue(undefined);
    requestForegroundPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
    } as never);
    getLastKnownPositionAsync.mockResolvedValue(null);
  });

  it('returns GPS coordinates when a fix is available', async () => {
    getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 19.21, longitude: 72.85 },
      timestamp: 1,
    } as never);

    await expect(requestOnboardingLocation()).resolves.toEqual({
      ok: true,
      latitude: 19.21,
      longitude: 72.85,
    });
  });

  it('returns unavailable when the user does not turn Location on', async () => {
    hasServicesEnabledAsync.mockResolvedValue(false);
    enableNetworkProviderAsync.mockRejectedValue(new Error('declined'));
    await expect(requestOnboardingLocation()).resolves.toEqual({ ok: false, reason: 'unavailable' });
    expect(enableNetworkProviderAsync).toHaveBeenCalled();
  });

  it('turns Location on via the system prompt then reads GPS', async () => {
    hasServicesEnabledAsync.mockResolvedValueOnce(false).mockResolvedValue(true);
    getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 19.21, longitude: 72.85 },
      timestamp: 1,
    } as never);

    await expect(requestOnboardingLocation()).resolves.toEqual({
      ok: true,
      latitude: 19.21,
      longitude: 72.85,
    });
    expect(enableNetworkProviderAsync).toHaveBeenCalled();
  });

  it('returns denied when the user can be asked again', async () => {
    requestForegroundPermissionsAsync.mockResolvedValue({
      status: 'denied',
      granted: false,
      canAskAgain: true,
    } as never);
    await expect(requestOnboardingLocation()).resolves.toEqual({ ok: false, reason: 'denied' });
  });

  it('returns blocked when permission cannot be asked again', async () => {
    requestForegroundPermissionsAsync.mockResolvedValue({
      status: 'denied',
      granted: false,
      canAskAgain: false,
    } as never);
    await expect(requestOnboardingLocation()).resolves.toEqual({ ok: false, reason: 'blocked' });
  });

  it('returns no_fix instead of 0,0 when GPS fails after permission is granted', async () => {
    getCurrentPositionAsync.mockRejectedValue(new Error('gps'));
    getLastKnownPositionAsync.mockResolvedValue(null);
    await expect(requestOnboardingLocation()).resolves.toEqual({ ok: false, reason: 'no_fix' });
  });

  it('returns coarse when Android granted only approximate location and GPS fails', async () => {
    requestForegroundPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
      android: { accuracy: 'coarse' },
    } as never);
    getCurrentPositionAsync.mockRejectedValue(new Error('gps'));
    getLastKnownPositionAsync.mockResolvedValue(null);
    await expect(requestOnboardingLocation()).resolves.toEqual({ ok: false, reason: 'coarse' });
  });

  it('has actionable copy for each failure reason', () => {
    expect(LOCATION_ISSUE_COPY.no_fix.title).toMatch(/detect/i);
    expect(LOCATION_ISSUE_COPY.no_fix.message).toMatch(/Precise location/i);
    expect(LOCATION_ISSUE_COPY.unavailable.openSettings).toBe(true);
    expect(LOCATION_ISSUE_COPY.denied.openSettings).toBe(false);
  });
});
