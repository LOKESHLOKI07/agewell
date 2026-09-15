import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import { canUseRemotePush } from '../pushAvailability';

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('expo', () => ({
  isRunningInExpoGo: jest.fn(() => false),
}));

const mockedExpoGo = isRunningInExpoGo as jest.MockedFunction<typeof isRunningInExpoGo>;

describe('canUseRemotePush', () => {
  afterEach(() => {
    Platform.OS = 'ios';
    mockedExpoGo.mockReturnValue(false);
  });

  it('is unavailable on web', () => {
    Platform.OS = 'web';
    expect(canUseRemotePush()).toBe(false);
  });

  it('is unavailable in Android Expo Go', () => {
    Platform.OS = 'android';
    mockedExpoGo.mockReturnValue(true);
    expect(canUseRemotePush()).toBe(false);
  });

  it('is available in an Android development build', () => {
    Platform.OS = 'android';
    mockedExpoGo.mockReturnValue(false);
    expect(canUseRemotePush()).toBe(true);
  });

  it('is available in iOS Expo Go', () => {
    Platform.OS = 'ios';
    mockedExpoGo.mockReturnValue(true);
    expect(canUseRemotePush()).toBe(true);
  });
});
