import type { Href } from 'expo-router';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import type { HomeServiceTile } from '@/features/services/serviceCatalog';

function addonHref(id: string): Href {
  return { pathname: '/addons/[id]', params: { id } } as Href;
}

/** Home-screen add-on shortcuts — brochure order (5). Tiffin Box uses the food catalog screen. */
export const ADD_ON_SERVICES: HomeServiceTile[] = [
  {
    id: 'emergency-companion',
    title: 'Emergency Companion',
    icon: 'ambulance',
    color: familyHome.purple,
    background: familyHome.white,
    href: addonHref('emergency-companion'),
    bookable: true,
  },
  {
    id: 'food',
    title: 'Tiffin Box',
    icon: 'restaurant-outline',
    color: familyHome.orange,
    background: familyHome.white,
    href: '/membership/food' as Href,
    bookable: true,
  },
  {
    id: 'stool-cleaning',
    title: 'Stool Cleaning',
    icon: 'water',
    color: familyHome.blue,
    background: familyHome.white,
    href: addonHref('stool-cleaning'),
    bookable: true,
  },
  {
    id: 'maid-assistance',
    title: 'House Maid',
    icon: 'broom',
    color: familyHome.green,
    background: familyHome.white,
    href: addonHref('maid-assistance'),
    bookable: true,
  },
  {
    id: 'ayurvedic-massage',
    title: 'Ayurvedic Massage',
    icon: 'leaf',
    color: familyHome.orange,
    background: familyHome.white,
    href: addonHref('ayurvedic-massage'),
    bookable: true,
  },
];

export function homeAddOnServices(): HomeServiceTile[] {
  return ADD_ON_SERVICES;
}
