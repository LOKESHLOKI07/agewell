import { useAuthStore } from '../authStore';
import { fetchCurrentUser, loginWithPassword, logoutAndClearLocal } from '../authService';
import { clearTokens, loadTokens } from '../tokenStorage';

jest.mock('../authService', () => ({
  fetchCurrentUser: jest.fn(),
  loginWithPassword: jest.fn(),
  loginWithTokens: jest.fn(),
  logoutAndClearLocal: jest.fn(),
}));

jest.mock('../tokenStorage', () => ({
  clearTokens: jest.fn(),
  loadTokens: jest.fn(),
}));

jest.mock('../authEntryPreference', () => ({
  hydrateReturnToSignIn: jest.fn(async () => undefined),
  markReturnToSignIn: jest.fn(async () => undefined),
}));

jest.mock('../serviceAreaPreference', () => ({
  hydrateServiceAreaAvailable: jest.fn(async () => undefined),
}));

jest.mock('../membershipPlanPreference', () => ({
  hydrateMembershipKind: jest.fn(async () => undefined),
}));

const mockedFetchCurrentUser = fetchCurrentUser as jest.MockedFunction<typeof fetchCurrentUser>;
const mockedLogin = loginWithPassword as jest.MockedFunction<typeof loginWithPassword>;
const mockedLogout = logoutAndClearLocal as jest.MockedFunction<typeof logoutAndClearLocal>;
const mockedLoadTokens = loadTokens as jest.MockedFunction<typeof loadTokens>;
const mockedClearTokens = clearTokens as jest.MockedFunction<typeof clearTokens>;

const user = {
  id: 'user-1',
  email: 'senior@example.com',
  phone: '111',
  role: 'SENIOR' as const,
  accountStatus: 'ACTIVE' as const,
  createdAt: '2026-08-20T00:00:00Z',
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'INITIALIZING', user: null, careStatus: null });
    jest.clearAllMocks();
  });

  it('starts in INITIALIZING and goes to Login when there is no session', async () => {
    mockedLoadTokens.mockResolvedValue(null);
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState()).toMatchObject({
      status: 'UNAUTHENTICATED',
      user: null,
    });
  });

  it('restores a valid session and stores the current user', async () => {
    mockedLoadTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
    mockedFetchCurrentUser.mockResolvedValue(user);

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState()).toMatchObject({
      status: 'AUTHENTICATED',
      user,
    });
  });

  it('logs the user out when session restore fails', async () => {
    mockedLoadTokens.mockResolvedValue({ accessToken: 'expired', refreshToken: 'bad' });
    mockedFetchCurrentUser.mockRejectedValue(new Error('Your session has expired. Please sign in again.'));

    await useAuthStore.getState().hydrate();

    expect(mockedClearTokens).toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({
      status: 'UNAUTHENTICATED',
      user: null,
    });
  });

  it('signs in and stores the current user', async () => {
    mockedLogin.mockResolvedValue(user);
    await useAuthStore.getState().signIn('senior@example.com', 'password123');
    expect(useAuthStore.getState()).toMatchObject({
      status: 'AUTHENTICATED',
      user,
    });
  });

  it('clears auth state on logout and remembers Sign in for next visit', async () => {
    const { markReturnToSignIn } = require('../authEntryPreference');
    useAuthStore.setState({ status: 'AUTHENTICATED', user });
    mockedLogout.mockResolvedValue(undefined);

    await useAuthStore.getState().signOut();

    expect(mockedLogout).toHaveBeenCalled();
    expect(markReturnToSignIn).toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({
      status: 'UNAUTHENTICATED',
      user: null,
    });
  });
});
