/** Must stay aligned with apps/api membership_catalog.py slugs (21 Single). */
import type { Href } from 'expo-router';

export type AdminInboxKey =
  | 'emergencies'
  | 'visits'
  | 'orders'
  | 'appointments'
  | 'requests'
  | 'community'
  | 'records'
  | 'special';

export type MembershipOpsEntry = {
  slug: string;
  adminInbox: AdminInboxKey;
  adminLabel: string;
  adminHref: Href | null;
  note: string;
};

export const MEMBERSHIP_OPS_MAP: MembershipOpsEntry[] = [
  {
    slug: 'emergency-sos',
    adminInbox: 'emergencies',
    adminLabel: 'Emergencies',
    adminHref: '/(admin)/emergencies' as Href,
    note: 'SOS creates an emergency case. Cover image on the service; optional info cards under Service items.',
  },
  {
    slug: 'care-manager',
    adminInbox: 'visits',
    adminLabel: 'Service items',
    adminHref: '/(admin)/catalog/offerings/care-manager' as Href,
    note: 'Visit packages under Service items; assignments in Visits.',
  },
  {
    slug: 'companion',
    adminInbox: 'visits',
    adminLabel: 'Service items',
    adminHref: '/(admin)/catalog/offerings/companion' as Href,
    note: 'Companion cards under Service items; assignments in Visits.',
  },
  {
    slug: 'medicine',
    adminInbox: 'orders',
    adminLabel: 'Service items',
    adminHref: '/(admin)/catalog/offerings/medicine' as Href,
    note: 'Prescription upload + catalogue packages under Service items.',
  },
  {
    slug: 'health-check',
    adminInbox: 'appointments',
    adminLabel: 'Service items',
    adminHref: '/(admin)/catalog/offerings/health-check' as Href,
    note: 'Monthly vitals packages under Service items.',
  },
  {
    slug: 'monthly-blood-test',
    adminInbox: 'appointments',
    adminLabel: 'Service items',
    adminHref: '/(admin)/catalog/offerings/monthly-blood-test' as Href,
    note: 'Monthly test catalogue cards under Service items.',
  },
  {
    slug: 'doctor',
    adminInbox: 'appointments',
    adminLabel: 'Service items',
    adminHref: '/(admin)/catalog/offerings/doctor' as Href,
    note: 'Doctor profiles and photos under Service items.',
  },
  {
    slug: 'grocery',
    adminInbox: 'orders',
    adminLabel: 'Grocery catalog',
    adminHref: '/(admin)/catalog/grocery' as Href,
    note: 'Cart / photo list orders. Product menu is edited in Grocery catalog.',
  },
  {
    slug: 'small-errands',
    adminInbox: 'visits',
    adminLabel: 'Service items',
    adminHref: '/(admin)/catalog/offerings/small-errands' as Href,
    note: 'Errand topics under Service items; fulfilled with companion visits.',
  },
  {
    slug: 'errand-coordination',
    adminInbox: 'requests',
    adminLabel: 'Service items',
    adminHref: '/(admin)/catalog/offerings/errand-coordination' as Href,
    note: 'Coordination request cards under Service items.',
  },
  {
    slug: 'cyber-security',
    adminInbox: 'requests',
    adminLabel: 'Service items',
    adminHref: '/(admin)/catalog/offerings/cyber-security' as Href,
    note: 'Scam / OTP guidance topics under Service items.',
  },
  {
    slug: 'banking-companion',
    adminInbox: 'visits',
    adminLabel: 'Service items',
    adminHref: '/(admin)/catalog/offerings/banking-companion' as Href,
    note: 'Bank visit packages under Service items.',
  },
  {
    slug: 'ca',
    adminInbox: 'requests',
    adminLabel: 'Service items',
    adminHref: '/(admin)/catalog/offerings/ca' as Href,
    note: 'CA offer cards under Service items.',
  },
  {
    slug: 'events-trips',
    adminInbox: 'community',
    adminLabel: 'Service items',
    adminHref: '/(admin)/catalog/offerings/events-trips' as Href,
    note: 'Events and trips catalogue with images.',
  },
  {
    slug: 'home-repair',
    adminInbox: 'requests',
    adminLabel: 'Service items',
    adminHref: '/(admin)/catalog/offerings/home-repair' as Href,
    note: 'Repair categories with optional images.',
  },
  {
    slug: 'pooja',
    adminInbox: 'orders',
    adminLabel: 'Service items',
    adminHref: '/(admin)/catalog/offerings/pooja' as Href,
    note: 'Pooja packages with images.',
  },
  {
    slug: 'legal',
    adminInbox: 'requests',
    adminLabel: 'Service items',
    adminHref: '/(admin)/catalog/offerings/legal' as Href,
    note: 'Legal offer cards under Service items.',
  },
  {
    slug: 'local-transport',
    adminInbox: 'requests',
    adminLabel: 'Service items',
    adminHref: '/(admin)/catalog/offerings/local-transport' as Href,
    note: 'Local cab / rickshaw coordination packages.',
  },
  {
    slug: 'transport',
    adminInbox: 'requests',
    adminLabel: 'Service items',
    adminHref: '/(admin)/catalog/offerings/transport' as Href,
    note: 'Outstation transport packages under Service items.',
  },
  {
    slug: 'home-inspection',
    adminInbox: 'special',
    adminLabel: 'Service items',
    adminHref: '/(admin)/catalog/offerings/home-inspection' as Href,
    note: 'Inspection info cards under Service items.',
  },
  {
    slug: 'cctv',
    adminInbox: 'special',
    adminLabel: 'Service items',
    adminHref: '/(admin)/catalog/offerings/cctv' as Href,
    note: 'CCTV info cards under Service items.',
  },
];

export function findMembershipOps(slug: string | null | undefined): MembershipOpsEntry | null {
  if (!slug) {
    return null;
  }
  return MEMBERSHIP_OPS_MAP.find((item) => item.slug === slug) ?? null;
}
