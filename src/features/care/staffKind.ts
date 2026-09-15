export const STAFF_KINDS = ['CARE_MANAGER', 'COMPANION', 'DELIVERY_EXECUTIVE'] as const;

export type StaffKind = (typeof STAFF_KINDS)[number];

export const STAFF_KIND_LABELS: Record<StaffKind, string> = {
  CARE_MANAGER: 'Care Manager',
  COMPANION: 'Companion',
  DELIVERY_EXECUTIVE: 'Delivery Executive',
};

export function isStaffKind(value: unknown): value is StaffKind {
  return typeof value === 'string' && (STAFF_KINDS as readonly string[]).includes(value);
}

export function parseStaffKind(value: unknown): StaffKind {
  return isStaffKind(value) ? value : 'CARE_MANAGER';
}
