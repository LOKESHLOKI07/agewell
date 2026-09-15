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
  /** Shown in the Home “Our Services” grid (first tiles). */
  showOnHome: boolean;
  /** Built membership screen vs coming-soon shell. */
  ready: boolean;
};

/** AgeWell Single Membership services — brochure order (21). Food is an add-on. */
export const MARKETPLACE_SERVICES: MarketplaceService[] = [
  {
    id: 'emergency-sos',
    title: 'Emergency Support',
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
    title: 'Care Manager',
    description: 'Your personal care coordinator — call, message or schedule a visit.',
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
    description: '20 companion visits a month for assistance or meetup (max 30 mins). Always available for emergency.',
    icon: 'people',
    color: familyHome.orange,
    background: familyHome.orangeSoft,
    href: '/membership/companion' as Href,
    bookable: true,
    showOnHome: true,
    ready: true,
  },
  {
    id: 'medicine',
    title: 'Medicine Delivery',
    description: 'Upload a prescription at least 1 day before delivery.',
    icon: 'pill',
    color: familyHome.purple,
    background: familyHome.purpleSoft,
    href: '/membership/medicine' as Href,
    bookable: true,
    showOnHome: true,
    ready: true,
  },
  {
    id: 'health-check',
    title: 'Health Check',
    description: 'Monthly BP, pulse, SpO₂, temperature and blood sugar.',
    icon: 'heart-outline',
    color: familyHome.red,
    background: familyHome.redSoft,
    href: '/membership/health-check' as Href,
    bookable: true,
    showOnHome: true,
    ready: true,
  },
  {
    id: 'monthly-blood-test',
    title: 'Monthly Blood Test',
    description: 'One CBC a month with home collection. LFT, KFT, lipid, thyroid and urine tests cost extra.',
    icon: 'test-tube',
    color: familyHome.red,
    background: familyHome.redSoft,
    href: '/membership/monthly-blood-test' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'doctor',
    title: 'Doctor / Physician Visit',
    description: 'Monthly doctor visit to review health and reports.',
    icon: 'doctor',
    color: familyHome.blue,
    background: familyHome.blueSoft,
    href: '/membership/doctor' as Href,
    bookable: true,
    showOnHome: true,
    ready: true,
  },
  {
    id: 'grocery',
    title: 'Grocery Delivery',
    description: 'Upload a list and receive fresh groceries nearby.',
    icon: 'cart-outline',
    color: familyHome.green,
    background: familyHome.greenSoft,
    href: '/membership/grocery' as Href,
    bookable: true,
    showOnHome: true,
    ready: true,
  },
  {
    id: 'small-errands',
    title: 'Small Errands Assistance',
    description: 'Companion assists with small errands during the visit.',
    icon: 'accessibility-outline',
    color: familyHome.orange,
    background: familyHome.orangeSoft,
    href: '/membership/small-errands' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'errand-coordination',
    title: 'Coordination for Other Errands',
    description: 'Ironing, haircut and other personal-service coordination.',
    icon: 'clipboard-outline',
    color: familyHome.purple,
    background: familyHome.purpleSoft,
    href: '/membership/errand-coordination' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'cyber-security',
    title: 'Cyber Security Guidance',
    description: 'Scam awareness, OTP safety and fraud follow-up support.',
    icon: 'shield-checkmark-outline',
    color: familyHome.purple,
    background: familyHome.purpleSoft,
    href: '/membership/cyber-security' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'banking-companion',
    title: 'Banking Companion',
    description: 'Companion for pension, cheque deposit and bank visits.',
    icon: 'card-outline',
    color: familyHome.green,
    background: familyHome.greenSoft,
    href: '/membership/banking-companion' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'ca',
    title: 'CA Assistance',
    description: 'Financial consultation with AgeWell CAs (extra cost).',
    icon: 'card-outline',
    color: familyHome.green,
    background: familyHome.greenSoft,
    href: '/membership/ca' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'events-trips',
    title: 'Local Events & Trips',
    description: 'Local events plus at least one supported tour a year (tours cost extra).',
    icon: 'location',
    color: familyHome.red,
    background: familyHome.redSoft,
    href: '/membership/events-trips' as Href,
    bookable: false,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'home-repair',
    title: 'House Maintenance',
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
    title: 'House Pooja Assistance',
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
    id: 'local-transport',
    title: 'Local Area Transportation',
    description: 'Companion helps coordinate cabs and rickshaws.',
    icon: 'car-outline',
    color: familyHome.blue,
    background: familyHome.blueSoft,
    href: '/membership/local-transport' as Href,
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

/** Home grid — first 8 brochure services, then More Services. */
const HOME_BASIC_MEMBERSHIP_SLUGS = [
  'emergency-sos',
  'care-manager',
  'companion',
  'medicine',
  'health-check',
  'monthly-blood-test',
  'doctor',
  'grocery',
] as const;

const HOME_MEMBERSHIP_OVERRIDES: Partial<
  Record<(typeof HOME_BASIC_MEMBERSHIP_SLUGS)[number], Partial<HomeServiceTile>>
> = {
  companion: {
    title: 'Companion Visit',
    color: familyHome.purple,
    background: familyHome.purpleSoft,
  },
  medicine: {
    title: 'Medicine Delivery',
    color: familyHome.green,
    background: familyHome.greenSoft,
  },
};

/** Home “Our Membership Services” grid — 8 services + More Services tile. */
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
