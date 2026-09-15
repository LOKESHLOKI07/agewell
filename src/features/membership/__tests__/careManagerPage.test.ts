import { resolveCareManagerPageVariant } from '../careManagerVariant';
import { CARE_MANAGER_CALL_HOURS_MESSAGE, isCareManagerCallOpen, whatsappHref } from '../careManagerHours';
import { toAssignedCareManagerPage, toCareActivity } from '../careManagerMappers';

describe('resolveCareManagerPageVariant', () => {
  it('shows coming soon outside the service area', () => {
    expect(
      resolveCareManagerPageVariant({
        inServiceArea: false,
        areaReady: true,
        assignedReady: true,
        assigned: true,
      }),
    ).toBe('non_serviceable');
  });

  it('shows unassigned when in area without a Care Manager', () => {
    expect(
      resolveCareManagerPageVariant({
        inServiceArea: true,
        areaReady: true,
        assignedReady: true,
        assigned: false,
      }),
    ).toBe('unassigned');
  });

  it('shows the assigned profile when a Care Manager is on file', () => {
    expect(
      resolveCareManagerPageVariant({
        inServiceArea: true,
        areaReady: true,
        assignedReady: true,
        assigned: true,
      }),
    ).toBe('assigned');
  });
});

describe('care manager hours and links', () => {
  it('is open at 10:00 IST and closed at 18:00 IST', () => {
    expect(isCareManagerCallOpen(new Date('2026-09-10T04:30:00.000Z'))).toBe(true);
    expect(isCareManagerCallOpen(new Date('2026-09-10T12:30:00.000Z'))).toBe(false);
    expect(CARE_MANAGER_CALL_HOURS_MESSAGE).toMatch(/10:00 AM and 6:00 PM/);
  });

  it('builds a WhatsApp link from the registered number', () => {
    expect(whatsappHref('+91 98765 43210', 'Hello')).toBe(
      'https://wa.me/919876543210?text=Hello',
    );
  });
});

describe('care manager mappers', () => {
  it('maps assigned profile and activity from the backend', () => {
    const page = toAssignedCareManagerPage({
      assigned: true,
      in_service_area: true,
      senior_id: 's1',
      care_manager: { id: 'cm1', name: 'Rohit Sharma', phone: '555', staff_kind: 'CARE_MANAGER' },
    });
    expect(page.assigned).toBe(true);
    expect(page.careManager?.name).toBe('Rohit Sharma');

    const activity = toCareActivity({
      id: 'a1',
      senior_id: 's1',
      care_manager_id: 'cm1',
      activity_type: 'HOME_VISIT',
      status: 'COMPLETED',
      icon: 'home-outline',
      title: 'Home Visit Completed',
      reason: 'General well-being check',
      follow_up_required: true,
      follow_up_notes: '26 Sept 2026',
    });
    expect(activity.icon).toBe('home-outline');
    expect(activity.title).toBe('Home Visit Completed');
  });
});
