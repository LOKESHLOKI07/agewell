import { z } from 'zod';
import { DISPLAY_DATE_REGEX } from '@/utils/date';

export const registerAccountSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Enter a valid email'),
  phone: z.string().trim().min(8, 'Enter a valid phone number').max(20),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSeniorSchema = registerAccountSchema.extend({
  dateOfBirth: z.string().regex(DISPLAY_DATE_REGEX, 'Use DD-MM-YYYY'),
  address: z.string().trim().min(1, 'Address is required'),
  emergencyContact: z.string().trim().min(1, 'Emergency contact is required'),
  preferredLanguage: z.enum(['en', 'hi', 'mr']).optional(),
});

export const registerCareSchema = registerAccountSchema.extend({
  skills: z.string().trim().max(500).optional().or(z.literal('')),
  experience: z.string().trim().max(500).optional().or(z.literal('')),
  languages: z.string().trim().max(200).optional().or(z.literal('')),
  availability: z.string().trim().max(200).optional().or(z.literal('')),
});

export type RegisterSeniorValues = z.infer<typeof registerSeniorSchema>;
export type RegisterCareValues = z.infer<typeof registerCareSchema>;
