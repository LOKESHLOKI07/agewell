export type HomeScreenVariant = 'non_serviceable' | 'serviceable_no_membership' | 'serviceable_with_membership';

export function resolveHomeScreenVariant(
  servicesLive: boolean,
  hasActiveMembership: boolean,
): HomeScreenVariant {
  if (!servicesLive) {
    return 'non_serviceable';
  }
  if (hasActiveMembership) {
    return 'serviceable_with_membership';
  }
  return 'serviceable_no_membership';
}
