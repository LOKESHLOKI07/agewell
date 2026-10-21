jest.mock('@/features/home/components/familyHomeTheme', () => ({
  familyHome: {
    red: '#E53935',
    redSoft: '#FEF6F6',
    green: '#4CAF50',
    greenSoft: '#F3FAF4',
    orange: '#E67E22',
    orangeSoft: '#FFF8F2',
    purple: '#7B5EA7',
    purpleSoft: '#F9F6FC',
    blue: '#2F80ED',
    blueSoft: '#F5F8FE',
    yellowSoft: '#FFFCF0',
    muted: '#6B6B6B',
    white: '#FFFFFF',
  },
}));

import { ADD_ON_SERVICES, homeAddOnServices, isAddonOfferedInTier } from '../addOnServiceCatalog';
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
    ]);
  });

  it('keeps tiffin box (food) out of basic and in add-ons', () => {
    expect(MARKETPLACE_SERVICES.some((item) => item.id === 'food')).toBe(false);
    expect(ADD_ON_SERVICES.map((item) => item.id)).toEqual([
      'emergency-companion',
      'food',
      'stool-cleaning',
      'maid-assistance',
      'ayurvedic-massage',
    ]);
    expect(ADD_ON_SERVICES.find((item) => item.id === 'food')?.title).toBe('Tiffin Box');
    expect(ADD_ON_SERVICES.find((item) => item.id === 'maid-assistance')?.title).toBe('House Maid');
  });

  it('hides Tiffin Box and House Maid in Tier 2 localities', () => {
    expect(isAddonOfferedInTier('food', 'tier2')).toBe(false);
    expect(isAddonOfferedInTier('maid-assistance', 'tier2')).toBe(false);
    expect(isAddonOfferedInTier('emergency-companion', 'tier2')).toBe(true);
    expect(homeAddOnServices('tier2').map((item) => item.id)).toEqual([
      'emergency-companion',
      'stool-cleaning',
      'ayurvedic-massage',
    ]);
    expect(homeAddOnServices('tier1')).toHaveLength(5);
  });

  it('uses brochure companion quota and medicine lead time', () => {
    const companion = MARKETPLACE_SERVICES.find((item) => item.id === 'companion');
    const medicine = MARKETPLACE_SERVICES.find((item) => item.id === 'medicine');
    expect(companion?.description).toMatch(/20 companion visits/);
    expect(medicine?.description).toMatch(/1 day/);
  });
});
