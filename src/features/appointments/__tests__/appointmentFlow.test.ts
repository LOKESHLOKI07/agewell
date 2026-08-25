import { apiClient } from '@/api/client';
import { ApiError } from '@/api/errors';
import { queryClient } from '@/api/queryClient';
import { toAppointment, toAppointmentCreateBody, toAppointmentUpdateBody } from '@/features/home/api/mappers';
import { createAppointment, fetchAppointment, updateAppointment } from '../api';
import { appointmentQueryKeys, invalidateAppointmentQueries } from '../queryKeys';
import { bookAppointmentSchema } from '../schemas';
import {
  APPOINTMENT_FILTER_STATUSES,
  adminAppointmentBookHref,
  adminAppointmentHref,
  canManageAppointment,
  familyAppointmentBookHref,
  familyAppointmentHref,
  findProviderById,
  healthAppointmentBookHref,
  healthAppointmentHref,
  providerLabel,
  toScheduledAtIso,
} from '../selectors';

jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockedGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockedPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
const mockedPatch = apiClient.patch as jest.MockedFunction<typeof apiClient.patch>;

const payload = {
  id: 'appt-1',
  senior_id: 'senior-1',
  doctor_id: 'doc-1',
  doctor_name: 'Dr. Smith',
  status: 'REQUESTED',
  scheduled_at: '2026-09-15T10:00:00+05:30',
};

describe('appointment booking contracts', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedPatch.mockReset();
  });

  it('posts only senior_id, doctor_id, and scheduled_at', async () => {
    mockedPost.mockResolvedValueOnce({ data: payload } as never);
    await expect(
      createAppointment({
        seniorId: 'senior-1',
        doctorId: 'doc-1',
        scheduledAt: toScheduledAtIso('2026-09-15', '10:00'),
      }),
    ).resolves.toEqual({
      id: 'appt-1',
      seniorId: 'senior-1',
      doctorId: 'doc-1',
      doctorName: 'Dr. Smith',
      status: 'REQUESTED',
      scheduledAt: '2026-09-15T10:00:00+05:30',
    });
    expect(mockedPost).toHaveBeenCalledWith(
      '/appointments/',
      toAppointmentCreateBody({
        seniorId: 'senior-1',
        doctorId: 'doc-1',
        scheduledAt: '2026-09-15T10:00:00+05:30',
      }),
    );
    expect(toAppointmentCreateBody({
      seniorId: 'senior-1',
      doctorId: 'doc-1',
      scheduledAt: '2026-09-15T10:00:00+05:30',
    })).toEqual({
      senior_id: 'senior-1',
      doctor_id: 'doc-1',
      scheduled_at: '2026-09-15T10:00:00+05:30',
    });
  });

  it('does not send hospital, notes, purpose, or location on create', () => {
    const body = toAppointmentCreateBody({
      seniorId: 'senior-1',
      doctorId: 'doc-1',
      scheduledAt: '2026-09-15T10:00:00+05:30',
    });
    expect(body).not.toHaveProperty('hospital');
    expect(body).not.toHaveProperty('notes');
    expect(body).not.toHaveProperty('purpose');
    expect(body).not.toHaveProperty('location');
    expect(body).not.toHaveProperty('status');
  });

  it('loads appointment detail from GET /appointments/{id}', async () => {
    mockedGet.mockResolvedValueOnce({ data: payload } as never);
    const result = await fetchAppointment('appt-1');
    expect(result.doctorName).toBe('Dr. Smith');
    expect(result).not.toHaveProperty('hospital');
    expect(mockedGet).toHaveBeenCalledWith('/appointments/appt-1');
  });

  it('cancels with PATCH status CANCELLED only', async () => {
    mockedPatch.mockResolvedValueOnce({ data: { ...payload, status: 'CANCELLED' } } as never);
    const result = await updateAppointment('appt-1', { status: 'CANCELLED' });
    expect(result.status).toBe('CANCELLED');
    expect(mockedPatch).toHaveBeenCalledWith('/appointments/appt-1', toAppointmentUpdateBody({ status: 'CANCELLED' }));
    expect(toAppointmentUpdateBody({ status: 'CANCELLED' })).toEqual({ status: 'CANCELLED' });
  });

  it('reschedules with PATCH scheduled_at only', async () => {
    mockedPatch.mockResolvedValueOnce({
      data: { ...payload, scheduled_at: '2026-09-20T14:30:00+05:30' },
    } as never);
    await updateAppointment('appt-1', { scheduledAt: toScheduledAtIso('2026-09-20', '14:30') });
    expect(mockedPatch).toHaveBeenCalledWith(
      '/appointments/appt-1',
      toAppointmentUpdateBody({ scheduledAt: '2026-09-20T14:30:00+05:30' }),
    );
  });

  it('maps FastAPI appointment fields without invented extras', () => {
    const mapped = toAppointment(payload);
    expect(mapped).toEqual({
      id: 'appt-1',
      seniorId: 'senior-1',
      doctorId: 'doc-1',
      doctorName: 'Dr. Smith',
      status: 'REQUESTED',
      scheduledAt: '2026-09-15T10:00:00+05:30',
    });
    expect(mapped).not.toHaveProperty('specialty');
    expect(mapped).not.toHaveProperty('hospital');
    expect(mapped).not.toHaveProperty('purpose');
  });

  it('treats requested and confirmed appointments as manageable', () => {
    expect(canManageAppointment('REQUESTED')).toBe(true);
    expect(canManageAppointment('CONFIRMED')).toBe(true);
    expect(canManageAppointment('COMPLETED')).toBe(false);
    expect(canManageAppointment('CANCELLED')).toBe(false);
    expect(canManageAppointment('NO_SHOW')).toBe(false);
  });

  it('filters upcoming, completed, and cancelled using API statuses', () => {
    expect(APPOINTMENT_FILTER_STATUSES.upcoming).toEqual(['REQUESTED', 'CONFIRMED']);
    expect(APPOINTMENT_FILTER_STATUSES.completed).toEqual(['COMPLETED']);
    expect(APPOINTMENT_FILTER_STATUSES.cancelled).toEqual(['CANCELLED', 'NO_SHOW']);
  });

  it('selects a doctor from the providers list by real id', () => {
    const providers = [{ id: 'doc-1', name: 'Dr. Smith', specialty: 'Cardiology' }];
    expect(findProviderById(providers, 'doc-1')).toEqual(providers[0]);
    expect(findProviderById(providers, 'missing')).toBeNull();
    expect(providerLabel(providers[0])).toBe('Dr. Smith · Cardiology');
  });

  it('validates booking date and time without free-text doctor names', () => {
    expect(bookAppointmentSchema.safeParse({ doctorId: 'doc-1', date: '15-09-2026', time: '10:00' }).success).toBe(true);
    expect(bookAppointmentSchema.safeParse({ doctorId: '', date: '15-09-2026', time: '10:00' }).success).toBe(false);
    expect(bookAppointmentSchema.safeParse({ doctorId: 'doc-1', date: '2026-09-15', time: '10:00' }).success).toBe(false);
    expect(bookAppointmentSchema.shape).not.toHaveProperty('doctorName');
    expect(bookAppointmentSchema.shape).not.toHaveProperty('hospital');
    expect(bookAppointmentSchema.shape).not.toHaveProperty('purpose');
  });

  it('routes booking and detail to Health, Family, and Admin paths', () => {
    expect(healthAppointmentBookHref()).toBe('/health/appointments/new');
    expect(healthAppointmentHref('appt-1')).toEqual({ pathname: '/health/appointments/[id]', params: { id: 'appt-1' } });
    expect(familyAppointmentBookHref()).toBe('/family/health/appointments/new');
    expect(familyAppointmentHref('appt-1')).toEqual({
      pathname: '/family/health/appointments/[id]',
      params: { id: 'appt-1' },
    });
    expect(adminAppointmentBookHref()).toBe('/(admin)/appointments/new');
    expect(adminAppointmentHref('appt-1')).toBe('/(admin)/appointments/appt-1');
  });

  it('invalidates senior, family, admin, and care appointment queries after writes', async () => {
    const spy = jest.spyOn(queryClient, 'invalidateQueries');
    await invalidateAppointmentQueries();
    expect(spy).toHaveBeenCalledWith({ queryKey: ['appointments'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['family', 'appointments'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['admin', 'appointments'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['care', 'appointments'] });
    expect(appointmentQueryKeys.detail('appt-1')).toEqual(['appointments', 'detail', 'appt-1']);
    spy.mockRestore();
  });

  it('handles 403, 404, 422, and network errors through the shared API error system', async () => {
    mockedPost.mockRejectedValueOnce({ isAxiosError: true, response: { status: 403, data: {} } });
    await expect(
      createAppointment({ seniorId: 'other', doctorId: 'doc-1', scheduledAt: toScheduledAtIso('2026-09-15', '10:00') }),
    ).rejects.toMatchObject({ name: 'ApiError', status: 403 });

    mockedGet.mockRejectedValueOnce({ isAxiosError: true, response: { status: 404, data: {} } });
    await expect(fetchAppointment('missing')).rejects.toMatchObject({ name: 'ApiError', status: 404 });

    mockedPatch.mockRejectedValueOnce({ isAxiosError: true, response: { status: 422, data: { detail: 'raw' } } });
    await expect(updateAppointment('appt-1', { status: 'ACTIVE' as never })).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
    });

    mockedPost.mockRejectedValueOnce({ isAxiosError: true, code: 'ERR_NETWORK', message: 'Network Error' });
    await expect(
      createAppointment({ seniorId: 'senior-1', doctorId: 'doc-1', scheduledAt: toScheduledAtIso('2026-09-15', '10:00') }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
