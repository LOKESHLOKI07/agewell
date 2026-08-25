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

/** Matches FastAPI EmergencyCaseResponse. */
export interface EmergencyCaseResponse {
  id: string;
  senior_id: string;
  type: EmergencyType;
  status: EmergencyStatus;
  created_at: string | null;
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
}

export interface EmergencyCase {
  id: string;
  seniorId: string;
  type: EmergencyType;
  status: EmergencyStatus;
  createdAt: string | null;
}

export interface EmergencyEvent {
  id: string;
  caseId: string;
  eventDescription: string | null;
  createdAt: string | null;
}
