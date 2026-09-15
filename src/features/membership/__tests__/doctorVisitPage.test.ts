import { resolveMembershipServicePageVariant } from '../membershipServicePageVariant';
import {
  findUpcomingDoctorVisit,
  isUpcomingAppointment,
  toDoctorReportCards,
  toLatestDoctorReport,
  toPastDoctorVisits,
} from '../doctorVisitModel';
import type { Appointment, HealthcareProvider, MedicalRecord } from '@/features/home/types/home';

const provider: HealthcareProvider = {
  id: 'doc-1',
  name: 'Dr. Rajesh Mehta',
  specialty: 'General Physician',
};

const upcoming: Appointment = {
  id: 'apt-1',
  seniorId: 'senior-1',
  doctorId: 'doc-1',
  doctorName: 'Dr. Rajesh Mehta',
  status: 'CONFIRMED',
  scheduledAt: '2099-09-15T11:00:00.000Z',
};

const past: Appointment = {
  id: 'apt-2',
  seniorId: 'senior-1',
  doctorId: 'doc-1',
  doctorName: 'Dr. Rajesh Mehta',
  status: 'COMPLETED',
  scheduledAt: '2026-07-10T10:00:00.000Z',
};

const record: MedicalRecord = {
  id: 'rec-1',
  seniorId: 'senior-1',
  providerId: 'doc-1',
  providerName: 'Dr. Rajesh Mehta',
  notes: 'General health check, BP review, medication update and lifestyle advice.',
};

describe('Doctor Visit page', () => {
  it('keeps the three gate states from the Doctor Visit mockups', () => {
    expect(
      resolveMembershipServicePageVariant({
        inServiceArea: false,
        hasMembership: true,
        areaReady: true,
        membershipReady: true,
      }),
    ).toBe('non_serviceable');

    expect(
      resolveMembershipServicePageVariant({
        inServiceArea: true,
        hasMembership: false,
        areaReady: true,
        membershipReady: true,
      }),
    ).toBe('serviceable_no_membership');

    expect(
      resolveMembershipServicePageVariant({
        inServiceArea: true,
        hasMembership: true,
        areaReady: true,
        membershipReady: true,
      }),
    ).toBe('serviceable_with_membership');
  });

  it('builds upcoming and past visits from real appointments only', () => {
    expect(isUpcomingAppointment(upcoming)).toBe(true);
    expect(isUpcomingAppointment(past)).toBe(false);

    const next = findUpcomingDoctorVisit([upcoming, past], [provider]);
    expect(next?.id).toBe('apt-1');
    expect(next?.statusLabel).toBe('Confirmed');
    expect(next?.doctorName).toBe('Dr. Rajesh Mehta');
    expect(next?.doctorSpecialty).toBe('General Physician');

    const pastCards = toPastDoctorVisits([upcoming, past], [provider]);
    expect(pastCards).toHaveLength(1);
    expect(pastCards[0]?.id).toBe('apt-2');
  });

  it('builds visit reports from medical records only', () => {
    expect(toLatestDoctorReport([])).toBeNull();
    const latest = toLatestDoctorReport([record]);
    expect(latest?.statusLabel).toBe('Report Available');
    expect(latest?.summary).toMatch(/BP review/);
    expect(toDoctorReportCards([record])).toHaveLength(1);
  });
});
