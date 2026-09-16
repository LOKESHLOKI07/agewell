import type { Href } from 'expo-router';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import type { HomeServiceTile } from '@/features/services/serviceCatalog';

function addonHref(id: string): Href {
  return { pathname: '/addons/[id]', params: { id } } as Href;
}

/** Home-screen add-on shortcuts — Food uses the full meal catalog screen. */
export const ADD_ON_SERVICES: HomeServiceTile[] = [
  {
    id: 'emergency-companion',
    title: 'Emergency Companion',
    icon: 'heart-handshake',
    color: familyHome.purple,
    background: familyHome.purpleSoft,
    href: addonHref('emergency-companion'),
    bookable: true,
  },
  {
    id: 'stool-cleaning',
    title: 'Stool Cleaning',
    icon: 'broom-sparkles',
    color: familyHome.blue,
    background: familyHome.blueSoft,
    href: addonHref('stool-cleaning'),
    bookable: true,
  },
  {
    id: 'maid-assistance',
    title: 'House Cleaning',
    icon: 'brush-cleaning',
    color: familyHome.green,
    background: familyHome.greenSoft,
    href: addonHref('maid-assistance'),
    bookable: true,
  },
  {
    id: 'ayurvedic-massage',
    title: 'Ayurvedic Massage',
    icon: 'hand-heart',
    color: familyHome.orange,
    background: familyHome.yellowSoft,
    href: addonHref('ayurvedic-massage'),
    bookable: true,
  },
  {
    id: 'food',
    title: 'Food Delivery',
    icon: 'shopping-bag',
    color: familyHome.orange,
    background: familyHome.orangeSoft,
    href: '/membership/food' as Href,
    bookable: true,
  },
];

export function homeAddOnServices(): HomeServiceTile[] {
  return ADD_ON_SERVICES;
}
