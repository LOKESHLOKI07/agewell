import { isServiceCompanionKind } from '@/features/care/staffKind';
import { MARKETPLACE_SERVICES } from './serviceCatalog';

export const POLICY_ROLES = ['CARE_MANAGER', 'COMPANION', 'SERVICE_COMPANION', 'ADMIN'] as const;

export type PolicyRole = (typeof POLICY_ROLES)[number];

export type ServicePolicy = {
  slug: string;
  responsible: readonly PolicyRole[];
  finishers: readonly PolicyRole[];
  tracksLocation: boolean;
  photoRequired: boolean;
};

function policy(
  slug: string,
  responsible: readonly PolicyRole[],
  finishers: readonly PolicyRole[],
  flags: { tracksLocation?: boolean; photoRequired?: boolean } = {},
): ServicePolicy {
  return {
    slug,
    responsible,
    finishers,
    tracksLocation: flags.tracksLocation === true,
    photoRequired: flags.photoRequired === true,
  };
}

export const SERVICE_POLICIES: Record<string, ServicePolicy> = {
  'emergency-sos': policy('emergency-sos', ['CARE_MANAGER', 'COMPANION', 'ADMIN'], ['CARE_MANAGER', 'ADMIN'], {
    tracksLocation: true,
    photoRequired: true,
  }),
  'care-manager': policy('care-manager', ['CARE_MANAGER', 'ADMIN'], ['CARE_MANAGER']),
  companion: policy('companion', ['CARE_MANAGER', 'COMPANION'], ['COMPANION']),
  medicine: policy('medicine', ['COMPANION', 'SERVICE_COMPANION'], ['SERVICE_COMPANION'], {
    tracksLocation: true,
    photoRequired: true,
  }),
  'health-check': policy('health-check', ['CARE_MANAGER', 'COMPANION'], ['COMPANION'], { photoRequired: true }),
  'monthly-blood-test': policy('monthly-blood-test', ['CARE_MANAGER', 'COMPANION'], ['COMPANION'], {
    photoRequired: true,
  }),
  doctor: policy('doctor', ['CARE_MANAGER', 'COMPANION'], ['COMPANION'], { photoRequired: true }),
  'personalised-diet-plan': policy('personalised-diet-plan', ['ADMIN'], ['ADMIN'], { photoRequired: true }),
  grocery: policy('grocery', ['COMPANION', 'SERVICE_COMPANION'], ['SERVICE_COMPANION'], {
    tracksLocation: true,
    photoRequired: true,
  }),
  'small-errands': policy('small-errands', ['COMPANION', 'SERVICE_COMPANION'], ['SERVICE_COMPANION']),
  'errand-coordination': policy(
    'errand-coordination',
    ['COMPANION', 'SERVICE_COMPANION'],
    ['COMPANION', 'SERVICE_COMPANION'],
  ),
  'banking-companion': policy(
    'banking-companion',
    ['COMPANION', 'SERVICE_COMPANION'],
    ['COMPANION', 'SERVICE_COMPANION'],
  ),
  'events-trips': policy('events-trips', ['ADMIN'], ['ADMIN']),
  'cyber-security': policy('cyber-security', ['CARE_MANAGER', 'ADMIN'], ['CARE_MANAGER', 'ADMIN']),
  ca: policy('ca', ['ADMIN'], ['ADMIN']),
  legal: policy('legal', ['ADMIN'], ['ADMIN']),
  'home-repair': policy('home-repair', ['CARE_MANAGER', 'COMPANION', 'ADMIN'], ['COMPANION'], { photoRequired: true }),
  'local-transport': policy(
    'local-transport',
    ['CARE_MANAGER', 'COMPANION', 'ADMIN'],
    ['COMPANION', 'ADMIN'],
    { tracksLocation: true },
  ),
  transport: policy('transport', ['CARE_MANAGER', 'COMPANION', 'ADMIN'], ['COMPANION', 'ADMIN'], {
    tracksLocation: true,
  }),
  pooja: policy('pooja', ['CARE_MANAGER', 'ADMIN'], ['ADMIN']),
  cctv: policy('cctv', ['ADMIN'], ['ADMIN']),
};

export function getServicePolicy(slug: string | null | undefined): ServicePolicy | null {
  if (!slug) {
    return null;
  }
  return SERVICE_POLICIES[slug] ?? null;
}

export function tracksEmployeeLocation(slug: string | null | undefined): boolean {
  return getServicePolicy(slug)?.tracksLocation === true;
}

export function requiresProofPhoto(slug: string | null | undefined): boolean {
  return getServicePolicy(slug)?.photoRequired === true;
}

export function policyRoleForStaffKind(staffKind: string | null | undefined): PolicyRole | null {
  if (isServiceCompanionKind(staffKind)) {
    return 'SERVICE_COMPANION';
  }
  if (staffKind === 'COMPANION') {
    return 'COMPANION';
  }
  if (staffKind === 'CARE_MANAGER' || !staffKind) {
    return 'CARE_MANAGER';
  }
  return null;
}

export function roleCanFinish(slug: string | null | undefined, role: PolicyRole | null): boolean {
  const policy = getServicePolicy(slug);
  if (!policy || !role) {
    return true;
  }
  return policy.finishers.includes(role);
}

export function staffCanBeAssignedToService(
  slug: string | null | undefined,
  staff: { staffKind?: string | null; companionServiceSlugs?: readonly string[] | null },
): boolean {
  const policy = getServicePolicy(slug);
  const role = policyRoleForStaffKind(staff.staffKind);
  if (!policy || !role) {
    return true;
  }
  if (!policy.responsible.includes(role)) {
    return false;
  }
  if (role === 'SERVICE_COMPANION') {
    const covered = (staff.companionServiceSlugs ?? []).filter(Boolean);
    if (covered.length > 0 && slug && !covered.includes(slug)) {
      return false;
    }
  }
  return true;
}

export const SERVICE_POLICY_OPTIONS = MARKETPLACE_SERVICES.map((item) => ({
  value: item.id,
  label: item.title,
}));

const DELIVERY_ASSIGN_SLUGS = new Set(['grocery', 'medicine']);
const DESK_ONLY_SLUGS = new Set([
  'personalised-diet-plan',
  'events-trips',
  'ca',
  'legal',
  'cctv',
  'pooja',
  'cyber-security',
  'emergency-sos',
]);

export function usesDeliveryJob(slug: string | null | undefined): boolean {
  return Boolean(slug && DELIVERY_ASSIGN_SLUGS.has(slug));
}

export function requestNeedsFieldAssign(slug: string | null | undefined): boolean {
  if (!slug || DESK_ONLY_SLUGS.has(slug)) {
    return false;
  }
  return getServicePolicy(slug) != null;
}

/** Standing CM/Companion can be auto-routed (no Confirm assign). Not used for SC-handoff services. */
export function shouldAutoAssignStanding(slug: string | null | undefined): boolean {
  if (!slug || DESK_ONLY_SLUGS.has(slug) || needsServiceCompanionDispatch(slug)) {
    return false;
  }
  const policy = getServicePolicy(slug);
  if (!policy) {
    return false;
  }
  return policy.responsible.includes('CARE_MANAGER') || policy.responsible.includes('COMPANION');
}

export function needsServiceCompanionDispatch(slug: string | null | undefined): boolean {
  if (!slug || DESK_ONLY_SLUGS.has(slug)) {
    return false;
  }
  const policy = getServicePolicy(slug);
  if (!policy) {
    return false;
  }
  return policy.responsible.includes('SERVICE_COMPANION') && policy.finishers.includes('SERVICE_COMPANION');
}

export type DispatchMode = 'none' | 'assign_sc_only' | 'take_or_assign';

export function dispatchModeFor(slug: string | null | undefined): DispatchMode {
  if (!needsServiceCompanionDispatch(slug)) {
    return 'none';
  }
  const policy = getServicePolicy(slug);
  if (!policy) {
    return 'none';
  }
  const finishers = policy.finishers;
  if (finishers.length === 1 && finishers[0] === 'SERVICE_COMPANION') {
    return 'assign_sc_only';
  }
  if (finishers.includes('COMPANION') && finishers.includes('SERVICE_COMPANION')) {
    return 'take_or_assign';
  }
  return 'assign_sc_only';
}
