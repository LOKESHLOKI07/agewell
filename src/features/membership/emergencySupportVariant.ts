export type EmergencySupportVariant =
  | 'loading'
  | 'non_serviceable'
  | 'serviceable_no_membership'
  | 'serviceable_with_membership';

/**
 * Senior SOS tab / Emergency Support page.
 * Everyone can open the page; the body matches area + membership.
 */
export function resolveEmergencySupportVariant(input: {
  role?: string | null;
  inServiceArea: boolean;
  hasMembership: boolean;
  areaReady: boolean;
  membershipReady: boolean;
}): EmergencySupportVariant {
  if (input.role === 'FAMILY') {
    return 'serviceable_with_membership';
  }
  if (!input.areaReady) {
    return 'loading';
  }
  if (!input.inServiceArea) {
    return 'non_serviceable';
  }
  if (!input.membershipReady) {
    return 'loading';
  }
  if (input.hasMembership) {
    return 'serviceable_with_membership';
  }
  return 'serviceable_no_membership';
}
