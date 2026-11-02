export type CareManagerPageVariant =
  | 'loading'
  | 'non_serviceable'
  | 'no_membership'
  | 'unassigned'
  | 'assigned';

export function resolveCareManagerPageVariant(input: {
  inServiceArea: boolean;
  areaReady: boolean;
  membershipReady: boolean;
  hasMembership: boolean;
  assignedReady: boolean;
  assigned: boolean;
}): CareManagerPageVariant {
  if (!input.areaReady) {
    return 'loading';
  }
  if (!input.inServiceArea) {
    return 'non_serviceable';
  }
  if (!input.membershipReady) {
    return 'loading';
  }
  if (!input.hasMembership) {
    return 'no_membership';
  }
  if (!input.assignedReady) {
    return 'loading';
  }
  return input.assigned ? 'assigned' : 'unassigned';
}
