import * as Location from 'expo-location';
import { isUsableCoordinate, promptToEnableLocationServices, readDevicePosition } from '../deviceLocation';

const getCurrentPositionAsync = Location.getCurrentPositionAsync as jest.MockedFunction<
  typeof Location.getCurrentPositionAsync
>;
const getLastKnownPositionAsync = Location.getLastKnownPositionAsync as jest.MockedFunction<
  typeof Location.getLastKnownPositionAsync
>;
const enableNetworkProviderAsync = Location.enableNetworkProviderAsync as jest.MockedFunction<
  typeof Location.enableNetworkProviderAsync
>;
const hasServicesEnabledAsync = Location.hasServicesEnabledAsync as jest.MockedFunction<
  typeof Location.hasServicesEnabledAsync
>;

describe('device location', () => {
  beforeEach(() => {
    getCurrentPositionAsync.mockReset();
    getLastKnownPositionAsync.mockReset();
    enableNetworkProviderAsync.mockReset();
    hasServicesEnabledAsync.mockReset();
    enableNetworkProviderAsync.mockResolvedValue(undefined);
    hasServicesEnabledAsync.mockResolvedValue(true);
    getLastKnownPositionAsync.mockResolvedValue(null);
  });

  it('rejects 0,0 as unusable', () => {
    expect(isUsableCoordinate(0, 0)).toBe(false);
    expect(isUsableCoordinate(19.2, 72.85)).toBe(true);
  });

  it('returns a fresh GPS fix', async () => {
    getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 19.21, longitude: 72.85 },
      timestamp: 100,
    } as never);

    await expect(readDevicePosition()).resolves.toEqual({
      latitude: 19.21,
      longitude: 72.85,
      timestamp: 100,
    });
  });

  it('falls back to last known when a fresh fix fails', async () => {
    getCurrentPositionAsync.mockRejectedValue(new Error('gps'));
    getLastKnownPositionAsync.mockResolvedValue({
      coords: { latitude: 19.18, longitude: 72.84 },
      timestamp: 50,
    } as never);

    await expect(readDevicePosition()).resolves.toEqual({
      latitude: 19.18,
      longitude: 72.84,
      timestamp: 50,
    });
  });

  it('treats a 0,0 GPS result as a missed fix and uses last known', async () => {
    getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 0, longitude: 0 },
      timestamp: 1,
    } as never);
    getLastKnownPositionAsync.mockResolvedValue({
      coords: { latitude: 19.2, longitude: 72.83 },
      timestamp: 2,
    } as never);

    await expect(readDevicePosition()).resolves.toEqual({
      latitude: 19.2,
      longitude: 72.83,
      timestamp: 2,
    });
  });

  it('throws when neither a fresh nor last-known point is usable', async () => {
    getCurrentPositionAsync.mockRejectedValue(new Error('gps'));
    getLastKnownPositionAsync.mockResolvedValue(null);

    await expect(readDevicePosition()).rejects.toThrow('LOCATION_NO_FIX');
  });

  it('shows the system Location prompt when services are off, then reports on', async () => {
    hasServicesEnabledAsync.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    await expect(promptToEnableLocationServices()).resolves.toBe(true);
    expect(enableNetworkProviderAsync).toHaveBeenCalled();
  });

  it('returns false when the user declines the Location prompt', async () => {
    hasServicesEnabledAsync.mockResolvedValue(false);
    enableNetworkProviderAsync.mockRejectedValue(new Error('declined'));
    await expect(promptToEnableLocationServices()).resolves.toBe(false);
  });
});
