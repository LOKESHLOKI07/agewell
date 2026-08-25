import { z } from 'zod';
import { DISPLAY_DATE_REGEX } from '@/utils/date';

export const bookAppointmentSchema = z.object({
  doctorId: z.string().trim().min(1, 'Choose a doctor'),
  date: z.string().trim().regex(DISPLAY_DATE_REGEX, 'Enter the date as DD-MM-YYYY'),
  time: z.string().trim().regex(/^\d{2}:\d{2}$/, 'Enter the time as HH:MM'),
});

export type BookAppointmentFormValues = z.infer<typeof bookAppointmentSchema>;

export const rescheduleAppointmentSchema = z.object({
  date: z.string().trim().regex(DISPLAY_DATE_REGEX, 'Enter the date as DD-MM-YYYY'),
  time: z.string().trim().regex(/^\d{2}:\d{2}$/, 'Enter the time as HH:MM'),
});

export type RescheduleAppointmentFormValues = z.infer<typeof rescheduleAppointmentSchema>;
