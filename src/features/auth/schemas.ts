import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

export const mobileLoginSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[+]?\d[\d\s-]{8,14}$/, 'Enter a valid mobile number'),
  password: z.string().min(1, 'Enter your password'),
});

export const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type MobileLoginFormValues = z.infer<typeof mobileLoginSchema>;
export type OtpFormValues = z.infer<typeof otpSchema>;
