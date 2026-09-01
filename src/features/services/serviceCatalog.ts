import type { Href } from 'expo-router';
import type { IconName } from '@/components/ui';
import { familyHome } from '@/features/home/components/familyHomeTheme';

export type MarketplaceService = {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  color: string;
  background: string;
  href: Href;
  bookable: boolean;
  /** Shown in the Home “Our Services” grid (first 9). */
  showOnHome: boolean;
  /** Built membership screen vs coming-soon shell. */
  ready: boolean;
};

/** AgeWell Basic Membership services — matches the product UI board (19).
 *  `id` values are stable slugs aligned with API `services.slug` / membership_catalog.py.
 */
export const MARKETPLACE_SERVICES: MarketplaceService[] = [
  {
    id: 'emergency-sos',
    title: 'Emergency SOS',
    description: '24×7 panic alert to family, Care Manager and companion.',
    icon: 'siren',
    color: familyHome.red,
    background: familyHome.redSoft,
    href: '/(tabs)/sos' as Href,
    bookable: true,
    showOnHome: true,
    ready: true,
  },
  {
    id: 'care-manager',
    title: 'Care Manager Visit',
    description: 'Monthly visit, contact and service history.',
    icon: 'people-outline',
    color: familyHome.green,
    background: familyHome.greenSoft,
    href: '/membership/care-manager' as Href,
    bookable: true,
    showOnHome: true,
    ready: true,
  },
  {
    id: 'companion',
    title: 'Companion Visit',
    description: 'Daily home visit for assistance and company.',
    icon: 'people',
    color: familyHome.orange,
    background: familyHome.orangeSoft,
    href: '/membership/companion' as Href,
    bookable: true,
    showOnHome: true,
    ready: true,
  },
  {
    id: 'grocery',
    title: 'Grocery Delivery',
    description: 'Catalogue, cart or upload a shopping list/photo.',
    icon: 'cart-outline',
    color: familyHome.green,
    background: familyHome.greenSoft,
    href: '/membership/grocery' as Href,
    bookable: true,
    showOnHome: true,
    ready: true,
  },
  {
    id: 'food',
    title: 'Food Delivery',
    description: 'Maharashtrian, Gujarati and South Indian meals.',
    icon: 'restaurant-outline',
    color: familyHome.orange,
    background: familyHome.orangeSoft,
    href: '/membership/food' as Href,
    bookable: true,
    showOnHome: true,
    ready: true,
  },
  {
    id: 'medicine',
    title: 'Medicine Delivery',
    description: 'Upload prescription and track home delivery.',
    icon: 'pill',
    color: familyHome.purple,
    background: familyHome.purpleSoft,
    href: '/membership/medicine' as Href,
    bookable: true,
    showOnHome: true,
    ready: true,
  },
  {
    id: 'lab-testing',
    title: 'Lab Testing',
    description: 'Book nearby labs with home or lab visit.',
    icon: 'flask-outline',
    color: familyHome.blue,
    background: familyHome.blueSoft,
    href: '/membership/lab-testing' as Href,
    bookable: true,
    showOnHome: true,
    ready: true,
  },
  {
    id: 'monthly-blood-test',
    title: 'Monthly Blood Test',
    description: 'Monthly complete body test and report status.',
    icon: 'test-tube',
    color: familyHome.red,
    background: familyHome.redSoft,
    href: '/membership/monthly-blood-test' as Href,
    bookable: true,
    showOnHome: true,
    ready: true,
  },
  {
    id: 'doctor',
    title: 'Doctor Consultation',
    description: 'Consult trusted doctors through AgeWell.',
    icon: 'doctor',
    color: familyHome.blue,
    background: familyHome.blueSoft,
    href: '/membership/doctor' as Href,
    bookable: true,
    showOnHome: true,
    ready: true,
  },
  {
    id: 'medical-history',
    title: 'Medical History',
    description: 'Reports, notes and documents in one place.',
    icon: 'clipboard-text-outline',
    color: familyHome.blue,
    background: familyHome.blueSoft,
    href: '/membership/medical-history' as Href,
    bookable: false,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'tech-assistance',
    title: 'Tech Assistance',
    description: 'Help with phone, apps and digital payments.',
    icon: 'phone-portrait-outline',
    color: familyHome.purple,
    background: familyHome.purpleSoft,
    href: '/membership/tech-assistance' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'events-trips',
    title: 'Events & Trips',
    description: 'Local events and AgeWell outings.',
    icon: 'location',
    color: familyHome.red,
    background: familyHome.redSoft,
    href: '/membership/events-trips' as Href,
    bookable: false,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'legal',
    title: 'Legal Assistance',
    description: 'Request a consultation with AgeWell lawyers.',
    icon: 'document-text-outline',
    color: familyHome.blue,
    background: familyHome.blueSoft,
    href: '/membership/legal' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'ca',
    title: 'CA Assistance',
    description: 'Financial consultation with AgeWell CAs.',
    icon: 'card-outline',
    color: familyHome.green,
    background: familyHome.greenSoft,
    href: '/membership/ca' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'transport',
    title: 'Outstation Transport',
    description: 'Request a trained driver for outstation trips.',
    icon: 'car-outline',
    color: familyHome.blue,
    background: familyHome.blueSoft,
    href: '/membership/transport' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'home-repair',
    title: 'House Repair',
    description: 'Plumbing, electrical, carpentry, AC and more.',
    icon: 'settings-outline',
    color: familyHome.orange,
    background: familyHome.orangeSoft,
    href: '/membership/home-repair' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'pooja',
    title: 'Pooja Helper',
    description: 'Pooja packages with helpers at home.',
    icon: 'sparkles',
    color: familyHome.purple,
    background: familyHome.purpleSoft,
    href: '/membership/pooja' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'home-inspection',
    title: 'Home Inspection',
    description: 'Monthly home safety check reports.',
    icon: 'shield-checkmark-outline',
    color: familyHome.orange,
    background: familyHome.orangeSoft,
    href: '/membership/home-inspection' as Href,
    bookable: false,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'cctv',
    title: 'CCTV Dashboard',
    description: 'Live entrance camera coverage.',
    icon: 'eye-outline',
    color: familyHome.blue,
    background: familyHome.blueSoft,
    href: '/membership/cctv' as Href,
    bookable: false,
    showOnHome: false,
    ready: true,
  },
];

export type HomeServiceTile = Pick<
  MarketplaceService,
  'id' | 'title' | 'icon' | 'color' | 'background' | 'href' | 'bookable'
>;

const HOME_BASIC_MEMBERSHIP_SLUGS = [
  'emergency-sos',
  'companion',
  'care-manager',
  'food',
  'grocery',
  'medicine',
  'lab-testing',
] as const;

const HOME_MEMBERSHIP_OVERRIDES: Partial<
  Record<(typeof HOME_BASIC_MEMBERSHIP_SLUGS)[number], Partial<HomeServiceTile>>
> = {
  companion: {
    title: 'Companion Visit',
    color: familyHome.purple,
    background: familyHome.purpleSoft,
  },
  food: {
    title: 'Food Delivery',
    color: familyHome.yellow,
    background: familyHome.yellowSoft,
  },
  medicine: {
    title: 'Medicine Delivery',
    color: familyHome.green,
    background: familyHome.greenSoft,
  },
  'lab-testing': {
    title: 'Lab Tests',
  },
};

/** Home “Our Basic Membership Services” grid — 7 services + More Services tile. */
export function homeBasicMembershipServices(): HomeServiceTile[] {
  const tiles = HOME_BASIC_MEMBERSHIP_SLUGS.map((slug) => {
    const service = MARKETPLACE_SERVICES.find((item) => item.id === slug);
    if (!service) {
      return null;
    }
    const override = HOME_MEMBERSHIP_OVERRIDES[slug] ?? {};
    return {
      id: service.id,
      title: override.title ?? service.title,
      icon: override.icon ?? service.icon,
      color: override.color ?? service.color,
      background: override.background ?? service.background,
      href: service.href,
      bookable: service.bookable,
    };
  }).filter((item): item is HomeServiceTile => item !== null);

  tiles.push({
    id: 'more-services',
    title: 'More Services',
    icon: 'ellipsis-horizontal',
    color: familyHome.muted,
    background: '#F5F5F5',
    href: '/(tabs)/services' as Href,
    bookable: false,
  });

  return tiles;
}

export function homeMarketplaceServices(): MarketplaceService[] {
  return MARKETPLACE_SERVICES.filter((item) => item.showOnHome);
}

export function allMarketplaceServices(): MarketplaceService[] {
  return MARKETPLACE_SERVICES;
}

export function findMembershipService(id: string | undefined): MarketplaceService | null {
  if (!id) {
    return null;
  }
  return MARKETPLACE_SERVICES.find((item) => item.id === id) ?? null;
}
