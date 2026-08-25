import { createLoginFormData } from '../authService';
import { loginSchema } from '../schemas';

describe('createLoginFormData', () => {
  it('sends OAuth2 username/password form fields', () => {
    const body = createLoginFormData('senior@example.com', 'password123');
    expect(body.get('username')).toBe('senior@example.com');
    expect(body.get('password')).toBe('password123');
    expect(body.get('email')).toBeNull();
  });
});

describe('loginSchema', () => {
  it('accepts a valid email and password', () => {
    const parsed = loginSchema.parse({
      email: 'senior@example.com',
      password: 'password123',
    });
    expect(parsed.email).toBe('senior@example.com');
  });

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({ email: 'senior@example.com', password: '' });
    expect(result.success).toBe(false);
  });
});
