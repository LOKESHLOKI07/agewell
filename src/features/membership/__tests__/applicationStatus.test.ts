import {
  buildApplicationTimeline,
  canPayForApplication,
  nextAdminStages,
} from '../applicationStatus';
import type { MembershipRequest } from '../membershipTypes';

const baseRequest: MembershipRequest = {
  id: 'req-000124',
  seniorId: 'senior-1',
  seniorName: 'Lakshmi',
  planId: 'plan-1',
  planName: 'Single Membership',
  planPrice: 15499,
  status: 'REQUESTED',
  stage: 'SUBMITTED',
  notes: null,
  familyContact1Name: 'Asha',
  familyContact1Phone: '9876543210',
  familyContact2Name: null,
  familyContact2Phone: null,
  emergencyContactName: null,
  emergencyContactPhone: null,
  preferredHospital: 'Nearby',
  visitPlannedAt: null,
  visitScheduledStart: null,
  visitScheduledEnd: null,
  visitCompletedAt: null,
  reviewCompletedAt: null,
  acceptedAt: null,
  paidAt: null,
  careManagerId: null,
  careManagerName: null,
  companionId: null,
  companionName: null,
  createdAt: '2026-09-29T10:00:00.000Z',
  reviewedAt: null,
};

describe('application status timeline', () => {
  it('keeps payment pending until the application is accepted', () => {
    const steps = buildApplicationTimeline(baseRequest);
    expect(steps.find((step) => step.id === 'payment')?.tone).toBe('pending');
    expect(canPayForApplication(baseRequest)).toBe(false);
  });

  it('shows Pay Now only after acceptance', () => {
    const accepted: MembershipRequest = {
      ...baseRequest,
      stage: 'ACCEPTED',
      acceptedAt: '2026-10-05T12:00:00.000Z',
    };
    const steps = buildApplicationTimeline(accepted);
    expect(steps.find((step) => step.id === 'accepted')?.tone).toBe('completed');
    expect(steps.find((step) => step.id === 'payment')?.tone).toBe('current');
    expect(canPayForApplication(accepted)).toBe(true);
  });

  it('lists remaining admin stage actions', () => {
    expect(nextAdminStages('SUBMITTED').map((item) => item.stage)).toEqual(['VISIT_PLANNED']);
    expect(nextAdminStages('VISIT_PLANNED').map((item) => item.stage)).toEqual(['VISIT_SCHEDULED']);
    expect(nextAdminStages('ACCEPTED').map((item) => item.stage)).toEqual(['APPROVED']);
    expect(nextAdminStages('APPROVED')).toEqual([]);
  });
});
