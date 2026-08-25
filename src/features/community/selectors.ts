import { ApiError, getApiErrorMessage } from '@/api/errors';
import type { AuthRole } from '@/features/auth/authTypes';
import { FAMILY_FORBIDDEN_MESSAGE } from '@/features/family/selectors';
import type { SeniorProfile } from '@/features/home/types/home';
import { formatTime } from '@/utils/date';
import type { CommunityEvent, EventRegistration } from './types';

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function canUseCommunity(role: AuthRole | null | undefined): boolean {
  return role === 'SENIOR' || role === 'FAMILY' || role === 'ADMIN' || role === 'OPERATIONS';
}

export function communityEventHref(id: string) {
  return { pathname: '/community/events/[id]' as const, params: { id } };
}

export function familyCommunityEventHref(id: string) {
  return { pathname: '/family/community/events/[id]' as const, params: { id } };
}

export function adminCommunityHref(id: string) {
  return `/(admin)/community/${id}` as const;
}

export function adminCommunityCreateHref() {
  return '/(admin)/community/new' as const;
}

export function formatEventDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatEventTime(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return formatTime(value);
}

export function capacityLabel(capacity: number | null | undefined): string {
  if (capacity === null || capacity === undefined) {
    return 'No capacity limit';
  }
  return `Capacity: ${capacity}`;
}

export function eventTitle(event: Pick<CommunityEvent, 'title'> | Pick<EventRegistration, 'eventTitle'>): string {
  if ('title' in event) {
    return event.title?.trim() || 'Community event';
  }
  return event.eventTitle?.trim() || 'Community event';
}

export function isActiveRegistration(registration: EventRegistration): boolean {
  return registration.status === 'REGISTERED';
}

export function activeRegistrationForEvent(
  registrations: EventRegistration[],
  eventId: string,
  userId?: string | null,
): EventRegistration | null {
  return (
    registrations.find((item) => {
      if (item.eventId !== eventId || !isActiveRegistration(item)) {
        return false;
      }
      if (userId) {
        return item.userId === userId;
      }
      return true;
    }) ?? null
  );
}

export function registrationsForUser(
  registrations: EventRegistration[],
  userId?: string | null,
): EventRegistration[] {
  if (!userId) {
    return registrations;
  }
  return registrations.filter((item) => item.userId === userId);
}

export function eventDateForRegistration(
  registration: EventRegistration,
  events: CommunityEvent[],
): string | null {
  return events.find((event) => event.id === registration.eventId)?.eventDate ?? null;
}

export function isAuthorizedFamilySenior(seniors: SeniorProfile[], seniorId: string | null | undefined): boolean {
  if (!seniorId) {
    return false;
  }
  return seniors.some((senior) => senior.id === seniorId);
}

export function toEventDateIso(date: string, time: string): string {
  return `${date}T${time}:00+05:30`;
}

export function eventDateToForm(value: string | null | undefined): { date: string; time: string } {
  if (!value) {
    return { date: '', time: '' };
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { date: '', time: '' };
  }
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
}

export function getCommunityErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return FAMILY_FORBIDDEN_MESSAGE;
    }
    return error.message;
  }
  return getApiErrorMessage(error);
}
