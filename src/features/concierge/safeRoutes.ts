import type { Href } from 'expo-router';

/** Real Expo routes the bot is allowed to open. */
const SAFE_HREFS = new Set<string>([
  '/(tabs)/sos',
  '/(tabs)/services',
  '/(tabs)/orders',
  '/(tabs)/community',
  '/(tabs)/profile',
  '/(tabs)/health',
  '/health',
  '/membership/care-manager',
  '/membership/companion',
  '/membership/medicine',
  '/membership/health-check',
  '/membership/monthly-blood-test',
  '/membership/doctor',
  '/membership/grocery',
  '/membership/small-errands',
  '/membership/errand-coordination',
  '/membership/cyber-security',
  '/membership/banking-companion',
  '/membership/ca',
  '/membership/events-trips',
  '/membership/home-repair',
  '/membership/pooja',
  '/membership/legal',
  '/membership/local-transport',
  '/membership/transport',
  '/membership/personalised-diet-plan',
  '/membership/home-inspection',
  '/membership/cctv',
]);

const ALIASES: Record<string, string> = {
  cctv: '/membership/cctv',
  '/cctv': '/membership/cctv',
  '/membership/cctv-dashboard': '/membership/cctv',
  'cctv dashboard': '/membership/cctv',
  sos: '/(tabs)/sos',
  emergency: '/(tabs)/sos',
  health: '/health',
  services: '/(tabs)/services',
};

export function resolveConciergeHref(raw: string | null | undefined): Href | null {
  if (!raw?.trim()) return null;
  const value = raw.trim();
  const normalized = value.toLowerCase().replace(/\/$/, '');

  if (ALIASES[normalized]) {
    return ALIASES[normalized] as Href;
  }
  if (SAFE_HREFS.has(value)) {
    return value as Href;
  }
  if (SAFE_HREFS.has(normalized)) {
    return normalized as Href;
  }
  // bare membership slug
  const membershipPath = normalized.startsWith('/membership/')
    ? normalized
    : `/membership/${normalized.replace(/^\//, '')}`;
  if (SAFE_HREFS.has(membershipPath)) {
    return membershipPath as Href;
  }
  return null;
}
