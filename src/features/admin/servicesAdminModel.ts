/** Brochure order for the 21 Single Membership services — keep aligned with `MARKETPLACE_SERVICES`. */
export const MEMBERSHIP_SLUG_ORDER = [
  'emergency-sos',
  'care-manager',
  'companion',
  'medicine',
  'health-check',
  'monthly-blood-test',
  'doctor',
  'personalised-diet-plan',
  'grocery',
  'small-errands',
  'errand-coordination',
  'banking-companion',
  'events-trips',
  'cyber-security',
  'ca',
  'legal',
  'home-repair',
  'local-transport',
  'transport',
  'pooja',
  'cctv',
] as const;

/** Home add-ons — not part of the 21. Food lives here. */
export const ADDON_SLUG_ORDER = [
  'emergency-companion',
  'food',
  'stool-cleaning',
  'maid-assistance',
  'ayurvedic-massage',
] as const;

/** Deep-link extras still editable in Service Catalog, shown separately. */
export const EXTRA_CATALOG_SLUGS = ['lab-testing', 'medical-history', 'tech-assistance'] as const;

export const SERVICE_TABLE_PAGE_SIZE = 25;

export type AdminServiceKind = 'membership' | 'addon' | 'extra' | 'custom';
export type AdminServiceListFilter =
  | 'all'
  | 'addons'
  | 'other'
  | 'CARE'
  | 'HEALTH'
  | 'FOOD_HOME'
  | 'MOBILITY'
  | 'COMMUNITY'
  | 'ADD_ON';

const MEMBERSHIP_RANK = new Map<string, number>(MEMBERSHIP_SLUG_ORDER.map((slug, index) => [slug, index]));
const ADDON_SET = new Set<string>(ADDON_SLUG_ORDER);
const EXTRA_SET = new Set<string>(EXTRA_CATALOG_SLUGS);

export function adminServiceKind(slug: string | null | undefined): AdminServiceKind {
  if (!slug) {
    return 'custom';
  }
  if (MEMBERSHIP_RANK.has(slug)) {
    return 'membership';
  }
  if (ADDON_SET.has(slug)) {
    return 'addon';
  }
  if (EXTRA_SET.has(slug)) {
    return 'extra';
  }
  return 'custom';
}

export function membershipRank(slug: string | null | undefined): number {
  if (!slug) {
    return Number.MAX_SAFE_INTEGER;
  }
  return MEMBERSHIP_RANK.get(slug) ?? Number.MAX_SAFE_INTEGER;
}

export function adminCatalogPath(slug: string): string {
  if (slug === 'grocery') {
    return '/(admin)/catalog/grocery';
  }
  if (slug === 'food') {
    return '/(admin)/catalog/food';
  }
  return `/(admin)/catalog/offerings/${slug}`;
}

export function sortAdminServices<T extends { name: string; slug: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const kindRank = kindSort(adminServiceKind(a.slug)) - kindSort(adminServiceKind(b.slug));
    if (kindRank !== 0) {
      return kindRank;
    }
    const rank = membershipRank(a.slug) - membershipRank(b.slug);
    if (rank !== 0) {
      return rank;
    }
    const addonA = addonRank(a.slug);
    const addonB = addonRank(b.slug);
    if (addonA !== 99 || addonB !== 99) {
      return addonA - addonB;
    }
    return a.name.localeCompare(b.name);
  });
}

export function filterAdminServices<T extends { name: string; slug: string | null; category: string; description: string }>(
  items: T[],
  filter: AdminServiceListFilter,
  search: string,
): T[] {
  const needle = search.trim().toLowerCase();
  return sortAdminServices(items).filter((item) => {
    const kind = adminServiceKind(item.slug);
    if (filter === 'all' && kind !== 'membership') {
      return false;
    }
    if (filter === 'addons' && kind !== 'addon') {
      return false;
    }
    if (filter === 'other' && kind !== 'extra' && kind !== 'custom') {
      return false;
    }
    if (filter !== 'all' && filter !== 'addons' && filter !== 'other' && item.category !== filter) {
      return false;
    }
    if (filter !== 'all' && filter !== 'addons' && filter !== 'other' && kind === 'addon') {
      return false;
    }
    if (!needle) {
      return true;
    }
    return `${item.name} ${item.description} ${item.slug ?? ''}`.toLowerCase().includes(needle);
  });
}

export function requestCountsByName(requests: { serviceName: string }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of requests) {
    const key = item.serviceName.trim().toLowerCase();
    if (!key) {
      continue;
    }
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function topRequestedService(
  services: { name: string; slug: string | null }[],
  counts: Map<string, number>,
): { name: string; count: number } | null {
  let best: { name: string; count: number } | null = null;
  for (const service of services) {
    if (adminServiceKind(service.slug) !== 'membership') {
      continue;
    }
    const count = counts.get(service.name.trim().toLowerCase()) ?? 0;
    if (!best || count > best.count) {
      best = { name: service.name, count };
    }
  }
  if (!best || best.count === 0) {
    return null;
  }
  return best;
}

function addonRank(slug: string | null): number {
  if (!slug) {
    return 99;
  }
  const index = (ADDON_SLUG_ORDER as readonly string[]).indexOf(slug);
  return index === -1 ? 99 : index;
}

function kindSort(kind: AdminServiceKind): number {
  if (kind === 'membership') {
    return 0;
  }
  if (kind === 'addon') {
    return 1;
  }
  if (kind === 'extra') {
    return 2;
  }
  return 3;
}
