import { z } from 'zod';

export const bookAppointmentSchema = z.object({
  doctorId: z.string().trim().min(1, 'Choose a doctor'),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter the date as YYYY-MM-DD'),
  time: z.string().trim().regex(/^\d{2}:\d{2}$/, 'Enter the time as HH:MM'),
});

export type BookAppointmentFormValues = z.infer<typeof bookAppointmentSchema>;

export const rescheduleAppointmentSchema = z.object({
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter the date as YYYY-MM-DD'),
  time: z.string().trim().regex(/^\d{2}:\d{2}$/, 'Enter the time as HH:MM'),
});

export type RescheduleAppointmentFormValues = z.infer<typeof rescheduleAppointmentSchema>;
