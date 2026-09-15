import { resolveMembershipServicePageVariant } from '../membershipServicePageVariant';
import {
  buildCompanionActivities,
  companionDisplayName,
  filterCompanionRequests,
  toCompanionProfileView,
} from '../companionVisitModel';
import type { CareActivity } from '../careManagerTypes';
import type { ServiceRequest, Visit } from '@/features/home/types/home';

const companionManager = {
  id: 'comp-1',
  userId: 'u1',
  employeeId: 'CP01',
  name: 'Meera Iyer',
  firstName: 'Meera',
  lastName: 'Iyer',
  phone: '+91 99887 76655',
  skills: 'Friendly • Patient • Trustworthy',
  experience: '4+ years in eldercare support',
  languages: 'Kandivali & Borivali',
  availability: null,
  status: 'ACTIVE',
  staffKind: 'COMPANION',
};

const careActivity: CareActivity = {
  id: 'a1',
  seniorId: 's1',
  careManagerId: 'comp-1',
  careManagerName: 'Meera Iyer',
  activityType: 'HOME_VISIT',
  status: 'COMPLETED',
  icon: 'home-outline',
  title: 'Home Visit Completed',
  occurredAt: '2026-08-12T10:00:00.000Z',
  scheduledAt: null,
  reason: 'Assisted with daily activities and a short walk.',
  discussion: null,
  actionTaken: null,
  servicesCoordinated: null,
  followUpRequired: false,
  followUpDate: null,
  followUpNotes: null,
  notes: null,
  visitId: 'v1',
  createdAt: null,
};

const otherCare: CareActivity = {
  ...careActivity,
  id: 'a2',
  careManagerId: 'cm-other',
  title: 'Care Manager call',
};

const companionVisit: Visit = {
  id: 'v2',
  seniorId: 's1',
  careManagerId: 'comp-1',
  employeeId: 'CP01',
  careManagerName: 'Meera Iyer',
  status: 'COMPLETED',
  scheduledAt: '2026-08-05T09:00:00.000Z',
  notes: 'Accompanied to doctor visit',
};

const companionRequest: ServiceRequest = {
  id: 'req-1',
  seniorId: 's1',
  serviceId: 'svc-comp',
  serviceName: 'Companion Visit',
  serviceSlug: 'companion',
  status: 'REQUESTED',
  notes: 'Book a 30 minute meetup',
};

const groceryRequest: ServiceRequest = {
  id: 'req-g',
  seniorId: 's1',
  serviceId: 'svc-g',
  serviceName: 'Grocery',
  serviceSlug: 'grocery',
  status: 'REQUESTED',
  notes: null,
};

describe('Companion Visit page', () => {
  it('keeps the three gate states used by the Companion mockups', () => {
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

  it('maps assigned companion profile from care staff', () => {
    const profile = toCompanionProfileView(companionManager);
    expect(companionDisplayName(companionManager)).toBe('Meera Iyer');
    expect(profile.roleLabel).toBe('Companion Caregiver');
    expect(profile.serviceAreas).toMatch(/Kandivali/);
    expect(profile.traits).toMatch(/Friendly/);
  });

  it('builds activity from companion care rows, visits, and requests only', () => {
    expect(filterCompanionRequests([companionRequest, groceryRequest])).toEqual([companionRequest]);
    const rows = buildCompanionActivities({
      companionId: 'comp-1',
      careActivities: [careActivity, otherCare],
      visits: [companionVisit],
      requests: [companionRequest, groceryRequest],
    });
    expect(rows.some((item) => item.title === 'Home Visit Completed')).toBe(true);
    expect(rows.some((item) => item.title === 'Care Manager call')).toBe(false);
    expect(rows.some((item) => item.id === 'req-req-1')).toBe(true);
    expect(rows.some((item) => item.id === 'visit-v2')).toBe(true);
  });
});
