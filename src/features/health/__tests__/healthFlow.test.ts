import { apiClient } from '@/api/client';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { toMedicationSchedule, toSeniorProfile } from '@/features/home/api/mappers';
import {
  fetchAppointments,
  fetchHealthDocuments,
  fetchHealthMedications,
  fetchHealthcareProviders,
  fetchLabResults,
  fetchMedicalRecords,
  fetchMedicationSchedules,
} from '../api';
import { healthQueryKeys } from '../queryKeys';
import {
  HEALTH_OVERVIEW_LINKS,
  formatRecordDate,
  healthMedicationHref,
  healthAppointmentBookHref,
  healthAppointmentHref,
  isHttpUrl,
  schedulesForMedication,
} from '../selectors';
import type { MedicationSchedule } from '@/features/home/types/home';

jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const mockedGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;

function json(data: unknown) {
  mockedGet.mockResolvedValueOnce({ data } as never);
}

const aspirinMorning: MedicationSchedule = {
  id: 'sched-1',
  medicationId: 'med-1',
  medicationName: 'Aspirin',
  dosage: '100mg',
  scheduleTime: '08:00',
  frequency: 'Daily',
};

const aspirinEvening: MedicationSchedule = {
  ...aspirinMorning,
  id: 'sched-2',
  scheduleTime: '20:00',
};

describe('Health overview and navigation', () => {
  it('lists Health overview destinations without mock pending counts', () => {
    const titles = HEALTH_OVERVIEW_LINKS.map((item) => item.title);
    expect(titles).toEqual([
      'Medications',
      'Lab Results',
      'Medical History',
      'Health Documents',
      'Doctors',
      'Appointments',
      'Emergency Information',
    ]);
    expect(HEALTH_OVERVIEW_LINKS.some((item) => item.href.includes('emergency-info'))).toBe(true);
    expect(HEALTH_OVERVIEW_LINKS.some((item) => item.href === '/emergency')).toBe(false);
  });

  it('navigates to medication detail with the real medication id', () => {
    expect(healthMedicationHref('med-1')).toEqual({
      pathname: '/health/medications/[id]',
      params: { id: 'med-1' },
    });
  });

  it('navigates to appointment booking and detail with the real appointment id', () => {
    expect(healthAppointmentBookHref()).toBe('/health/appointments/new');
    expect(healthAppointmentHref('appt-1')).toEqual({
      pathname: '/health/appointments/[id]',
      params: { id: 'appt-1' },
    });
  });
});

describe('medication schedules', () => {
  it('maps FastAPI schedule fields and keeps multiple times', () => {
    const mapped = toMedicationSchedule({
      id: 'sched-1',
      medication_id: 'med-1',
      medication_name: 'Aspirin',
      dosage: '100mg',
      schedule_time: '08:00',
      frequency: 'Daily',
    });
    expect(mapped).toEqual(aspirinMorning);
    expect(schedulesForMedication([aspirinMorning, aspirinEvening], 'med-1')).toHaveLength(2);
    expect(schedulesForMedication([aspirinMorning, aspirinEvening], 'med-1').map((item) => item.scheduleTime)).toEqual([
      '08:00',
      '20:00',
    ]);
  });

  it('loads schedules from GET /healthcare/medication-schedules', async () => {
    json({
      items: [
        {
          id: 'sched-1',
          medication_id: 'med-1',
          medication_name: 'Aspirin',
          dosage: '100mg',
          schedule_time: '08:00',
          frequency: 'Daily',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });
    const result = await fetchMedicationSchedules();
    expect(result.items[0].medicationName).toBe('Aspirin');
    expect(mockedGet).toHaveBeenCalledWith('/healthcare/medication-schedules', { params: undefined });
  });
});

describe('health records APIs', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('loads flattened medications from GET /healthcare/medications', async () => {
    json({
      items: [
        {
          medication_id: 'med-1',
          name: 'Aspirin',
          dosage: '100mg',
          schedule: '08:00',
          frequency: 'Daily',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });
    const result = await fetchHealthMedications();
    expect(result.items[0]).toMatchObject({
      medicationId: 'med-1',
      name: 'Aspirin',
      dosage: '100mg',
    });
    expect(mockedGet).toHaveBeenCalledWith('/healthcare/medications', { params: undefined });
  });

  it('loads medical records without inventing dates', async () => {
    json({
      items: [
        {
          id: 'rec-1',
          senior_id: 'senior-1',
          provider_id: 'doc-1',
          provider_name: 'Dr. Smith',
          notes: 'Follow-up for hypertension.',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });
    const result = await fetchMedicalRecords();
    expect(result.items[0]).toMatchObject({
      providerName: 'Dr. Smith',
      notes: 'Follow-up for hypertension.',
    });
    expect(result.items[0]).not.toHaveProperty('date');
    expect(mockedGet).toHaveBeenCalledWith('/healthcare/medical-records', { params: undefined });
  });

  it('loads lab results and formats the date without units or ranges', async () => {
    json({
      items: [
        {
          id: 'lab-1',
          senior_id: 'senior-1',
          test_name: 'HbA1c',
          result_value: '6.8%',
          date: '2026-08-18T10:00:00',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });
    const result = await fetchLabResults();
    expect(result.items[0].testName).toBe('HbA1c');
    expect(result.items[0].resultValue).toBe('6.8%');
    expect(formatRecordDate(result.items[0].date)).toBe('18 Aug 2026');
    expect(result.items[0]).not.toHaveProperty('units');
    expect(result.items[0]).not.toHaveProperty('normal_range');
  });

  it('loads health documents from /healthcare/documents, not the documents stub', async () => {
    json({
      items: [
        {
          id: 'doc-1',
          senior_id: 'senior-1',
          file_url: 'https://example.com/dev/agewell/report.pdf',
          document_type: 'Lab Report',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });
    const result = await fetchHealthDocuments();
    expect(result.items[0].documentType).toBe('Lab Report');
    expect(isHttpUrl(result.items[0].fileUrl)).toBe(true);
    expect(mockedGet).toHaveBeenCalledWith('/healthcare/documents', { params: undefined });
    expect(mockedGet).not.toHaveBeenCalledWith('/documents/', expect.anything());
  });

  it('loads derived doctors with name and specialty only', async () => {
    json({
      items: [{ id: 'p-1', name: 'Dr. Smith', specialty: 'Cardiology' }],
      total: 1,
      limit: 50,
      offset: 0,
    });
    const result = await fetchHealthcareProviders();
    expect(result.items[0]).toEqual({
      id: 'p-1',
      name: 'Dr. Smith',
      specialty: 'Cardiology',
    });
    expect(result.items[0]).not.toHaveProperty('hospital');
  });

  it('loads appointments from GET /appointments/', async () => {
    json({
      items: [
        {
          id: 'appt-1',
          senior_id: 'senior-1',
          doctor_id: 'p-1',
          doctor_name: 'Dr. Smith',
          status: 'REQUESTED',
          scheduled_at: '2026-08-19T23:47:08.180895Z',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });
    const result = await fetchAppointments();
    expect(result.items[0].doctorName).toBe('Dr. Smith');
    expect(result.items[0].status).toBe('REQUESTED');
    expect(mockedGet).toHaveBeenCalledWith('/appointments/', { params: undefined });
  });
});

describe('health query states and errors', () => {
  it('reports loading, empty, and error states', () => {
    expect(getSectionState({ isPending: true, isError: false, isEmpty: true })).toBe('loading');
    expect(getSectionState({ isPending: false, isError: false, isEmpty: true })).toBe('empty');
    expect(getSectionState({ isPending: false, isError: true, isEmpty: true })).toBe('error');
  });

  it('maps unauthorized Health requests through the shared error system', async () => {
    mockedGet.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 401, data: {} },
    });
    await expect(fetchMedicalRecords()).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
    });
  });

  it('uses the required Health query keys and does not reuse Home mock keys', () => {
    expect(healthQueryKeys).toEqual({
      medications: ['health', 'medications'],
      medicationSchedules: ['health', 'medicationSchedules'],
      medicalRecords: ['health', 'medicalRecords'],
      labResults: ['health', 'labResults'],
      documents: ['health', 'documents'],
      providers: ['health', 'providers'],
      appointments: ['appointments'],
    });
  });

  it('maps emergency contact from GET /seniors/me without emergency workflow fields', () => {
    const senior = toSeniorProfile({
      id: 'senior-1',
      user_id: 'user-1',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1950-01-01',
      address: 'Mumbai',
      emergency_contact: '911',
    });
    expect(senior.emergencyContact).toBe('911');
    expect(senior).not.toHaveProperty('location');
    expect(senior).not.toHaveProperty('gps');
  });
});
