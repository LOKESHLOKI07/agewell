import { create } from 'zustand';
import { en } from './locales/en';
import { hi } from './locales/hi';
import { mr } from './locales/mr';
import type { AppLocale, TranslationDict, TranslationKey } from './types';

const catalogs: Record<AppLocale, TranslationDict> = { en, hi, mr };

type I18nState = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

export const useI18nStore = create<I18nState>((set) => ({
  locale: 'en',
  setLocale: (locale) => set({ locale }),
}));

export function translate(locale: AppLocale, key: TranslationKey): string {
  return catalogs[locale][key] ?? catalogs.en[key] ?? key;
}

export function useI18n() {
  const locale = useI18nStore((state) => state.locale);
  const setLocale = useI18nStore((state) => state.setLocale);
  return {
    locale,
    setLocale,
    t: (key: TranslationKey) => translate(locale, key),
    availableLocales: ['en', 'hi', 'mr'] as AppLocale[],
  };
}

export type { AppLocale, TranslationKey };
