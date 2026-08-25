import {
  ACTIVE_EMERGENCY_STATUSES,
  EMERGENCY_STATUSES,
  EMERGENCY_TYPES,
  type EmergencyCase,
  type EmergencyCaseResponse,
  type EmergencyCreate,
  type EmergencyEvent,
  type EmergencyEventResponse,
  type EmergencyStatus,
  type EmergencyType,
} from './types/emergency';

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

function asEmergencyType(value: unknown): EmergencyType {
  if (typeof value === 'string' && (EMERGENCY_TYPES as readonly string[]).includes(value)) {
    return value as EmergencyType;
  }
  throw new Error('Invalid emergency type');
}

function asEmergencyStatus(value: unknown): EmergencyStatus {
  if (typeof value === 'string' && (EMERGENCY_STATUSES as readonly string[]).includes(value)) {
    return value as EmergencyStatus;
  }
  throw new Error('Invalid emergency status');
}

export function toEmergencyCase(payload: unknown): EmergencyCase {
  const data = asRecord(payload, 'emergency case') as unknown as EmergencyCaseResponse;
  return {
    id: asId(data.id, 'emergency.id'),
    seniorId: asId(data.senior_id, 'emergency.senior_id'),
    type: asEmergencyType(data.type),
    status: asEmergencyStatus(data.status),
    createdAt: asOptionalString(data.created_at),
  };
}

export function toEmergencyEvent(payload: unknown): EmergencyEvent {
  const data = asRecord(payload, 'emergency event') as unknown as EmergencyEventResponse;
  return {
    id: asId(data.id, 'event.id'),
    caseId: asId(data.case_id, 'event.case_id'),
    eventDescription: asOptionalString(data.event_description),
    createdAt: asOptionalString(data.created_at),
  };
}

export function toEmergencyCreateBody(type: EmergencyType): EmergencyCreate {
  return { type };
}

export function isActiveEmergencyStatus(status: EmergencyStatus): boolean {
  return (ACTIVE_EMERGENCY_STATUSES as readonly string[]).includes(status);
}

export function findActiveEmergency(cases: EmergencyCase[]): EmergencyCase | null {
  return cases.find((item) => isActiveEmergencyStatus(item.status)) ?? null;
}
