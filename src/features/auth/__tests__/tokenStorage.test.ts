import * as SecureStore from 'expo-secure-store';
import { clearTokens, getAccessToken, loadTokens, resetTokenMemory, saveTokens } from '../tokenStorage';

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

describe('tokenStorage', () => {
  beforeEach(async () => {
    resetTokenMemory();
    await clearTokens();
    jest.clearAllMocks();
    (SecureStore.isAvailableAsync as jest.Mock).mockResolvedValue(true);
  });

  it('saves access and refresh tokens in SecureStore', async () => {
    await saveTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('agewell.access_token', 'access-1');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('agewell.refresh_token', 'refresh-1');
    expect(getAccessToken()).toBe('access-1');
  });

  it('restores a saved session', async () => {
    await saveTokens({ accessToken: 'access-2', refreshToken: 'refresh-2' });
    resetTokenMemory();

    await expect(loadTokens()).resolves.toEqual({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
    });
  });

  it('clears tokens from SecureStore on logout', async () => {
    await saveTokens({ accessToken: 'access-3', refreshToken: 'refresh-3' });
    await clearTokens();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('agewell.access_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('agewell.refresh_token');
    expect(getAccessToken()).toBeNull();
    await expect(loadTokens()).resolves.toBeNull();
  });

  it('falls back to localStorage when SecureStore is unavailable (web reload)', async () => {
    const store = new Map<string, string>();
    const localStorageMock = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      configurable: true,
    });

    (SecureStore.isAvailableAsync as jest.Mock).mockResolvedValue(false);
    resetTokenMemory();

    await saveTokens({ accessToken: 'web-access', refreshToken: 'web-refresh' });
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(store.get('agewell.access_token')).toBe('web-access');

    resetTokenMemory();
    await expect(loadTokens()).resolves.toEqual({
      accessToken: 'web-access',
      refreshToken: 'web-refresh',
    });

    await clearTokens();
    expect(store.has('agewell.access_token')).toBe(false);
    await expect(loadTokens()).resolves.toBeNull();
  });
});
