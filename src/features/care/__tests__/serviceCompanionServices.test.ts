import {
  assignableCareAssociates,
  companionServiceLabels,
  normalizeCompanionServiceSlugs,
  staffCoversCompanionService,
} from '../serviceCompanionServices';

describe('service companion services', () => {
  it('keeps only the five allowed slugs', () => {
    expect(normalizeCompanionServiceSlugs(['grocery', 'medicine', 'cctv', 'grocery'])).toEqual([
      'grocery',
      'medicine',
    ]);
  });

  it('labels covered services for admin and assignment copy', () => {
    expect(companionServiceLabels(['grocery', 'banking-companion'])).toEqual([
      'Grocery Delivery',
      'Banking Companion',
    ]);
  });

  it('treats a service companion with no saved slugs as covering all five', () => {
    expect(
      staffCoversCompanionService({ staffKind: 'DELIVERY_EXECUTIVE', companionServiceSlugs: [] }, 'medicine'),
    ).toBe(true);
    expect(
      staffCoversCompanionService(
        { staffKind: 'DELIVERY_EXECUTIVE', companionServiceSlugs: ['grocery'] },
        'medicine',
      ),
    ).toBe(false);
  });

  it('filters assignment pickers to companions who cover the selected service', () => {
    const staff = [
      { id: 'cm', staffKind: 'CARE_MANAGER', status: 'ACTIVE', companionServiceSlugs: [] },
      { id: 'grocery', staffKind: 'DELIVERY_EXECUTIVE', status: 'ACTIVE', companionServiceSlugs: ['grocery'] },
      { id: 'medicine', staffKind: 'DELIVERY_EXECUTIVE', status: 'ACTIVE', companionServiceSlugs: ['medicine'] },
      { id: 'inactive', staffKind: 'DELIVERY_EXECUTIVE', status: 'PENDING', companionServiceSlugs: ['grocery'] },
    ];
    expect(assignableCareAssociates(staff, { serviceSlug: 'grocery' }).map((item) => item.id)).toEqual([
      'grocery',
    ]);
    expect(
      assignableCareAssociates(staff, { serviceSlug: 'grocery', keepId: 'inactive' }).map((item) => item.id),
    ).toEqual(['grocery', 'inactive']);
  });
});
