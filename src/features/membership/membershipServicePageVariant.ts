export type MembershipServicePageVariant =
  | 'loading'
  | 'non_serviceable'
  | 'serviceable_no_membership'
  | 'serviceable_with_membership';

export const MEMBERSHIP_SERVICE_AREA_LINE = 'AgeWell is currently serving Kandivali & Borivali, Mumbai.';

/**
 * Page-level gate for membership (and add-on) service screens.
 * Navigation is always allowed; this decides coming-soon / membership / live body.
 * Add-ons pass requireMembership: false so in-area users skip the buy-plan step.
 */
export function resolveMembershipServicePageVariant(input: {
  inServiceArea: boolean;
  hasMembership: boolean;
  areaReady: boolean;
  membershipReady: boolean;
  requireMembership?: boolean;
}): MembershipServicePageVariant {
  if (!input.areaReady) {
    return 'loading';
  }
  if (!input.inServiceArea) {
    return 'non_serviceable';
  }
  if (input.requireMembership === false) {
    return 'serviceable_with_membership';
  }
  if (!input.membershipReady) {
    return 'loading';
  }
  if (input.hasMembership) {
    return 'serviceable_with_membership';
  }
  return 'serviceable_no_membership';
}
