export type GroceryCategory = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
};

export type GroceryProduct = {
  id: string;
  categoryId: string;
  name: string;
  unit: string;
  priceLabel: string;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type GroceryCatalog = {
  categories: GroceryCategory[];
  products: GroceryProduct[];
};

export type FoodMeal = 'Breakfast' | 'Lunch' | 'Dinner';

export type FoodCuisine = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

export type FoodMenuItem = {
  id: string;
  cuisineId: string;
  meal: FoodMeal;
  name: string;
  priceLabel: string;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type FoodCatalog = {
  cuisines: FoodCuisine[];
  items: FoodMenuItem[];
};

export type GroceryCategoryInput = {
  name: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type GroceryProductInput = {
  categoryId: string;
  name: string;
  unit?: string;
  priceLabel?: string;
  image?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export type FoodCuisineInput = {
  name: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type FoodMenuItemInput = {
  cuisineId: string;
  meal: FoodMeal;
  name: string;
  priceLabel?: string;
  image?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

/** Shared catalogue items for membership services other than grocery/food. */
export type ServiceOffering = {
  id: string;
  serviceSlug: string;
  title: string;
  description: string;
  badge: string;
  priceLabel: string;
  image: string | null;
  metaJson: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type ServiceOfferingInput = {
  serviceSlug: string;
  title: string;
  description?: string;
  badge?: string;
  priceLabel?: string;
  image?: string | null;
  metaJson?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export const OFFERING_SERVICE_SLUGS = [
  'emergency-sos',
  'care-manager',
  'companion',
  'medicine',
  'health-check',
  'monthly-blood-test',
  'doctor',
  'personalised-diet-plan',
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
  // Home add-ons (food uses the dedicated food catalog)
  'emergency-companion',
  'stool-cleaning',
  'maid-assistance',
  'ayurvedic-massage',
  // Legacy extras still editable in admin if present
  'lab-testing',
  'medical-history',
  'tech-assistance',
  'home-inspection',
] as const;

export type OfferingServiceSlug = (typeof OFFERING_SERVICE_SLUGS)[number];

export function parseOfferingMeta(metaJson: string | null | undefined): Record<string, string> {
  if (!metaJson) return {};
  try {
    const parsed = JSON.parse(metaJson) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'string' || typeof value === 'number') {
        out[key] = String(value);
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function filterOfferingsByKind(
  offerings: ServiceOffering[],
  kind: string,
): ServiceOffering[] {
  const key = kind.toLowerCase();
  return offerings.filter(
    (item) => parseOfferingMeta(item.metaJson).kind?.toLowerCase() === key,
  );
}

export type InspectionAreaView = {
  name: string;
  status: 'OK' | 'Attention';
  note: string;
};

export function parseInspectionAreas(metaJson: string | null | undefined): InspectionAreaView[] {
  if (!metaJson) return [];
  try {
    const parsed = JSON.parse(metaJson) as { areasJson?: string };
    if (!parsed.areasJson) return [];
    const areas = JSON.parse(parsed.areasJson) as unknown;
    if (!Array.isArray(areas)) return [];
    return areas
      .filter(
        (item): item is InspectionAreaView =>
          !!item &&
          typeof item === 'object' &&
          typeof (item as InspectionAreaView).name === 'string',
      )
      .map((item) => ({
        name: item.name,
        status: item.status === 'Attention' ? 'Attention' : 'OK',
        note: typeof item.note === 'string' ? item.note : '',
      }));
  } catch {
    return [];
  }
}
