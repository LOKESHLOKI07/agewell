jest.mock('@/features/home/components/familyHomeTheme', () => ({
  familyHome: {
    purple: '#7B5EA7',
    purpleSoft: '#F9F6FC',
    blue: '#2F80ED',
    blueSoft: '#F5F8FE',
    green: '#4CAF50',
    greenSoft: '#F3FAF4',
    orange: '#E67E22',
    yellowSoft: '#FFFCF0',
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
