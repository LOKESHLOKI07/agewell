import { toAuthUser } from '../authTypes';

describe('toAuthUser', () => {
  const payload = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'senior@example.com',
    phone: '111',
    role: 'SENIOR',
    created_at: '2026-08-20T00:00:00Z',
    hashed_password: 'should-never-be-copied',
    refresh_token: 'should-never-be-copied',
  };

  it('keeps safe profile fields and role', () => {
    expect(toAuthUser(payload)).toEqual({
      id: payload.id,
      email: payload.email,
      phone: payload.phone,
      role: 'SENIOR',
      createdAt: payload.created_at,
    });
  });

  it('never copies password hashes or tokens', () => {
    const user = toAuthUser(payload) as unknown as Record<string, unknown>;
    expect(user.hashed_password).toBeUndefined();
    expect(user.refresh_token).toBeUndefined();
    expect(user.access_token).toBeUndefined();
  });

  it('rejects unknown roles', () => {
    expect(() => toAuthUser({ ...payload, role: 'SUPERUSER' })).toThrow('Invalid user profile');
  });
});
