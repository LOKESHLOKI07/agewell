import { z } from 'zod';

export const communityEventFormSchema = z.object({
  title: z.string().trim().min(1, 'Enter an event title'),
  description: z.string().trim(),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter the date as YYYY-MM-DD'),
  time: z.string().trim().regex(/^\d{2}:\d{2}$/, 'Enter the time as HH:MM'),
  capacity: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d+$/.test(value), 'Enter a whole number or leave blank'),
});

export type CommunityEventFormValues = z.infer<typeof communityEventFormSchema>;
