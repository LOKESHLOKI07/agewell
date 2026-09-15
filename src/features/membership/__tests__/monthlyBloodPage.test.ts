import { resolveMembershipServicePageVariant } from '../membershipServicePageVariant';
import {
  filterCbcLabs,
  filterMonthlyBloodRequests,
  toMonthlyBloodStatusView,
} from '../monthlyBloodModel';
import type { HealthDocument, LabResult, ServiceRequest } from '@/features/home/types/home';

const openRequest: ServiceRequest = {
  id: 'req-open',
  seniorId: 'senior-1',
  serviceId: 'svc-blood',
  serviceName: 'Monthly Blood Test',
  serviceSlug: 'monthly-blood-test',
  status: 'SCHEDULED',
  notes: 'Tomorrow · 8:00 AM',
};

const completedRequest: ServiceRequest = {
  id: 'req-done',
  seniorId: 'senior-1',
  serviceId: 'svc-blood',
  serviceName: 'Monthly Blood Test',
  serviceSlug: 'monthly-blood-test',
  status: 'COMPLETED',
  notes: 'Vitamin D is slightly low. Continue supplements.',
};

const groceryRequest: ServiceRequest = {
  id: 'req-g',
  seniorId: 'senior-1',
  serviceId: 'svc-g',
  serviceName: 'Grocery',
  serviceSlug: 'grocery',
  status: 'REQUESTED',
  notes: null,
};

const cbcLab: LabResult = {
  id: 'lab-cbc',
  seniorId: 'senior-1',
  testName: 'Complete Blood Count (CBC)',
  resultValue: 'Within normal range',
  date: '2026-08-04T09:20:00.000Z',
};

const sugarLab: LabResult = {
  id: 'lab-sugar',
  seniorId: 'senior-1',
  testName: 'Blood Sugar',
  resultValue: '96',
  date: '2026-08-04T09:20:00.000Z',
};

const bloodDoc: HealthDocument = {
  id: 'doc-1',
  seniorId: 'senior-1',
  fileUrl: 'https://example.com/cbc.pdf',
  documentType: 'August CBC report',
};

describe('Monthly Blood Test page', () => {
  it('keeps the three membership gate states', () => {
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

  it('filters monthly-blood requests and CBC labs only', () => {
    expect(filterMonthlyBloodRequests([openRequest, groceryRequest])).toEqual([openRequest]);
    expect(filterCbcLabs([cbcLab, sugarLab])).toEqual([cbcLab]);
  });

  it('prefers open requests as pending CBC status', () => {
    const status = toMonthlyBloodStatusView({
      requests: [openRequest, completedRequest],
      labs: [cbcLab],
      documents: [bloodDoc],
    });
    expect(status.kind).toBe('pending');
    if (status.kind === 'pending') {
      expect(status.scheduledAt).toMatch(/8:00/);
    }
  });

  it('maps completed CBC from labs/docs when no open request', () => {
    const status = toMonthlyBloodStatusView({
      requests: [completedRequest, groceryRequest],
      labs: [cbcLab],
      documents: [bloodDoc],
    });
    expect(status.kind).toBe('completed');
    if (status.kind === 'completed') {
      expect(status.reportTitle).toMatch(/CBC/i);
      expect(status.doctorSuggestion).toMatch(/Vitamin D/);
    }
  });

  it('returns idle when there is no blood data', () => {
    expect(
      toMonthlyBloodStatusView({
        requests: [groceryRequest],
        labs: [sugarLab],
        documents: [],
      }).kind,
    ).toBe('idle');
  });
});
