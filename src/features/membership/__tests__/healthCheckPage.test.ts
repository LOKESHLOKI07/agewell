import { resolveMembershipServicePageVariant } from '../membershipServicePageVariant';
import {
  filterHealthCheckRequests,
  toHealthReadingViews,
  toHealthReportViews,
} from '../healthCheckModel';
import type { HealthDocument, LabResult, ServiceRequest } from '@/features/home/types/home';

const labBp: LabResult = {
  id: 'lab-bp',
  seniorId: 'senior-1',
  testName: 'Blood Pressure',
  resultValue: '120/80 mmHg',
  date: '2026-09-12T10:00:00.000Z',
};

const labSugar: LabResult = {
  id: 'lab-sugar',
  seniorId: 'senior-1',
  testName: 'Blood Sugar (Fasting)',
  resultValue: '96 mg/dL',
  date: '2026-09-12T10:00:00.000Z',
};

const groceryRequest: ServiceRequest = {
  id: 'req-groc',
  seniorId: 'senior-1',
  serviceId: 'svc-groc',
  serviceName: 'Grocery Delivery',
  serviceSlug: 'grocery',
  status: 'REQUESTED',
  notes: null,
};

const healthRequest: ServiceRequest = {
  id: 'req-hc',
  seniorId: 'senior-1',
  serviceId: 'svc-hc',
  serviceName: 'Health Check',
  serviceSlug: 'health-check',
  status: 'REQUESTED',
  notes: 'Add-on test: ECG (charges apply)',
};

const document: HealthDocument = {
  id: 'doc-1',
  seniorId: 'senior-1',
  fileUrl: 'https://example.com/report.pdf',
  documentType: 'Monthly Health Check',
};

describe('Health Check page', () => {
  it('keeps the three gate states from the Health Check mockups', () => {
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

  it('builds latest readings from real lab results only', () => {
    expect(toHealthReadingViews([])).toEqual([]);
    const readings = toHealthReadingViews([labBp, labSugar], 4);
    expect(readings).toHaveLength(2);
    expect(readings[0]?.label).toBe('Blood Pressure');
    expect(readings[0]?.value).toBe('120/80 mmHg');
    expect(readings[1]?.label).toBe('Blood Sugar');
  });

  it('maps only health-check and lab-testing requests into reports', () => {
    expect(filterHealthCheckRequests([healthRequest, groceryRequest])).toEqual([healthRequest]);
    const reports = toHealthReportViews({
      requests: [healthRequest, groceryRequest],
      documents: [document],
      labs: [labBp],
    });
    expect(reports.some((item) => item.title === 'Health Check')).toBe(true);
    expect(reports.some((item) => item.title === 'Monthly Health Check')).toBe(true);
    expect(reports.some((item) => item.title === 'Grocery Delivery')).toBe(false);
    expect(reports.find((item) => item.id === 'req-req-hc')?.statusLabel).toBe('Request Submitted');
    expect(reports.find((item) => item.id === 'doc-doc-1')?.statusLabel).toBe('Reports Available');
  });
});
