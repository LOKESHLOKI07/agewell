import type { ImageSourcePropType } from 'react-native';

/** Bundled flat hero art for membership service screens (slug → asset). */
export const SERVICE_HERO_IMAGES: Record<string, ImageSourcePropType> = {
  'emergency-sos': require('../../../assets/services/hero-emergency-sos.png'),
  'care-manager': require('../../../assets/services/hero-care-manager.png'),
  companion: require('../../../assets/services/hero-companion.png'),
  medicine: require('../../../assets/services/hero-medicine.png'),
  'health-check': require('../../../assets/services/hero-lab-testing.png'),
  'monthly-blood-test': require('../../../assets/services/hero-monthly-blood-test.png'),
  doctor: require('../../../assets/services/hero-doctor.png'),
  grocery: require('../../../assets/services/hero-grocery.png'),
  'small-errands': require('../../../assets/services/hero-companion.png'),
  'errand-coordination': require('../../../assets/services/hero-companion.png'),
  'cyber-security': require('../../../assets/services/hero-tech-assistance.png'),
  'tech-assistance': require('../../../assets/services/hero-tech-assistance.png'),
  'banking-companion': require('../../../assets/services/hero-ca.png'),
  ca: require('../../../assets/services/hero-ca.png'),
  'events-trips': require('../../../assets/services/hero-events-trips.png'),
  'home-repair': require('../../../assets/services/hero-home-repair.png'),
  pooja: require('../../../assets/services/hero-pooja.png'),
  legal: require('../../../assets/services/hero-legal.png'),
  'local-transport': require('../../../assets/services/hero-transport.png'),
  transport: require('../../../assets/services/hero-transport.png'),
  'home-inspection': require('../../../assets/services/hero-home-inspection.png'),
  cctv: require('../../../assets/services/hero-cctv.png'),
  // Add-on / legacy extras
  food: require('../../../assets/services/hero-food.png'),
  'lab-testing': require('../../../assets/services/hero-lab-testing.png'),
  'medical-history': require('../../../assets/services/hero-medical-history.png'),
};

/** Optional board-style hero copy overrides (title + supporting line). */
export const SERVICE_HERO_COPY: Record<string, { headline: string; subtitle: string }> = {
  'health-check': {
    headline: 'Monthly Health Check',
    subtitle: 'BP · Pulse · SpO₂ · Temperature · Blood sugar',
  },
  'small-errands': {
    headline: 'Small Errands Assistance',
    subtitle: 'Companion helps with manageable visit errands.',
  },
  'errand-coordination': {
    headline: 'Errand Coordination',
    subtitle: 'Ironing · Haircut · Personal services',
  },
  'cyber-security': {
    headline: 'Cyber Security Guidance',
    subtitle: 'Scams · OTP safety · Fraud follow-up',
  },
  'banking-companion': {
    headline: 'Banking Companion',
    subtitle: 'Pension · Cheque · Passbook · Bank visits',
  },
  'local-transport': {
    headline: 'Local Area Transportation',
    subtitle: 'Cabs and rickshaws with companion coordination.',
  },
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
  companion: {
    headline: 'Companion Visit',
    subtitle: '20 visits a month · up to 30 mins · emergency cover',
  },
  medicine: {
    headline: 'Medicine Delivery',
    subtitle: 'Upload prescription at least 1 day before delivery.',
  },
  'monthly-blood-test': {
    headline: 'Monthly Blood Test',
    subtitle: 'CBC included · LFT, KFT, lipid, thyroid, urine extra',
  },
  'events-trips': {
    headline: 'Local Events & Trips',
    subtitle: 'Nearby events · one supported tour a year (tours extra)',
  },
  grocery: {
    headline: 'Grocery Delivery',
    subtitle: 'Catalogue, cart or upload a handwritten list.',
  },
  food: {
    headline: 'Home-style Meals',
    subtitle: 'Breakfast, lunch, dinner · monthly or daily tiffin.',
  },
  'care-manager': {
    headline: 'Care Manager',
    subtitle: 'Your personal care coordinator.',
  },
  'emergency-sos': {
    headline: 'Emergency Support',
    subtitle: '24×7 alert to family, Care Manager and companion.',
  },
};
