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
};

const routes = {
  servicesAll: '/(tabs)/services' as Href,
  doctor: '/health/appointments' as Href,
  meds: '/health/medications' as Href,
  companion: '/visits' as Href,
  food: '/addons' as Href,
  community: '/(tabs)/community' as Href,
  health: '/(tabs)/health' as Href,
};

/** Full AgeWell marketplace list — Home shows the first 9; Services tab shows all. */
export const MARKETPLACE_SERVICES: MarketplaceService[] = [
  {
    id: 'companion-care',
    title: 'Companion Care',
    description: 'Daily companionship and support at home.',
    icon: 'people-outline',
    color: familyHome.green,
    background: familyHome.greenSoft,
    href: routes.companion,
    bookable: true,
    showOnHome: true,
  },
  {
    id: 'doctors-appointment',
    title: 'Doctors Appointment',
    description: 'Book appointments with trusted doctors.',
    icon: 'doctor',
    color: familyHome.blue,
    background: familyHome.blueSoft,
    href: routes.doctor,
    bookable: true,
    showOnHome: true,
  },
  {
    id: 'food-delivery',
    title: 'Food Delivery',
    description: 'Fresh, multi-cuisine meals delivered.',
    icon: 'restaurant-outline',
    color: familyHome.orange,
    background: familyHome.orangeSoft,
    href: routes.food,
    bookable: true,
    showOnHome: true,
  },
  {
    id: 'grocery-shopping',
    title: 'Grocery & Shopping',
    description: 'Pre-order groceries & essentials.',
    icon: 'cart-outline',
    color: familyHome.green,
    background: familyHome.greenSoft,
    href: routes.food,
    bookable: true,
    showOnHome: true,
  },
  {
    id: 'transportation',
    title: 'Transportation',
    description: 'Safe and reliable transportation help.',
    icon: 'car-outline',
    color: familyHome.blue,
    background: familyHome.blueSoft,
    href: routes.servicesAll,
    bookable: true,
    showOnHome: true,
  },
  {
    id: 'digital-assistance',
    title: 'Digital Assistance',
    description: 'Help with smartphone, apps & online services.',
    icon: 'phone-portrait-outline',
    color: familyHome.purple,
    background: familyHome.purpleSoft,
    href: routes.servicesAll,
    bookable: true,
    showOnHome: true,
  },
  {
    id: 'events-trips',
    title: 'Nearby Events & Trips',
    description: 'Local events, activities & exciting trips.',
    icon: 'location',
    color: familyHome.red,
    background: familyHome.redSoft,
    href: routes.community,
    bookable: false,
    showOnHome: true,
  },
  {
    id: 'health-dashboard',
    title: 'Health Dashboard',
    description: 'Track health, reports & medical history.',
    icon: 'medkit-outline',
    color: familyHome.red,
    background: familyHome.redSoft,
    href: routes.health,
    bookable: false,
    showOnHome: true,
  },
  {
    id: 'medicines-delivery',
    title: 'Medicines Delivery',
    description: 'Timely delivery of medicines at home.',
    icon: 'pill',
    color: familyHome.green,
    background: familyHome.greenSoft,
    href: routes.meds,
    bookable: true,
    showOnHome: true,
  },
  {
    id: 'house-safety',
    title: 'House Safety & Setup',
    description: 'Home safety check & age-friendly setup.',
    icon: 'shield-checkmark-outline',
    color: familyHome.orange,
    background: familyHome.orangeSoft,
    href: routes.servicesAll,
    bookable: true,
    showOnHome: false,
  },
  {
    id: 'house-repair',
    title: 'House Repair Work',
    description: 'Repairs & maintenance services at home.',
    icon: 'settings-outline',
    color: familyHome.blue,
    background: familyHome.blueSoft,
    href: routes.servicesAll,
    bookable: true,
    showOnHome: false,
  },
  {
    id: 'meal-plan',
    title: 'Meal Plan',
    description: 'Personalized meal plan for better health.',
    icon: 'restaurant-outline',
    color: familyHome.yellow,
    background: familyHome.yellowSoft,
    href: routes.food,
    bookable: true,
    showOnHome: false,
  },
  {
    id: 'care-manager-visit',
    title: 'Care Manager Visit',
    description: 'Regular visits & personal supervision.',
    icon: 'people-outline',
    color: familyHome.green,
    background: familyHome.greenSoft,
    href: routes.companion,
    bookable: true,
    showOnHome: false,
  },
  {
    id: 'body-checkup',
    title: 'Complete Body Check-up',
    description: 'Full body health check-up at home or lab.',
    icon: 'medkit-outline',
    color: familyHome.blue,
    background: familyHome.blueSoft,
    href: routes.health,
    bookable: true,
    showOnHome: false,
  },
  {
    id: 'physiotherapy',
    title: 'Physiotherapist Packages',
    description: 'Physiotherapy sessions at home.',
    icon: 'sparkles',
    color: familyHome.purple,
    background: familyHome.purpleSoft,
    href: routes.servicesAll,
    bookable: true,
    showOnHome: false,
  },
  {
    id: 'testing-lab',
    title: 'Testing Lab',
    description: 'Home sample collection & lab tests.',
    icon: 'flask-outline',
    color: familyHome.blue,
    background: familyHome.blueSoft,
    href: routes.health,
    bookable: true,
    showOnHome: false,
  },
  {
    id: 'nursing',
    title: 'Nursing',
    description: 'Professional nursing care at home.',
    icon: 'medkit-outline',
    color: familyHome.purple,
    background: familyHome.purpleSoft,
    href: routes.servicesAll,
    bookable: true,
    showOnHome: false,
  },
  {
    id: 'specialist-doctor',
    title: 'Specialist Doctor Visit',
    description: 'Consult specialist doctors at home.',
    icon: 'doctor',
    color: familyHome.red,
    background: familyHome.redSoft,
    href: routes.doctor,
    bookable: true,
    showOnHome: false,
  },
];

export function homeMarketplaceServices(): MarketplaceService[] {
  return MARKETPLACE_SERVICES.filter((item) => item.showOnHome);
}

export function allMarketplaceServices(): MarketplaceService[] {
  return MARKETPLACE_SERVICES;
}
