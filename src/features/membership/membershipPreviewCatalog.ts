import type { IconName } from '@/components/ui';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { MARKETPLACE_SERVICES } from '@/features/services/serviceCatalog';
import { SERVICE_HERO_COPY } from './serviceHeroes';

export type MembershipPreviewBenefit = {
  icon: IconName;
  title: string;
  line: string;
  bg: string;
  color: string;
};

export type MembershipPreviewCopy = {
  title: string;
  description: string;
  videoTitle: string;
  videoSearch: string;
  membershipBody: string;
  benefits: MembershipPreviewBenefit[];
};

const DEFAULT_BENEFITS: MembershipPreviewBenefit[] = [
  {
    icon: 'calendar-outline',
    title: 'Regular support',
    line: 'Scheduled help coordinated around your needs',
    bg: familyHome.greenSoft,
    color: familyHome.green,
  },
  {
    icon: 'headset',
    title: 'Service coordination',
    line: 'Your Care Manager helps you access AgeWell services',
    bg: familyHome.blueSoft,
    color: familyHome.blue,
  },
  {
    icon: 'people-outline',
    title: 'Personalised care',
    line: 'Support that understands your unique needs',
    bg: familyHome.orangeSoft,
    color: familyHome.orange,
  },
  {
    icon: 'heart-outline',
    title: 'Always available',
    line: 'Here for you and your family during emergencies',
    bg: familyHome.redSoft,
    color: familyHome.red,
  },
];

const CARE_MANAGER_BENEFITS: MembershipPreviewBenefit[] = [
  {
    icon: 'calendar-outline',
    title: 'Regular Visits',
    line: 'Monthly visits to check your well-being',
    bg: familyHome.greenSoft,
    color: familyHome.green,
  },
  {
    icon: 'headset',
    title: 'Service Coordination',
    line: 'Helps you access all AgeWell services',
    bg: familyHome.blueSoft,
    color: familyHome.blue,
  },
  {
    icon: 'people-outline',
    title: 'Personalised Support',
    line: 'Understands your unique needs',
    bg: familyHome.orangeSoft,
    color: familyHome.orange,
  },
  {
    icon: 'heart-outline',
    title: 'Always Available',
    line: 'Here for you during emergencies',
    bg: familyHome.redSoft,
    color: familyHome.red,
  },
];

const OVERRIDES: Partial<Record<string, Partial<MembershipPreviewCopy> & { benefits?: MembershipPreviewBenefit[] }>> = {
  'care-manager': {
    description:
      'Our Care Managers understand your needs, coordinate services and ensure you always have the right support. Watch this short video to learn how our Care Manager service helps you and your family in everyday life.',
    videoTitle: 'What is AgeWell Care Manager Service?',
    videoSearch: 'Meet Our Care Managers AgeWell',
    membershipBody:
      'Get a dedicated Care Manager, regular visits, service coordination and personalised support with our membership plans.',
    benefits: CARE_MANAGER_BENEFITS,
  },
  'emergency-sos': {
    videoTitle: 'AgeWell Emergency Support',
    membershipBody: 'Get 24×7 SOS alerts to family, Care Manager and companion with an AgeWell membership.',
  },
  companion: {
    videoTitle: 'AgeWell Companion Support',
    membershipBody: 'Become a member for 20 companion visits a month and emergency companion cover.',
  },
  medicine: {
    videoTitle: 'AgeWell Medicine Delivery',
    membershipBody: 'Members can upload a prescription and receive medicine delivery at home.',
  },
  'health-check': {
    videoTitle: 'AgeWell Monthly Health Checks',
    membershipBody: 'Members get monthly BP, pulse, SpO₂, temperature and blood sugar checks at home.',
  },
  'monthly-blood-test': {
    videoTitle: 'AgeWell Monthly Blood Test',
    membershipBody: 'Members receive one CBC a month with home collection. Extra tests are available at cost.',
  },
  doctor: {
    videoTitle: 'AgeWell Doctor Visit',
    membershipBody: 'Members receive a monthly doctor visit to review health and reports.',
  },
  'personalised-diet-plan': {
    videoTitle: 'AgeWell Personalised Diet Plan',
    membershipBody: 'Members receive nutrition guidance tailored to their health needs and preferences.',
  },
  grocery: {
    videoTitle: 'AgeWell Grocery Delivery',
    membershipBody: 'Members can order groceries from the catalogue or upload a handwritten list.',
  },
  'small-errands': {
    videoTitle: 'AgeWell Small Errands Assistance',
    membershipBody: 'Members can request companion help for small household errands.',
  },
  'errand-coordination': {
    videoTitle: 'AgeWell Other Errands Assistance',
    membershipBody: 'Members get help coordinating ironing, haircuts and other personal services.',
  },
  'banking-companion': {
    videoTitle: 'AgeWell Banking Companion',
    membershipBody: 'Members get a trusted companion for banking errands and paperwork.',
  },
  'events-trips': {
    videoTitle: 'AgeWell Local Events and Trips',
    membershipBody: 'Members can join local events, AgeWell tours and companion-supported outings.',
  },
  'cyber-security': {
    videoTitle: 'AgeWell Cyber Security Guidance',
    membershipBody: 'Members get help staying safe from online fraud and digital risks.',
  },
  ca: {
    videoTitle: 'AgeWell CA Assistance',
    membershipBody: 'Members can get ITR filing and financial guidance through trusted CA partners.',
  },
  legal: {
    videoTitle: 'AgeWell Legal Assistance',
    membershipBody: 'Members can get expert legal advice for important family and property matters.',
  },
  'home-repair': {
    videoTitle: 'AgeWell House Maintenance',
    membershipBody: 'Members can request reliable home maintenance for a safer, more comfortable home.',
  },
  'local-transport': {
    videoTitle: 'AgeWell Local Area Transport',
    membershipBody: 'Members get companion-supported coordination between cabs and rickshaws.',
  },
  transport: {
    videoTitle: 'AgeWell Outstation Transport',
    membershipBody: 'Members can request well-trained driver assistance for outstation trips.',
  },
  pooja: {
    videoTitle: 'AgeWell House Pooja Assistance',
    membershipBody: 'Members can request complete support for house pooja and spiritual care.',
  },
  cctv: {
    videoTitle: 'AgeWell CCTV Dashboard',
    membershipBody: 'Members can view entrance CCTV coverage and activity from the AgeWell app.',
  },
};

export function getMembershipPreviewCopy(slug: string, fallbackTitle?: string): MembershipPreviewCopy {
  const service = MARKETPLACE_SERVICES.find((item) => item.id === slug);
  const hero = SERVICE_HERO_COPY[slug];
  const override = OVERRIDES[slug] ?? {};
  const title = override.title ?? fallbackTitle ?? hero?.headline ?? service?.title ?? slug;
  const description =
    override.description ?? hero?.subtitle ?? service?.description ?? 'Available to AgeWell members in your area.';
  const videoTitle = override.videoTitle ?? `What is AgeWell ${title}?`;
  return {
    title,
    description,
    videoTitle,
    videoSearch: override.videoSearch ?? `${videoTitle} AgeWell`,
    membershipBody:
      override.membershipBody ?? `${title} is available to active AgeWell members in your service area.`,
    benefits: override.benefits ?? DEFAULT_BENEFITS,
  };
}
