import {
  ADDON_SLUG_ORDER,
  MEMBERSHIP_SLUG_ORDER,
  adminCatalogPath,
  adminServiceKind,
  filterAdminServices,
  requestCountsByName,
  sortAdminServices,
  topRequestedService,
} from '../servicesAdminModel';

describe('admin services catalogue order', () => {
  it('lists the 21 membership slugs in brochure order and keeps add-ons separate', () => {
    expect(MEMBERSHIP_SLUG_ORDER).toHaveLength(21);
    expect(MEMBERSHIP_SLUG_ORDER[0]).toBe('emergency-sos');
    expect(MEMBERSHIP_SLUG_ORDER[7]).toBe('grocery');
    expect(MEMBERSHIP_SLUG_ORDER[12]).toBe('ca');
    expect(MEMBERSHIP_SLUG_ORDER[20]).toBe('cctv');
    expect(MEMBERSHIP_SLUG_ORDER).not.toContain('food');
    expect(ADDON_SLUG_ORDER).toEqual([
      'emergency-companion',
      'stool-cleaning',
      'maid-assistance',
      'ayurvedic-massage',
      'food',
    ]);
  });

  it('sorts membership rows in brochure order and parks add-ons after them', () => {
    const rows = sortAdminServices([
      { name: 'Food Delivery', slug: 'food', category: 'FOOD_HOME', description: '' },
      { name: 'CCTV Dashboard', slug: 'cctv', category: 'ADD_ON', description: '' },
      { name: 'Emergency Support', slug: 'emergency-sos', category: 'CARE', description: '' },
      { name: 'Custom visit', slug: null, category: 'CARE', description: '' },
      { name: 'Grocery Delivery', slug: 'grocery', category: 'FOOD_HOME', description: '' },
    ]);
    expect(rows.map((item) => item.slug)).toEqual(['emergency-sos', 'grocery', 'cctv', 'food', null]);
  });

  it('keeps add-ons out of All and only in the add-ons filter', () => {
    const items = [
      { name: 'Emergency Support', slug: 'emergency-sos', category: 'CARE', description: 'SOS' },
      { name: 'Food Delivery', slug: 'food', category: 'FOOD_HOME', description: 'Meals' },
      { name: 'Custom visit', slug: null, category: 'CARE', description: 'Extra' },
    ];
    expect(filterAdminServices(items, 'all', '').map((item) => item.slug)).toEqual(['emergency-sos']);
    expect(filterAdminServices(items, 'other', '').map((item) => item.slug)).toEqual([null]);
    expect(filterAdminServices(items, 'addons', '').map((item) => item.slug)).toEqual(['food']);
    expect(adminServiceKind('food')).toBe('addon');
    expect(adminCatalogPath('grocery')).toBe('/(admin)/catalog/grocery');
    expect(adminCatalogPath('food')).toBe('/(admin)/catalog/food');
    expect(adminCatalogPath('companion')).toBe('/(admin)/catalog/offerings/companion');
  });

  it('picks the membership service with the most live requests', () => {
    const counts = requestCountsByName([
      { serviceName: 'Companion Visit' },
      { serviceName: 'Companion Visit' },
      { serviceName: 'Emergency Support' },
    ]);
    expect(
      topRequestedService(
        [
          { name: 'Emergency Support', slug: 'emergency-sos' },
          { name: 'Companion Visit', slug: 'companion' },
          { name: 'Food Delivery', slug: 'food' },
        ],
        counts,
      ),
    ).toEqual({ name: 'Companion Visit', count: 2 });
  });
});
