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
    muted: '#6B6B6B',
    white: '#FFFFFF',
  },
}));

jest.mock('../serviceHeroes', () => ({
  SERVICE_HERO_COPY: {},
}));

import { MARKETPLACE_SERVICES } from '@/features/services/serviceCatalog';
import { getMembershipPreviewCopy } from '../membershipPreviewCatalog';

describe('membership preview catalog', () => {
  it('covers all 21 membership services with title, video, description and benefits', () => {
    expect(MARKETPLACE_SERVICES).toHaveLength(21);
    for (const service of MARKETPLACE_SERVICES) {
      const copy = getMembershipPreviewCopy(service.id);
      expect(copy.title).toBeTruthy();
      expect(copy.description).toBeTruthy();
      expect(copy.videoTitle).toBeTruthy();
      expect(copy.benefits).toHaveLength(4);
      expect(copy.membershipBody.toLowerCase()).toMatch(/member/);
    }
  });
});
