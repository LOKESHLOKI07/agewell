import type { Href } from 'expo-router';
import type { IconName } from '@/components/ui';
import { ApiError, getApiErrorMessage } from '@/api/errors';
import { formatTime } from '@/utils/date';
import { findActiveEmergency } from './mappers';
import type { EmergencyCase, EmergencyStatus, EmergencyType } from './types/emergency';

export interface EmergencyTypeOption {
  type: EmergencyType;
  title: string;
  accessibilityLabel: string;
  icon: IconName;
}

export const EMERGENCY_TYPE_OPTIONS: readonly EmergencyTypeOption[] = [
  {
    type: 'MEDICAL',
    title: 'Medical Emergency',
    accessibilityLabel: 'Medical Emergency',
    icon: 'medkit-outline',
  },
  {
    type: 'HOSPITAL',
    title: 'Hospital Assistance',
    accessibilityLabel: 'Hospital Assistance',
    icon: 'business-outline',
  },
  {
    type: 'CARE_MANAGER',
    title: 'Care Manager Assistance',
    accessibilityLabel: 'Care Manager Assistance',
    icon: 'people-outline',
  },
  {
    type: 'AGEWELL_SUPPORT',
    title: 'AgeWell Support',
    accessibilityLabel: 'AgeWell Support',
    icon: 'call-outline',
  },
];

const STATUS_LABELS: Record<EmergencyStatus, string> = {
  OPEN: 'Open',
  ACKNOWLEDGED: 'Acknowledged',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'Assistance in progress',
  RESOLVED: 'Resolved',
  CANCELLED: 'Cancelled',
};

const TRIGGER_LABELS: Record<string, string> = {
  APP_SOS: 'App SOS Button',
  HOME_PANIC_BUTTON: 'Home Panic Button',
};

export const RECIPIENT_CHIP_META: { role: string; label: string; icon: IconName }[] = [
  { role: 'FAMILY', label: 'Family Members', icon: 'people-outline' },
  { role: 'CARE_MANAGER', label: 'Care Manager', icon: 'account-circle' },
  { role: 'COMPANION', label: 'Companion', icon: 'people' },
  { role: 'AGEWELL_SUPPORT', label: 'AgeWell Support', icon: 'call-outline' },
];

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function emergencyTypeLabel(type: EmergencyType): string {
  return EMERGENCY_TYPE_OPTIONS.find((item) => item.type === type)?.title ?? type;
}

export function emergencyStatusLabel(status: EmergencyStatus): string {
  return STATUS_LABELS[status];
}

export function triggerSourceLabel(source: string | null | undefined): string {
  if (!source) {
    return 'App SOS Button';
  }
  return TRIGGER_LABELS[source] ?? source.replace(/_/g, ' ');
}

export function recipientStatusLabel(
  status: string,
  respondedAt?: string | null,
  notifiedAt?: string | null,
): string {
  if (status === 'RESPONDED') {
    return respondedAt ? `Responded at ${formatTime(respondedAt)}` : 'Responded';
  }
  if (!notifiedAt) {
    return 'Standing by';
  }
  return 'Alert sent';
}

export function formatEmergencyClock(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return formatTime(value);
}

export function formatEmergencyWhen(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()} • ${formatTime(value)}`;
}

export function emergencyDetailHref(id: string) {
  return { pathname: '/emergency/[id]' as const, params: { id } };
}

export function emergencyHelpHref(): Href {
  return '/emergency' as Href;
}

export function emergencyBannerHref(active: EmergencyCase | null): Href {
  if (active) {
    return emergencyDetailHref(active.id) as unknown as Href;
  }
  return emergencyHelpHref();
}

export function emergencyBannerCopy(active: EmergencyCase | null) {
  if (active) {
    return {
      title: 'Emergency Assistance Active',
      subtitle: 'View Emergency Status',
      accessibilityLabel: 'Emergency Assistance Active. View Emergency Status',
    };
  }
  return {
    title: 'Emergency Help',
    subtitle: 'Press for immediate assistance',
    accessibilityLabel: 'Emergency Help. Press for immediate assistance',
  };
}

export function canSubmitEmergency(isPending: boolean): boolean {
  return !isPending;
}

export function getEmergencyLoadErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return getApiErrorMessage(error);
}

export function getEmergencyCreateErrorMessage(error: unknown): string {
  const status = error instanceof ApiError ? error.status : undefined;
  if (status === undefined) {
    return 'Unable to create emergency request. Please check your connection and try again.';
  }
  if (error instanceof ApiError) {
    return error.message;
  }
  return getApiErrorMessage(error);
}

export { findActiveEmergency };
