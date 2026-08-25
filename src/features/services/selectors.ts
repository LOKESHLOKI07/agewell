import type { CatalogService, ServiceCategory } from '@/features/home/types/home';

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  CARE: 'Care',
  FOOD_HOME: 'Food & Home',
  HEALTH: 'Health',
  MOBILITY: 'Mobility',
  COMMUNITY: 'Community',
  ADD_ON: 'Add-on',
};

export const SERVICE_CATEGORY_ICONS: Record<ServiceCategory, 'people' | 'restaurant' | 'medkit' | 'car' | 'grid'> = {
  CARE: 'people',
  FOOD_HOME: 'restaurant',
  HEALTH: 'medkit',
  MOBILITY: 'car',
  COMMUNITY: 'people',
  ADD_ON: 'grid',
};

const CATEGORY_ORDER: ServiceCategory[] = ['CARE', 'FOOD_HOME', 'HEALTH', 'MOBILITY', 'COMMUNITY', 'ADD_ON'];

export interface ServiceCategoryGroup {
  category: ServiceCategory;
  label: string;
  services: CatalogService[];
}

export function groupServicesByCategory(services: CatalogService[]): ServiceCategoryGroup[] {
  const buckets = new Map<ServiceCategory, CatalogService[]>();
  for (const service of services) {
    const existing = buckets.get(service.category) ?? [];
    existing.push(service);
    buckets.set(service.category, existing);
  }

  return CATEGORY_ORDER.filter((category) => buckets.has(category)).map((category) => ({
    category,
    label: SERVICE_CATEGORY_LABELS[category],
    services: buckets.get(category) ?? [],
  }));
}

export function findServiceById(services: CatalogService[] | undefined, id: string | undefined): CatalogService | null {
  if (!services || !id) {
    return null;
  }
  return services.find((service) => service.id === id) ?? null;
}

export function serviceDetailsHref(id: string) {
  return { pathname: '/services/[id]' as const, params: { id } };
}

export function serviceRequestHref(id: string) {
  return { pathname: '/services/[id]/request' as const, params: { id } };
}
