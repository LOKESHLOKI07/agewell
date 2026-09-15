jest.mock('@/features/home/components/familyHomeTheme', () => ({
  familyHome: {
    red: '#E53935',
    redSoft: '#FFEBEE',
    green: '#4CAF50',
    greenSoft: '#E8F5E9',
    orange: '#E67E22',
    orangeSoft: '#FFF3E0',
    purple: '#7B5EA7',
    purpleSoft: '#F3EDF8',
    blue: '#2F80ED',
    blueSoft: '#E8F1FF',
    yellowSoft: '#FFF8E1',
    muted: '#6B6B6B',
  },
}));

import { ADD_ON_SERVICES } from '../addOnServiceCatalog';
import { MARKETPLACE_SERVICES, allMarketplaceServices } from '../serviceCatalog';

describe('basic membership catalogue', () => {
  it('lists exactly 21 brochure services in order', () => {
    expect(MARKETPLACE_SERVICES).toHaveLength(21);
    expect(allMarketplaceServices().map((item) => item.id)).toEqual([
      'emergency-sos',
      'care-manager',
      'companion',
      'medicine',
      'health-check',
      'monthly-blood-test',
      'doctor',
      'grocery',
      'small-errands',
      'errand-coordination',
      'cyber-security',
      'banking-companion',
      'ca',
      'events-trips',
      'home-repair',
      'pooja',
      'legal',
      'local-transport',
      'transport',
      'home-inspection',
      'cctv',
    ]);
  });

  it('keeps food out of basic and in add-ons', () => {
    expect(MARKETPLACE_SERVICES.some((item) => item.id === 'food')).toBe(false);
    expect(ADD_ON_SERVICES.map((item) => item.id)).toContain('food');
  });

  it('uses brochure companion quota and medicine lead time', () => {
    const companion = MARKETPLACE_SERVICES.find((item) => item.id === 'companion');
    const medicine = MARKETPLACE_SERVICES.find((item) => item.id === 'medicine');
    expect(companion?.description).toMatch(/20 companion visits/);
    expect(medicine?.description).toMatch(/1 day/);
  });
});
