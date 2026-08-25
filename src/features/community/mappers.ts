import { toListPage } from '@/features/home/api/mappers';
import type { ListPage } from '@/features/home/types/home';
import type {
  CommunityEvent,
  CommunityEventResponse,
  CommunityEventUpdate,
  CommunityEventWrite,
  EventRegistration,
  EventRegistrationResponse,
  RegistrationStatus,
} from './types';

function asRecord(payload: unknown, label: string): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    throw new Error(`Invalid ${label}`);
  }
  return payload as Record<string, unknown>;
}

function asId(value: unknown, label: string): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  throw new Error(`Invalid ${label}`);
}

function asOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asOptionalNumber(value: unknown): number | null {
  return typeof value === 'number' && !Number.isNaN(value) ? value : null;
}

function asStatus(value: unknown): RegistrationStatus {
  if (value === 'REGISTERED' || value === 'CANCELLED') {
    return value;
  }
  throw new Error('Invalid registration status');
}

export function toCommunityEvent(payload: unknown): CommunityEvent {
  const data = asRecord(payload, 'community event') as unknown as CommunityEventResponse;
  return {
    id: asId(data.id, 'event.id'),
    title: asOptionalString(data.title),
    description: asOptionalString(data.description),
    eventDate: asOptionalString(data.event_date),
    capacity: asOptionalNumber(data.capacity),
  };
}

export function toCommunityEvents(payload: unknown): ListPage<CommunityEvent> {
  return toListPage(payload, toCommunityEvent, 'community events');
}

export function toEventRegistration(payload: unknown): EventRegistration {
  const data = asRecord(payload, 'event registration') as unknown as EventRegistrationResponse;
  return {
    id: asId(data.id, 'registration.id'),
    eventId: asId(data.event_id, 'registration.event_id'),
    userId: asId(data.user_id, 'registration.user_id'),
    status: asStatus(data.status),
    eventTitle: asOptionalString(data.event_title),
  };
}

export function toEventRegistrations(payload: unknown): ListPage<EventRegistration> {
  return toListPage(payload, toEventRegistration, 'event registrations');
}

export function toCommunityEventCreateBody(input: CommunityEventWrite) {
  return {
    title: input.title,
    description: input.description ?? null,
    event_date: input.eventDate,
    capacity: input.capacity ?? null,
  };
}

export function toCommunityEventUpdateBody(input: CommunityEventUpdate) {
  const body: Record<string, unknown> = {};
  if (input.title !== undefined) {
    body.title = input.title;
  }
  if (input.description !== undefined) {
    body.description = input.description;
  }
  if (input.eventDate !== undefined) {
    body.event_date = input.eventDate;
  }
  if (input.capacity !== undefined) {
    body.capacity = input.capacity;
  }
  return body;
}

export function toRegisterBody(seniorId?: string) {
  if (seniorId) {
    return { senior_id: seniorId };
  }
  return {};
}

export function toCancelRegistrationBody() {
  return { status: 'CANCELLED' as const };
}
