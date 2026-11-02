import { MARKETPLACE_SERVICES } from '@/features/services/serviceCatalog';
import { staffCanBeAssignedToService } from '@/features/services/servicePolicy';
import { isServiceCompanionKind, type StaffKind } from './staffKind';

export const SERVICE_COMPANION_SLUGS = [
  'medicine',
  'grocery',
  'small-errands',
  'errand-coordination',
  'banking-companion',
] as const;

export type ServiceCompanionSlug = (typeof SERVICE_COMPANION_SLUGS)[number];

export const SERVICE_COMPANION_OPTIONS: readonly { value: ServiceCompanionSlug; label: string }[] =
  SERVICE_COMPANION_SLUGS.map((slug) => {
    const service = MARKETPLACE_SERVICES.find((item) => item.id === slug);
    return { value: slug, label: service?.title ?? slug };
  });

const SLUG_SET = new Set<string>(SERVICE_COMPANION_SLUGS);

export function isServiceCompanionSlug(value: string): value is ServiceCompanionSlug {
  return SLUG_SET.has(value);
}

export function normalizeCompanionServiceSlugs(value: unknown): ServiceCompanionSlug[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const unique: ServiceCompanionSlug[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string' || !isServiceCompanionSlug(item) || seen.has(item)) {
      continue;
    }
    seen.add(item);
    unique.push(item);
  }
  return unique;
}

export function companionServiceLabels(slugs: readonly string[] | null | undefined): string[] {
  const normalized = normalizeCompanionServiceSlugs(slugs);
  return SERVICE_COMPANION_OPTIONS.filter((option) => normalized.includes(option.value)).map(
    (option) => option.label,
  );
}

export function staffCoversCompanionService(
  staff: { staffKind?: string | null; companionServiceSlugs?: readonly string[] | null },
  serviceSlug: string,
): boolean {
  if (!isServiceCompanionKind(staff.staffKind)) {
    return true;
  }
  const slugs = normalizeCompanionServiceSlugs(staff.companionServiceSlugs);
  const covered = slugs.length > 0 ? slugs : SERVICE_COMPANION_SLUGS;
  return covered.includes(serviceSlug as ServiceCompanionSlug);
}

export function assignableCareAssociates<
  T extends {
    id: string;
    staffKind?: string | null;
    status?: string | null;
    companionServiceSlugs?: readonly string[] | null;
  },
>(
  staff: readonly T[],
  options: { serviceSlug?: string | null; keepId?: string | null } = {},
): T[] {
  return staff.filter((item) => {
    const keep = options.keepId != null && item.id === options.keepId;
    const active = !item.status || item.status.toUpperCase() === 'ACTIVE';
    if (!active && !keep) {
      return false;
    }
    if (!options.serviceSlug || keep) {
      return true;
    }
    return staffCanBeAssignedToService(options.serviceSlug, item);
  });
}

export function requiresCompanionServices(kind: StaffKind | string | null | undefined): boolean {
  return isServiceCompanionKind(kind);
}
