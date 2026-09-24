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
    background: familyHome.white,
    href: '/(tabs)/sos' as Href,
    bookable: true,
    showOnHome: true,
    ready: true,
  },
  {
    id: 'care-manager',
    title: 'Care Manager',
    description: 'Your personal care coordinator — call, message or schedule a visit.',
    icon: 'clipboard-user',
    color: familyHome.green,
    background: familyHome.white,
    href: '/membership/care-manager' as Href,
    bookable: true,
    showOnHome: true,
    ready: true,
  },
  {
    id: 'companion',
    title: 'Companion Support',
    description: '20 companion visits a month for assistance or meetup (max 30 mins). Always available for emergency.',
    icon: 'hand-heart',
    color: familyHome.orange,
    background: familyHome.white,
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
    background: familyHome.white,
    href: '/membership/medicine' as Href,
    bookable: true,
    showOnHome: true,
    ready: true,
  },
  {
    id: 'health-check',
    title: 'Health Checks',
    description: 'Monthly BP, pulse, SpO₂, temperature and blood sugar.',
    icon: 'medkit',
    color: familyHome.red,
    background: familyHome.white,
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
    background: familyHome.white,
    href: '/membership/monthly-blood-test' as Href,
    bookable: true,
    showOnHome: true,
    ready: true,
  },
  {
    id: 'doctor',
    title: 'Doctor / Physician Visit',
    description: 'Monthly doctor visit to review health and reports.',
    icon: 'stethoscope',
    color: familyHome.blue,
    background: familyHome.white,
    href: '/membership/doctor' as Href,
    bookable: true,
    showOnHome: true,
    ready: true,
  },
  {
    id: 'personalised-diet-plan',
    title: 'Personalised Diet Plan',
    description: 'Nutrition guidance tailored to your health needs and preferences.',
    icon: 'salad',
    color: familyHome.green,
    background: familyHome.white,
    href: '/membership/personalised-diet-plan' as Href,
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
    background: familyHome.white,
    href: '/membership/grocery' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'small-errands',
    title: 'Small Errands Assistance',
    description:
      'Our companion can assist you with small day-to-day errands such as buying medicines, picking up groceries, submitting documents, post office visits, small household purchases and other routine tasks nearby. Just give us a call and your companion will help you.',
    icon: 'shopping-bag',
    color: familyHome.purple,
    background: familyHome.white,
    href: '/membership/small-errands' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'errand-coordination',
    title: 'Other Errands Assistance',
    description:
      'Our companion helps coordinate home services like ironing, haircuts, cleaning and minor repairs with trusted professionals. Service provider costs are charged separately based on the actual bill.',
    icon: 'clipboard-check',
    color: '#E5484D',
    background: familyHome.white,
    href: '/membership/errand-coordination' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'banking-companion',
    title: 'Banking Companion',
    description: 'Companion for pension, cheque deposit and bank visits.',
    icon: 'landmark',
    color: familyHome.green,
    background: familyHome.white,
    href: '/membership/banking-companion' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'events-trips',
    title: 'Local Events & Trips',
    description:
      'Nearby events, priority AgeWell tours, and companion support for luggage, boarding and hotel check-in (tours cost extra).',
    icon: 'calendar-days',
    color: familyHome.red,
    background: familyHome.white,
    href: '/membership/events-trips' as Href,
    bookable: false,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'cyber-security',
    title: 'Cyber Security Assistance',
    description: 'Stay aware of scams, OTP risks and fraud follow-up — we are with you.',
    icon: 'shield-checkmark-outline',
    color: familyHome.purple,
    background: familyHome.white,
    href: '/membership/cyber-security' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'ca',
    title: 'CA Assistance',
    description: 'Exclusive CA support for ITR filing and financial guidance (extra cost).',
    icon: 'calculator',
    color: familyHome.green,
    background: familyHome.white,
    href: '/membership/ca' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'legal',
    title: 'Legal Assistance',
    description: 'Exclusive access to our lawyer team for consultations. (Costs extra)',
    icon: 'scale',
    color: familyHome.blue,
    background: familyHome.white,
    href: '/membership/legal' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'home-repair',
    title: 'House Maintenance',
    description: 'Plumbing, electrical, carpentry, AC and more.',
    icon: 'wrench',
    color: familyHome.orange,
    background: familyHome.white,
    href: '/membership/home-repair' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'local-transport',
    title: 'Local Area Transport',
    description: 'Companion supported coordination between cabs and rikshaws.',
    icon: 'car-outline',
    color: familyHome.blue,
    background: familyHome.white,
    href: '/membership/local-transport' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'transport',
    title: 'Outstation Transport',
    description: 'Well-trained driver assistance for outstation trips. Cost as per trip need.',
    icon: 'route',
    color: familyHome.blue,
    background: familyHome.white,
    href: '/membership/transport' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'pooja',
    title: 'House Pooja Assistance',
    description: 'Spiritual care, with complete support. 1–2 helpers at home.',
    icon: 'lamp',
    color: familyHome.purple,
    background: familyHome.white,
    href: '/membership/pooja' as Href,
    bookable: true,
    showOnHome: false,
    ready: true,
  },
  {
    id: 'cctv',
    title: 'CCTV Dashboard',
    description: 'Entrance CCTV camera coverage available on-app activity.',
    icon: 'cctv',
    color: familyHome.blue,
    background: familyHome.white,
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
  'personalised-diet-plan',
] as const;

const HOME_MEMBERSHIP_OVERRIDES: Partial<
  Record<(typeof HOME_BASIC_MEMBERSHIP_SLUGS)[number], Partial<HomeServiceTile>>
> = {
  medicine: {
    title: 'Medicine Delivery',
    color: familyHome.green,
    background: familyHome.white,
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
    background: familyHome.white,
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
