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
  it('no longer lists dedicated gate add-ons', () => {
    expect(ADDON_BOOK_NOW).toEqual([]);
  });

  it('returns null for all home add-on slugs', () => {
    expect(findAddonBookNow('emergency-companion')).toBeNull();
    expect(findAddonBookNow('stool-cleaning')).toBeNull();
    expect(findAddonBookNow('maid-assistance')).toBeNull();
    expect(findAddonBookNow('ayurvedic-massage')).toBeNull();
  });
});
