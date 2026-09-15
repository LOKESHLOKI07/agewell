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
    lines: [
      'Hospital companion during hospitalization',
      'Handles procedures, family updates and discharge',
      '8–10 hours · extra cost based on availability',
    ],
    options: [
      { id: '8h', label: '8 Hours', price: 'Based on availability' },
      { id: '10h', label: '10 Hours', price: 'Based on availability' },
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
    lines: ['House & utensil cleaning, stock drying', '₹6,500 / month'],
  },
  {
    slug: 'ayurvedic-massage',
    title: 'Ayurvedic Massage',
    icon: 'sparkles',
    color: familyHome.orange,
    background: familyHome.yellowSoft,
    lines: ['Ayurvedic massage at home by a certified therapist'],
    options: [
      { id: '45min', label: '45 mins', price: '₹1,500' },
      { id: '60min', label: '60 mins', price: '₹2,000' },
    ],
  },
];

export function findAddonBookNow(slug: string | undefined): AddonBookNow | null {
  if (!slug) {
    return null;
  }
  return ADDON_BOOK_NOW.find((item) => item.slug === slug) ?? null;
}
