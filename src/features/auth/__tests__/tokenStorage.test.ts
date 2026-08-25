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
});
