export type RegistrationStatus = 'REGISTERED' | 'CANCELLED';

export interface CommunityEvent {
  id: string;
  title: string | null;
  description: string | null;
  eventDate: string | null;
  capacity: number | null;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  eventTitle: string | null;
}

export interface CommunityEventWrite {
  title: string;
  description?: string | null;
  eventDate: string;
  capacity?: number | null;
}

export interface CommunityEventUpdate {
  title?: string;
  description?: string | null;
  eventDate?: string;
  capacity?: number | null;
}

export interface CommunityEventResponse {
  id: string;
  title?: string | null;
  description?: string | null;
  event_date?: string | null;
  capacity?: number | null;
}

export interface EventRegistrationResponse {
  id: string;
  event_id: string;
  user_id: string;
  status: RegistrationStatus;
  event_title?: string | null;
}
