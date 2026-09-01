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
  it('covers the four home add-on slugs', () => {
    expect(ADDON_BOOK_NOW.map((item) => item.slug)).toEqual([
      'emergency-companion',
      'stool-cleaning',
      'maid-assistance',
      'ayurvedic-massage',
    ]);
  });

  it('lists hospital companion durations and massage starting price', () => {
    expect(findAddonBookNow('emergency-companion')?.options?.map((item) => item.id)).toEqual(['12h', '24h']);
    expect(findAddonBookNow('ayurvedic-massage')?.lines.join(' ')).toMatch(/₹800/);
  });
});
