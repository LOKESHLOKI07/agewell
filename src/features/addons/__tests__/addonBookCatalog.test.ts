jest.mock('@/features/home/components/familyHomeTheme', () => ({
  familyHome: {
    purple: '#7B5EA7',
    purpleSoft: '#F3EDF8',
    blue: '#2F80ED',
    blueSoft: '#E8F1FF',
    green: '#4CAF50',
    greenSoft: '#E8F5E9',
    orange: '#E67E22',
    yellowSoft: '#FFF8E1',
  },
}));

import { ADDON_BOOK_NOW, findAddonBookNow } from '../addonBookCatalog';

describe('addon book now catalogue', () => {
  it('covers the five home add-on slugs including food', () => {
    expect(ADDON_BOOK_NOW.map((item) => item.slug)).toEqual([
      'emergency-companion',
      'stool-cleaning',
      'maid-assistance',
      'ayurvedic-massage',
    ]);
  });

  it('lists hospital companion 8–10 hour options and brochure massage prices', () => {
    expect(findAddonBookNow('emergency-companion')?.options?.map((item) => item.id)).toEqual(['8h', '10h']);
    expect(findAddonBookNow('maid-assistance')?.lines.join(' ')).toMatch(/₹6,500/);
    expect(findAddonBookNow('ayurvedic-massage')?.options?.map((item) => item.price)).toEqual(['₹1,500', '₹2,000']);
  });
});
