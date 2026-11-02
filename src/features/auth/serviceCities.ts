import type { ServiceTier } from './serviceArea';

type StaffRole = 'SENIOR' | 'FAMILY' | 'CARE_MANAGER' | 'ADMIN' | 'OPERATIONS';

export type ServiceCity = 'mumbai' | 'chandrapur';

export const SERVICE_CITIES: readonly ServiceCity[] = ['mumbai', 'chandrapur'] as const;

export const SERVICE_CITY_OPTIONS: readonly { value: ServiceCity; label: string; hint: string }[] = [
  { value: 'mumbai', label: 'Mumbai', hint: 'Kandivali & Borivali' },
  { value: 'chandrapur', label: 'Chandrapur', hint: 'Warora, Bhadravati & Wani' },
];

export function isServiceCity(value: unknown): value is ServiceCity {
  return value === 'mumbai' || value === 'chandrapur';
}

export function serviceCityLabel(city: ServiceCity | null | undefined): string {
  if (city === 'mumbai') return 'Mumbai';
  if (city === 'chandrapur') return 'Chandrapur';
  return 'All cities';
}

export function serviceCityFromTier(tier: ServiceTier | null | undefined): ServiceCity | null {
  if (tier === 'tier1') return 'mumbai';
  if (tier === 'tier2') return 'chandrapur';
  return null;
}

export function isSuperStaff(user: { role: StaffRole; serviceCity?: ServiceCity | null } | null | undefined): boolean {
  if (!user) return false;
  return (user.role === 'ADMIN' || user.role === 'OPERATIONS') && !user.serviceCity;
}

export function staffScopeLabel(
  user: { role: StaffRole; serviceCity?: ServiceCity | null } | null | undefined,
): string {
  if (!user) return 'Staff';
  if (user.role !== 'ADMIN' && user.role !== 'OPERATIONS') {
    if (user.role === 'SENIOR') return 'Senior';
    if (user.role === 'FAMILY') return 'Family member';
    if (user.role === 'CARE_MANAGER') return 'Care manager';
    return 'Staff';
  }
  if (!user.serviceCity) {
    return user.role === 'ADMIN' ? 'Super admin' : 'Operations';
  }
  const city = serviceCityLabel(user.serviceCity);
  return user.role === 'ADMIN' ? `${city} admin` : `${city} operations`;
}
