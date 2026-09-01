import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';
import type {
  FoodCatalog,
  FoodCuisine,
  FoodCuisineInput,
  FoodMeal,
  FoodMenuItem,
  FoodMenuItemInput,
  GroceryCatalog,
  GroceryCategory,
  GroceryCategoryInput,
  GroceryProduct,
  GroceryProductInput,
  ServiceOffering,
  ServiceOfferingInput,
} from './catalogTypes';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asBool(value: unknown, fallback = true): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toCategory(raw: unknown): GroceryCategory {
  const row = asRecord(raw);
  return {
    id: asString(row.id),
    name: asString(row.name),
    sortOrder: asNumber(row.sort_order),
    isActive: asBool(row.is_active),
  };
}

function toProduct(raw: unknown): GroceryProduct {
  const row = asRecord(raw);
  return {
    id: asString(row.id),
    categoryId: asString(row.category_id),
    name: asString(row.name),
    unit: asString(row.unit),
    priceLabel: asString(row.price_label),
    image: typeof row.image === 'string' ? row.image : null,
    sortOrder: asNumber(row.sort_order),
    isActive: asBool(row.is_active),
  };
}

function toCuisine(raw: unknown): FoodCuisine {
  const row = asRecord(raw);
  return {
    id: asString(row.id),
    name: asString(row.name),
    description: asString(row.description),
    sortOrder: asNumber(row.sort_order),
    isActive: asBool(row.is_active),
  };
}

function toMenuItem(raw: unknown): FoodMenuItem {
  const row = asRecord(raw);
  const meal = asString(row.meal, 'Lunch') as FoodMeal;
  return {
    id: asString(row.id),
    cuisineId: asString(row.cuisine_id),
    meal: meal === 'Breakfast' || meal === 'Dinner' ? meal : 'Lunch',
    name: asString(row.name),
    priceLabel: asString(row.price_label),
    image: typeof row.image === 'string' ? row.image : null,
    sortOrder: asNumber(row.sort_order),
    isActive: asBool(row.is_active),
  };
}

function toOffering(raw: unknown): ServiceOffering {
  const row = asRecord(raw);
  return {
    id: asString(row.id),
    serviceSlug: asString(row.service_slug),
    title: asString(row.title),
    description: asString(row.description),
    badge: asString(row.badge),
    priceLabel: asString(row.price_label),
    image: typeof row.image === 'string' ? row.image : null,
    metaJson: typeof row.meta_json === 'string' ? row.meta_json : null,
    sortOrder: asNumber(row.sort_order),
    isActive: asBool(row.is_active),
  };
}

function toOfferingsList(raw: unknown): ServiceOffering[] {
  const row = asRecord(raw);
  return Array.isArray(row.items) ? row.items.map(toOffering) : [];
}

function toGroceryCatalog(raw: unknown): GroceryCatalog {
  const row = asRecord(raw);
  return {
    categories: Array.isArray(row.categories) ? row.categories.map(toCategory) : [],
    products: Array.isArray(row.products) ? row.products.map(toProduct) : [],
  };
}

function toFoodCatalog(raw: unknown): FoodCatalog {
  const row = asRecord(raw);
  return {
    cuisines: Array.isArray(row.cuisines) ? row.cuisines.map(toCuisine) : [],
    items: Array.isArray(row.items) ? row.items.map(toMenuItem) : [],
  };
}

async function getMapped<T>(path: string, map: (data: unknown) => T, params?: Record<string, unknown>): Promise<T> {
  try {
    const response = await apiClient.get(path, { params });
    return map(response.data);
  } catch (error) {
    throw toApiError(error, 'default');
  }
}

async function sendMapped<T>(
  method: 'post' | 'patch' | 'delete',
  path: string,
  map: (data: unknown) => T,
  body?: unknown,
): Promise<T> {
  try {
    const response = await apiClient.request({ method, url: path, data: body, timeout: method === 'post' || method === 'patch' ? 30000 : undefined });
    if (method === 'delete') {
      return map(null);
    }
    return map(response.data);
  } catch (error) {
    throw toApiError(error, 'default');
  }
}

export async function fetchGroceryCatalog(includeInactive = false): Promise<GroceryCatalog> {
  return getMapped('/catalog/grocery', toGroceryCatalog, includeInactive ? { include_inactive: true } : undefined);
}

export async function fetchFoodCatalog(includeInactive = false): Promise<FoodCatalog> {
  return getMapped('/catalog/food', toFoodCatalog, includeInactive ? { include_inactive: true } : undefined);
}

export async function createGroceryCategory(input: GroceryCategoryInput): Promise<GroceryCategory> {
  return sendMapped('post', '/catalog/grocery/categories', toCategory, {
    name: input.name,
    sort_order: input.sortOrder ?? 0,
    is_active: input.isActive ?? true,
  });
}

export async function updateGroceryCategory(id: string, input: Partial<GroceryCategoryInput>): Promise<GroceryCategory> {
  return sendMapped('patch', `/catalog/grocery/categories/${id}`, toCategory, {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
    ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
  });
}

export async function deleteGroceryCategory(id: string): Promise<void> {
  await sendMapped('delete', `/catalog/grocery/categories/${id}`, () => undefined);
}

export async function createGroceryProduct(input: GroceryProductInput): Promise<GroceryProduct> {
  return sendMapped('post', '/catalog/grocery/products', toProduct, {
    category_id: input.categoryId,
    name: input.name,
    unit: input.unit ?? '',
    price_label: input.priceLabel ?? '',
    image: input.image ?? null,
    sort_order: input.sortOrder ?? 0,
    is_active: input.isActive ?? true,
  });
}

export async function updateGroceryProduct(id: string, input: Partial<GroceryProductInput>): Promise<GroceryProduct> {
  return sendMapped('patch', `/catalog/grocery/products/${id}`, toProduct, {
    ...(input.categoryId !== undefined ? { category_id: input.categoryId } : {}),
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.unit !== undefined ? { unit: input.unit } : {}),
    ...(input.priceLabel !== undefined ? { price_label: input.priceLabel } : {}),
    ...(input.image !== undefined ? { image: input.image } : {}),
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
    ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
  });
}

export async function deleteGroceryProduct(id: string): Promise<void> {
  await sendMapped('delete', `/catalog/grocery/products/${id}`, () => undefined);
}

export async function createFoodCuisine(input: FoodCuisineInput): Promise<FoodCuisine> {
  return sendMapped('post', '/catalog/food/cuisines', toCuisine, {
    name: input.name,
    description: input.description ?? '',
    sort_order: input.sortOrder ?? 0,
    is_active: input.isActive ?? true,
  });
}

export async function updateFoodCuisine(id: string, input: Partial<FoodCuisineInput>): Promise<FoodCuisine> {
  return sendMapped('patch', `/catalog/food/cuisines/${id}`, toCuisine, {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
    ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
  });
}

export async function deleteFoodCuisine(id: string): Promise<void> {
  await sendMapped('delete', `/catalog/food/cuisines/${id}`, () => undefined);
}

export async function createFoodMenuItem(input: FoodMenuItemInput): Promise<FoodMenuItem> {
  return sendMapped('post', '/catalog/food/items', toMenuItem, {
    cuisine_id: input.cuisineId,
    meal: input.meal,
    name: input.name,
    price_label: input.priceLabel ?? '',
    image: input.image ?? null,
    sort_order: input.sortOrder ?? 0,
    is_active: input.isActive ?? true,
  });
}

export async function updateFoodMenuItem(id: string, input: Partial<FoodMenuItemInput>): Promise<FoodMenuItem> {
  return sendMapped('patch', `/catalog/food/items/${id}`, toMenuItem, {
    ...(input.cuisineId !== undefined ? { cuisine_id: input.cuisineId } : {}),
    ...(input.meal !== undefined ? { meal: input.meal } : {}),
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.priceLabel !== undefined ? { price_label: input.priceLabel } : {}),
    ...(input.image !== undefined ? { image: input.image } : {}),
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
    ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
  });
}

export async function deleteFoodMenuItem(id: string): Promise<void> {
  await sendMapped('delete', `/catalog/food/items/${id}`, () => undefined);
}

export async function fetchServiceOfferings(
  serviceSlug?: string,
  includeInactive = false,
): Promise<ServiceOffering[]> {
  return getMapped('/catalog/offerings', toOfferingsList, {
    ...(serviceSlug ? { service_slug: serviceSlug } : {}),
    include_inactive: includeInactive,
  });
}

export async function createServiceOffering(input: ServiceOfferingInput): Promise<ServiceOffering> {
  return sendMapped('post', '/catalog/offerings', toOffering, {
    service_slug: input.serviceSlug,
    title: input.title,
    description: input.description ?? '',
    badge: input.badge ?? '',
    price_label: input.priceLabel ?? '',
    image: input.image ?? null,
    meta_json: input.metaJson ?? null,
    sort_order: input.sortOrder ?? 0,
    is_active: input.isActive ?? true,
  });
}

export async function updateServiceOffering(
  id: string,
  input: Partial<ServiceOfferingInput>,
): Promise<ServiceOffering> {
  return sendMapped('patch', `/catalog/offerings/${id}`, toOffering, {
    ...(input.serviceSlug !== undefined ? { service_slug: input.serviceSlug } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.badge !== undefined ? { badge: input.badge } : {}),
    ...(input.priceLabel !== undefined ? { price_label: input.priceLabel } : {}),
    ...(input.image !== undefined ? { image: input.image } : {}),
    ...(input.metaJson !== undefined ? { meta_json: input.metaJson } : {}),
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
    ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
  });
}

export async function deleteServiceOffering(id: string): Promise<void> {
  await sendMapped('delete', `/catalog/offerings/${id}`, () => undefined);
}
