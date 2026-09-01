import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createFoodCuisine,
  createFoodMenuItem,
  createGroceryCategory,
  createGroceryProduct,
  createServiceOffering,
  deleteFoodCuisine,
  deleteFoodMenuItem,
  deleteGroceryCategory,
  deleteGroceryProduct,
  deleteServiceOffering,
  fetchFoodCatalog,
  fetchGroceryCatalog,
  fetchServiceOfferings,
  updateFoodCuisine,
  updateFoodMenuItem,
  updateGroceryCategory,
  updateGroceryProduct,
  updateServiceOffering,
} from './catalogApi';
import type {
  FoodCuisineInput,
  FoodMenuItemInput,
  GroceryCategoryInput,
  GroceryProductInput,
  ServiceOfferingInput,
} from './catalogTypes';

export const catalogQueryKeys = {
  grocery: (includeInactive = false) => ['catalog', 'grocery', { includeInactive }] as const,
  food: (includeInactive = false) => ['catalog', 'food', { includeInactive }] as const,
  offerings: (serviceSlug?: string, includeInactive = false) =>
    ['catalog', 'offerings', { serviceSlug: serviceSlug ?? 'all', includeInactive }] as const,
};

export function useGroceryCatalog(includeInactive = false) {
  return useQuery({
    queryKey: catalogQueryKeys.grocery(includeInactive),
    queryFn: () => fetchGroceryCatalog(includeInactive),
  });
}

export function useFoodCatalog(includeInactive = false) {
  return useQuery({
    queryKey: catalogQueryKeys.food(includeInactive),
    queryFn: () => fetchFoodCatalog(includeInactive),
  });
}

function useInvalidateCatalog() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: ['catalog'] });
  };
}

export function useCreateGroceryCategory() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (input: GroceryCategoryInput) => createGroceryCategory(input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateGroceryCategory() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (input: { id: string } & Partial<GroceryCategoryInput>) =>
      updateGroceryCategory(input.id, input),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteGroceryCategory() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (id: string) => deleteGroceryCategory(id),
    onSuccess: () => invalidate(),
  });
}

export function useCreateGroceryProduct() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (input: GroceryProductInput) => createGroceryProduct(input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateGroceryProduct() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (input: { id: string } & Partial<GroceryProductInput>) =>
      updateGroceryProduct(input.id, input),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteGroceryProduct() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (id: string) => deleteGroceryProduct(id),
    onSuccess: () => invalidate(),
  });
}

export function useCreateFoodCuisine() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (input: FoodCuisineInput) => createFoodCuisine(input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateFoodCuisine() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (input: { id: string } & Partial<FoodCuisineInput>) => updateFoodCuisine(input.id, input),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteFoodCuisine() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (id: string) => deleteFoodCuisine(id),
    onSuccess: () => invalidate(),
  });
}

export function useCreateFoodMenuItem() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (input: FoodMenuItemInput) => createFoodMenuItem(input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateFoodMenuItem() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (input: { id: string } & Partial<FoodMenuItemInput>) => updateFoodMenuItem(input.id, input),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteFoodMenuItem() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (id: string) => deleteFoodMenuItem(id),
    onSuccess: () => invalidate(),
  });
}

export function useServiceOfferings(serviceSlug?: string, includeInactive = false) {
  return useQuery({
    queryKey: catalogQueryKeys.offerings(serviceSlug, includeInactive),
    queryFn: () => fetchServiceOfferings(serviceSlug, includeInactive),
  });
}

export function useCreateServiceOffering() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (input: ServiceOfferingInput) => createServiceOffering(input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateServiceOffering() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (input: { id: string } & Partial<ServiceOfferingInput>) =>
      updateServiceOffering(input.id, input),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteServiceOffering() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (id: string) => deleteServiceOffering(id),
    onSuccess: () => invalidate(),
  });
}
