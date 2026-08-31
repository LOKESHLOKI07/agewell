import { apiClient } from '@/api/client';
import { signInWithGoogleCode, signInWithGoogleIdToken } from '../googleAuthApi';

jest.mock('@/api/client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

const mockedPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

const existingUser = {
  is_new: false,
  email: 'member@gmail.com',
  full_name: 'Lakshmi Sharma',
  access_token: 'access',
  refresh_token: 'refresh',
};

describe('googleAuthApi', () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it('maps an existing Google user from an Android id token', async () => {
    mockedPost.mockResolvedValue({ data: existingUser } as never);

    await expect(signInWithGoogleIdToken('google-id-token')).resolves.toEqual({
      isNew: false,
      email: 'member@gmail.com',
      fullName: 'Lakshmi Sharma',
      identityToken: null,
      accessToken: 'access',
      refreshToken: 'refresh',
    });
    expect(mockedPost).toHaveBeenCalledWith(
      '/auth/google',
      { id_token: 'google-id-token' },
      { skipAuth: true, timeout: 25000 },
    );
  });

  it('maps an existing Google user from an auth code', async () => {
    mockedPost.mockResolvedValue({ data: existingUser } as never);

    await expect(
      signInWithGoogleCode({
        code: 'google-code',
        redirectUri: 'http://localhost:8081',
        codeVerifier: 'a'.repeat(43),
      }),
    ).resolves.toEqual({
      isNew: false,
      email: 'member@gmail.com',
      fullName: 'Lakshmi Sharma',
      identityToken: null,
      accessToken: 'access',
      refreshToken: 'refresh',
    });
  });
});
