import type { StaffKind } from '@/features/care/staffKind';
import { isStaffKind } from '@/features/care/staffKind';

let selected: StaffKind | null = null;

export function setSelectedStaffKind(kind: StaffKind): void {
  selected = kind;
}

export function getSelectedStaffKind(): StaffKind | null {
  return selected;
}

/** Test helper */
export function resetSelectedStaffKind(): void {
  selected = null;
}

export function parseSelectedStaffKind(value: unknown): StaffKind | null {
  return isStaffKind(value) ? value : null;
}
