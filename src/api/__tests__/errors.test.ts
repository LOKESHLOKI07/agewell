import { getApiErrorMessage } from '../errors';

function axiosError(status?: number, extras: Record<string, unknown> = {}) {
  return {
    isAxiosError: true,
    response: status ? { status, data: extras.data } : undefined,
    ...extras,
  };
}

describe('getApiErrorMessage', () => {
  it('maps 401 to a session expiry message', () => {
    expect(getApiErrorMessage(axiosError(401))).toBe('Your session has expired. Please sign in again.');
  });

  it('maps login 401 to an incorrect credentials message', () => {
    expect(getApiErrorMessage(axiosError(401), 'login')).toBe('Incorrect email or password.');
  });

  it('maps 403 to a permission message', () => {
    expect(getApiErrorMessage(axiosError(403))).toBe(
      "You don't have permission to access this information.",
    );
  });

  it('maps admin 403 to an area permission message', () => {
    expect(getApiErrorMessage(axiosError(403), 'admin')).toBe(
      "You don't have permission to access this area.",
    );
  });

  it('maps 409 to a conflict message', () => {
    expect(getApiErrorMessage(axiosError(409))).toBe('This record already exists.');
  });

  it('maps 400 and 422 without exposing backend details', () => {
    expect(getApiErrorMessage(axiosError(422, { data: { detail: 'raw validation dump' } }))).toBe(
      'Please check the information you entered and try again.',
    );
  });

  it('maps 404 and 500', () => {
    expect(getApiErrorMessage(axiosError(404))).toBe('We could not find that information.');
    expect(getApiErrorMessage(axiosError(500))).toBe(
      'AgeWell is having trouble right now. Please try again shortly.',
    );
  });

  it('maps network failures to a connection message', () => {
    expect(getApiErrorMessage(axiosError(undefined, { message: 'Network Error', code: 'ERR_NETWORK' }))).toBe(
      'Unable to connect to AgeWell. Please check your internet connection.',
    );
  });

  it('maps timeouts to a connection message', () => {
    expect(getApiErrorMessage(axiosError(undefined, { code: 'ECONNABORTED' }))).toBe(
      'Unable to connect to AgeWell. Please check your internet connection.',
    );
  });
});
