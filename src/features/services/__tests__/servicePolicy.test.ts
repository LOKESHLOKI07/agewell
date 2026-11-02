import {
  getServicePolicy,
  requestNeedsFieldAssign,
  requiresProofPhoto,
  roleCanFinish,
  shouldAutoAssignStanding,
  staffCanBeAssignedToService,
  tracksEmployeeLocation,
  usesDeliveryJob,
} from '../servicePolicy';

describe('service policy', () => {
  it('tracks only the five checklist services', () => {
    expect(tracksEmployeeLocation('emergency-sos')).toBe(true);
    expect(tracksEmployeeLocation('medicine')).toBe(true);
    expect(tracksEmployeeLocation('grocery')).toBe(true);
    expect(tracksEmployeeLocation('local-transport')).toBe(true);
    expect(tracksEmployeeLocation('transport')).toBe(true);
    expect(tracksEmployeeLocation('companion')).toBe(false);
    expect(tracksEmployeeLocation('care-manager')).toBe(false);
    expect(tracksEmployeeLocation('food')).toBe(false);
  });

  it('requires proof photos only on the eight checklist services', () => {
    expect(requiresProofPhoto('emergency-sos')).toBe(true);
    expect(requiresProofPhoto('medicine')).toBe(true);
    expect(requiresProofPhoto('health-check')).toBe(true);
    expect(requiresProofPhoto('monthly-blood-test')).toBe(true);
    expect(requiresProofPhoto('doctor')).toBe(true);
    expect(requiresProofPhoto('personalised-diet-plan')).toBe(true);
    expect(requiresProofPhoto('grocery')).toBe(true);
    expect(requiresProofPhoto('home-repair')).toBe(true);
    expect(requiresProofPhoto('banking-companion')).toBe(false);
    expect(requiresProofPhoto('companion')).toBe(false);
  });

  it('keeps diet plan on admin and medicine on service companion', () => {
    expect(getServicePolicy('personalised-diet-plan')?.finishers).toEqual(['ADMIN']);
    expect(getServicePolicy('medicine')?.finishers).toEqual(['SERVICE_COMPANION']);
    expect(getServicePolicy('emergency-sos')?.finishers).toEqual(['CARE_MANAGER', 'ADMIN']);
    expect(roleCanFinish('emergency-sos', 'COMPANION')).toBe(false);
    expect(roleCanFinish('home-repair', 'ADMIN')).toBe(false);
    expect(roleCanFinish('personalised-diet-plan', 'ADMIN')).toBe(true);
  });

  it('uses deliveries for grocery and medicine and hides desk-only assign', () => {
    expect(usesDeliveryJob('grocery')).toBe(true);
    expect(usesDeliveryJob('medicine')).toBe(true);
    expect(usesDeliveryJob('companion')).toBe(false);
    expect(requestNeedsFieldAssign('grocery')).toBe(true);
    expect(requestNeedsFieldAssign('companion')).toBe(true);
    expect(requestNeedsFieldAssign('personalised-diet-plan')).toBe(false);
    expect(requestNeedsFieldAssign('emergency-sos')).toBe(false);
  });

  it('auto-assigns standing staff for health-check but not SC-handoff services', () => {
    expect(shouldAutoAssignStanding('health-check')).toBe(true);
    expect(shouldAutoAssignStanding('doctor')).toBe(true);
    expect(shouldAutoAssignStanding('grocery')).toBe(false);
    expect(shouldAutoAssignStanding('banking-companion')).toBe(false);
    expect(shouldAutoAssignStanding('personalised-diet-plan')).toBe(false);
  });

  it('blocks a service companion from a service they do not cover', () => {
    expect(
      staffCanBeAssignedToService('grocery', {
        staffKind: 'DELIVERY_EXECUTIVE',
        companionServiceSlugs: ['medicine'],
      }),
    ).toBe(false);
    expect(
      staffCanBeAssignedToService('grocery', {
        staffKind: 'DELIVERY_EXECUTIVE',
        companionServiceSlugs: ['grocery'],
      }),
    ).toBe(true);
  });
});
