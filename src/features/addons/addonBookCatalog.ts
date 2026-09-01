import type { IconName } from '@/components/ui';
import { familyHome } from '@/features/home/components/familyHomeTheme';

export type AddonBookOption = {
  id: string;
  label: string;
  price: string;
};

export type AddonBookNow = {
  slug: string;
  title: string;
  icon: IconName;
  color: string;
  background: string;
  lines: string[];
  options?: AddonBookOption[];
};

export const ADDON_BOOK_NOW: AddonBookNow[] = [
  {
    slug: 'emergency-companion',
    title: 'Emergency Companion',
    icon: 'heart-outline',
    color: familyHome.purple,
    background: familyHome.purpleSoft,
    lines: ['At Hospital Companion'],
    options: [
      { id: '12h', label: '12 Hours', price: '₹1,800' },
      { id: '24h', label: '24 Hours', price: '₹3,500' },
    ],
  },
  {
    slug: 'stool-cleaning',
    title: 'Stool Cleaning',
    icon: 'water',
    color: familyHome.blue,
    background: familyHome.blueSoft,
    lines: ['Morning & Evening Cleaning & Sponging', '₹22,000 / Month'],
  },
  {
    slug: 'maid-assistance',
    title: 'Maid Service',
    icon: 'home',
    color: familyHome.green,
    background: familyHome.greenSoft,
    lines: ['House & Utensils Cleaning, Cloth Drying', '₹3,000 / Month'],
  },
  {
    slug: 'ayurvedic-massage',
    title: 'Ayurvedic Massage',
    icon: 'sparkles',
    color: familyHome.orange,
    background: familyHome.yellowSoft,
    lines: ['Relax & Rejuvenate', 'Starting at ₹800'],
  },
];

export function findAddonBookNow(slug: string | undefined): AddonBookNow | null {
  if (!slug) {
    return null;
  }
  return ADDON_BOOK_NOW.find((item) => item.slug === slug) ?? null;
}
