import { SERVICE_CATEGORY_LABELS, groupServicesByCategory } from '../selectors';
import type { CatalogService } from '@/features/home/types/home';

describe('services catalogue grouping', () => {
  const services: CatalogService[] = [
    { id: '1', name: 'Companion', category: 'CARE', description: 'Visit' },
    { id: '2', name: 'Meals', category: 'FOOD_HOME', description: 'Lunch' },
    { id: '3', name: 'Cab', category: 'MOBILITY', description: 'Transport' },
  ];

  it('groups real catalogue services without inventing SKUs', () => {
    const groups = groupServicesByCategory(services);
    expect(groups.map((g) => g.category)).toEqual(['CARE', 'FOOD_HOME', 'MOBILITY']);
    expect(groups.flatMap((g) => g.services.map((s) => s.id)).sort()).toEqual(['1', '2', '3']);
  });

  it('exposes human labels for every category', () => {
    expect(SERVICE_CATEGORY_LABELS.CARE).toBe('Care');
    expect(SERVICE_CATEGORY_LABELS.HEALTH).toBe('Health');
  });
});
