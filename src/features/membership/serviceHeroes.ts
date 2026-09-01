import type { ImageSourcePropType } from 'react-native';

/** Bundled flat hero art for membership service screens (slug → asset). */
export const SERVICE_HERO_IMAGES: Record<string, ImageSourcePropType> = {
  'emergency-sos': require('../../../assets/services/hero-emergency-sos.png'),
  'care-manager': require('../../../assets/services/hero-care-manager.png'),
  companion: require('../../../assets/services/hero-companion.png'),
  grocery: require('../../../assets/services/hero-grocery.png'),
  food: require('../../../assets/services/hero-food.png'),
  medicine: require('../../../assets/services/hero-medicine.png'),
  'lab-testing': require('../../../assets/services/hero-lab-testing.png'),
  'monthly-blood-test': require('../../../assets/services/hero-monthly-blood-test.png'),
  doctor: require('../../../assets/services/hero-doctor.png'),
  'medical-history': require('../../../assets/services/hero-medical-history.png'),
  'tech-assistance': require('../../../assets/services/hero-tech-assistance.png'),
  'events-trips': require('../../../assets/services/hero-events-trips.png'),
  legal: require('../../../assets/services/hero-legal.png'),
  ca: require('../../../assets/services/hero-ca.png'),
  transport: require('../../../assets/services/hero-transport.png'),
  'home-repair': require('../../../assets/services/hero-home-repair.png'),
  pooja: require('../../../assets/services/hero-pooja.png'),
  'home-inspection': require('../../../assets/services/hero-home-inspection.png'),
  cctv: require('../../../assets/services/hero-cctv.png'),
};

/** Optional board-style hero copy overrides (title + supporting line). */
export const SERVICE_HERO_COPY: Record<string, { headline: string; subtitle: string }> = {
  transport: {
    headline: 'Safe & Comfortable Outstation Travel.',
    subtitle: 'One way / Round trip · Local / Station',
  },
  'home-repair': {
    headline: 'Home Maintenance',
    subtitle: 'Plumbing · Electrical · Carpentry · AC Service',
  },
  pooja: {
    headline: 'Pooja Cart',
    subtitle: 'All items for pooja available.',
  },
  'home-inspection': {
    headline: 'Monthly Home Inspection',
    subtitle: 'Safety check of your home.',
  },
  cctv: {
    headline: 'CCTV Dashboard',
    subtitle: 'Live entrance camera coverage.',
  },
  grocery: {
    headline: 'Grocery Delivery',
    subtitle: 'Catalogue, cart or upload a shopping list.',
  },
  food: {
    headline: 'Home-style Meals',
    subtitle: 'Maharashtrian, Gujarati and South Indian.',
  },
  medicine: {
    headline: 'Medicine Delivery',
    subtitle: 'Upload prescription · home delivery.',
  },
  'emergency-sos': {
    headline: 'Emergency SOS',
    subtitle: '24×7 alert to family, Care Manager and companion.',
  },
};
