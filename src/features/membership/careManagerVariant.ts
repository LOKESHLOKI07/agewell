export type CareManagerPageVariant = 'loading' | 'non_serviceable' | 'unassigned' | 'assigned';

export function resolveCareManagerPageVariant(input: {
  inServiceArea: boolean;
  areaReady: boolean;
  assignedReady: boolean;
  assigned: boolean;
}): CareManagerPageVariant {
  if (!input.areaReady) {
    return 'loading';
  }
  if (!input.inServiceArea) {
    return 'non_serviceable';
  }
  if (!input.assignedReady) {
    return 'loading';
  }
  return input.assigned ? 'assigned' : 'unassigned';
}
