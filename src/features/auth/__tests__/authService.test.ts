import { createLoginFormData } from '../authService';
import { loginSchema, mobileLoginSchema } from '../schemas';

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

describe('mobileLoginSchema', () => {
  it('accepts a mobile number and password', () => {
    const parsed = mobileLoginSchema.parse({
      phone: '98765 43210',
      password: '9876543210',
    });
    expect(parsed.phone).toBe('98765 43210');
  });
});
