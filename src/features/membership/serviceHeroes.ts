import type { ImageSourcePropType } from 'react-native';

/** Uniform banner size on every membership / add-on service page. */
export const SERVICE_BANNER_HEIGHT = 188;
export const SERVICE_BANNER_RADIUS = 16;

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
  'personalised-diet-plan': require('../../../assets/services/hero-food.png'),
  cctv: require('../../../assets/services/hero-cctv.png'),
  // Add-on / legacy extras
  'emergency-companion': require('../../../assets/services/hero-companion.png'),
  'stool-cleaning': require('../../../assets/services/hero-home-inspection.png'),
  'maid-assistance': require('../../../assets/services/hero-home-repair.png'),
  'ayurvedic-massage': require('../../../assets/services/hero-companion.png'),
  food: require('../../../assets/services/hero-food.png'),
  'lab-testing': require('../../../assets/services/hero-lab-testing.png'),
  'medical-history': require('../../../assets/services/hero-medical-history.png'),
};

/** Optional board-style hero copy overrides (title + supporting line). */
export const SERVICE_HERO_COPY: Record<string, { headline: string; subtitle: string }> = {
  'health-check': {
    headline: 'Monthly Health Checks',
    subtitle: 'BP · Pulse · SpO₂ · Temperature · Blood sugar',
  },
  'small-errands': {
    headline: 'Small Errands Assistance',
    subtitle: 'Our companion will call before the visit and assist with small errands.',
  },
  'errand-coordination': {
    headline: 'Coordination for Other Errands',
    subtitle: 'Ironing · Haircut · Personal services coordination',
  },
  'cyber-security': {
    headline: 'Cyber Security Guidance',
    subtitle: 'Stay aware. Stay safe. We are with you.',
  },
  ca: {
    headline: 'CA Assistance',
    subtitle: 'ITR filing · Financial guidance · Trusted CA partners',
  },
  'banking-companion': {
    headline: 'Your Banking Needs, Our Support',
    subtitle: 'A trusted companion to make your banking errands easier and hassle-free.',
  },
  'local-transport': {
    headline: 'Getting You Where You Need to Be',
    subtitle: 'Companion supported coordination between cabs and rikshaws.',
  },
  transport: {
    headline: 'Travel Further with Peace of Mind',
    subtitle: 'Well-trained driver assistance for outstation trips. Cost as per trip need.',
  },
  'home-repair': {
    headline: 'Your Home, Our Support',
    subtitle: 'Reliable home maintenance for a safer, more comfortable home.',
  },
  pooja: {
    headline: 'House Pooja Assistance',
    subtitle: 'Spiritual care, with complete support.',
  },
  'home-inspection': {
    headline: 'Monthly Home Inspection',
    subtitle: 'Safety check of your home.',
  },
  'personalised-diet-plan': {
    headline: 'Personalised Diet Plan',
    subtitle: 'Nutrition guidance tailored to your health needs.',
  },
  cctv: {
    headline: 'Your Safety Our Priority',
    subtitle: 'Entrance CCTV camera coverage available on-app activity.',
  },
  companion: {
    headline: 'Companion Support',
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
    headline: 'Explore Together, Live Brighter',
    subtitle: 'Local events, AgeWell tours and companion support (tours extra)',
  },
  legal: {
    headline: 'Trusted Legal Support for a Secure Tomorrow',
    subtitle: 'Get expert legal advice and support for your important matters, with confidence and peace of mind.',
  },
  grocery: {
    headline: 'Grocery Delivery',
    subtitle: 'Catalogue, cart or upload a handwritten list.',
  },
  food: {
    headline: 'Tiffin Box',
    subtitle: 'Breakfast, lunch, dinner · monthly or daily home-made tiffin.',
  },
  'care-manager': {
    headline: 'Care Manager',
    subtitle: 'Your personal care coordinator.',
  },
  'emergency-sos': {
    headline: 'Emergency Support',
    subtitle: '24×7 alert to family, Care Manager and companion.',
  },
  'emergency-companion': {
    headline: 'Support When You Need It Most',
    subtitle: 'Hospital companion during hospitalization · 8–10 hours.',
  },
  'stool-cleaning': {
    headline: 'Hygiene Today A Healthier Tomorrow',
    subtitle: 'Morning + evening stool cleaning & servicing.',
  },
  'maid-assistance': {
    headline: 'House Maid',
    subtitle: 'Trained maid for house & utensil cleaning, stock drying.',
  },
  'ayurvedic-massage': {
    headline: 'Ancient Care for a Healthier Tomorrow',
    subtitle: 'Ayurvedic massage at home by certified therapist.',
  },
};
