import { translate } from '@/i18n';
import { en } from '@/i18n/locales/en';
import { hi } from '@/i18n/locales/hi';
import { mr } from '@/i18n/locales/mr';

describe('i18n catalogues', () => {
  it('keeps English as the default complete catalogue', () => {
    expect(en['brand.name']).toBe('AgeWell');
    expect(en['emergency.disclaimer']).toMatch(/112/);
    expect(en['addons.noPayment']).toMatch(/not a purchase/i);
  });

  it('provides Hindi and Marathi UI strings without translating API payloads', () => {
    expect(hi['home.todaysCare']).not.toBe(en['home.todaysCare']);
    expect(mr['home.todaysCare']).not.toBe(en['home.todaysCare']);
    expect(translate('hi', 'brand.name')).toBe('AgeWell');
    expect(translate('mr', 'common.back')).toBe('मागे');
  });

  it('falls back to English for missing keys safely via translate()', () => {
    expect(translate('en', 'schedule.empty')).toBe(en['schedule.empty']);
  });
});
