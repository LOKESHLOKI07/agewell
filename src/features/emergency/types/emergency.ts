export const EMERGENCY_TYPES = ['MEDICAL', 'HOSPITAL', 'CARE_MANAGER', 'AGEWELL_SUPPORT'] as const;
export type EmergencyType = (typeof EMERGENCY_TYPES)[number];

export const EMERGENCY_STATUSES = [
  'OPEN',
  'ACKNOWLEDGED',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'CANCELLED',
] as const;
export type EmergencyStatus = (typeof EMERGENCY_STATUSES)[number];

export const ACTIVE_EMERGENCY_STATUSES: readonly EmergencyStatus[] = [
  'OPEN',
  'ACKNOWLEDGED',
  'ASSIGNED',
  'IN_PROGRESS',
];

export const EMERGENCY_TRIGGER_SOURCES = ['APP_SOS', 'HOME_PANIC_BUTTON'] as const;
export type EmergencyTriggerSource = (typeof EMERGENCY_TRIGGER_SOURCES)[number];

export const EMERGENCY_RECIPIENT_ROLES = ['FAMILY', 'CARE_MANAGER', 'COMPANION', 'AGEWELL_SUPPORT'] as const;
export type EmergencyRecipientRole = (typeof EMERGENCY_RECIPIENT_ROLES)[number];

export const EMERGENCY_RECIPIENT_STATUSES = ['PENDING', 'RESPONDED'] as const;
export type EmergencyRecipientStatus = (typeof EMERGENCY_RECIPIENT_STATUSES)[number];

export const FIRST_RESPONSE_DISPATCH = ['SENT', 'NO_CONTACT', 'FAILED'] as const;
export type FirstResponseDispatch = (typeof FIRST_RESPONSE_DISPATCH)[number];

export interface FirstResponseStatus {
  family: FirstResponseDispatch;
  companion: FirstResponseDispatch;
}

export interface EmergencyRecipientResponse {
  id: string;
  role: EmergencyRecipientRole | string;
  label: string;
  status: EmergencyRecipientStatus | string;
  notified_at: string | null;
  responded_at: string | null;
}

export interface EmergencyRecipient {
  id: string;
  role: EmergencyRecipientRole | string;
  label: string;
  status: EmergencyRecipientStatus | string;
  notifiedAt: string | null;
  respondedAt: string | null;
}

/** Matches FastAPI EmergencyCaseResponse. */
export interface EmergencyCaseResponse {
  id: string;
  senior_id: string;
  senior_name?: string | null;
  type: EmergencyType;
  status: EmergencyStatus;
  created_at: string | null;
  case_number?: string | null;
  trigger_source?: string | null;
  location_text?: string | null;
  triggered_at?: string | null;
  alert_sent_at?: string | null;
  assistance_started_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  handled_by_name?: string | null;
  emergency_reason?: string | null;
  what_happened?: string | null;
  action_taken?: string | null;
  hospital_required?: boolean | null;
  hospital_details?: string | null;
  family_communication?: string | null;
  notes?: string | null;
  follow_up_required?: boolean | null;
  follow_up_date?: string | null;
  recipients?: EmergencyRecipientResponse[];
  first_response?: {
    family: FirstResponseDispatch | string;
    companion: FirstResponseDispatch | string;
  } | null;
}

/** Matches FastAPI EmergencyEventResponse. */
export interface EmergencyEventResponse {
  id: string;
  case_id: string;
  event_description: string | null;
  created_at: string | null;
}

/** Matches FastAPI EmergencyCreate. senior_id is optional and resolved by the API for SENIOR. */
export interface EmergencyCreate {
  type: EmergencyType;
  senior_id?: string;
  trigger_source?: EmergencyTriggerSource;
}

export interface EmergencyReportUpdate {
  emergency_reason?: string | null;
  what_happened?: string | null;
  action_taken?: string | null;
  hospital_required?: boolean | null;
  hospital_details?: string | null;
  family_communication?: string | null;
  notes?: string | null;
  follow_up_required?: boolean | null;
  follow_up_date?: string | null;
  mark_resolved?: boolean;
  mark_closed?: boolean;
}

export interface EmergencyCase {
  id: string;
  seniorId: string;
  seniorName: string | null;
  type: EmergencyType;
  status: EmergencyStatus;
  createdAt: string | null;
  caseNumber: string | null;
  triggerSource: string | null;
  locationText: string | null;
  triggeredAt: string | null;
  alertSentAt: string | null;
  assistanceStartedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  handledByName: string | null;
  emergencyReason: string | null;
  whatHappened: string | null;
  actionTaken: string | null;
  hospitalRequired: boolean | null;
  hospitalDetails: string | null;
  familyCommunication: string | null;
  notes: string | null;
  followUpRequired: boolean | null;
  followUpDate: string | null;
  recipients: EmergencyRecipient[];
  firstResponse: FirstResponseStatus | null;
}

export interface EmergencyEvent {
  id: string;
  caseId: string;
  eventDescription: string | null;
  createdAt: string | null;
}
