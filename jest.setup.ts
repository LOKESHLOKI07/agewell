process.env.EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

(globalThis as { __DEV__?: boolean }).__DEV__ = true;

jest.mock('expo-secure-store', () => {
  const memory = new Map<string, string>();
  return {
    isAvailableAsync: jest.fn(async () => true),
    getItemAsync: jest.fn(async (key: string) => memory.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      memory.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      memory.delete(key);
    }),
  };
});

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { hostUri: 'localhost:8081' },
    expoGoConfig: { debuggerHost: 'localhost:8081' },
  },
}));

jest.mock('expo-location', () => ({
  Accuracy: { Lowest: 1, Low: 2, Balanced: 3, High: 4, Highest: 5, BestForNavigation: 6 },
  hasServicesEnabledAsync: jest.fn(async () => true),
  getForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted', canAskAgain: true })),
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted', canAskAgain: true })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: { latitude: 12.9716, longitude: 77.5946 },
    timestamp: Date.now(),
  })),
  reverseGeocodeAsync: jest.fn(async () => [{ city: 'Bengaluru', district: null }]),
  geocodeAsync: jest.fn(async () => []),
  watchPositionAsync: jest.fn(async () => ({ remove: jest.fn() })),
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  function Mock(props: { children?: unknown }) {
    return React.createElement('MapView', props, props.children);
  }
  Mock.Animated = Mock;
  function Marker(props: { children?: unknown }) {
    return React.createElement('Marker', props, props.children);
  }
  Marker.Animated = Marker;
  return {
    __esModule: true,
    default: Mock,
    Marker,
    UrlTile: (props: { children?: unknown }) => React.createElement('UrlTile', props, props.children),
    Polyline: (props: { children?: unknown }) => React.createElement('Polyline', props, props.children),
    PROVIDER_GOOGLE: 'google',
    AnimatedRegion: class AnimatedRegion {
      latitude = 0;
      longitude = 0;
      constructor(value: { latitude: number; longitude: number }) {
        Object.assign(this, value);
      }
      setValue(value: { latitude: number; longitude: number }) {
        Object.assign(this, value);
      }
      timing() {
        return { start: (cb?: () => void) => cb?.() };
      }
    },
  };
});

jest.mock('react-native-webview', () => {
  const React = require('react');
  return {
    WebView: (props: { children?: unknown }) => React.createElement('WebView', props, props.children),
  };
});

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  warmUpAsync: jest.fn(),
  coolDownAsync: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'http://localhost:8081'),
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
  Prompt: { SelectAccount: 'select_account' },
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: { children?: unknown }) => React.createElement('DateTimePicker', props),
    DateTimePickerAndroid: { open: jest.fn(), dismiss: jest.fn() },
  };
});

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: null })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: null })),
}));

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///mock-docs/',
  copyAsync: jest.fn(async () => undefined),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
  isErrorWithCode: jest.fn(() => false),
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));


