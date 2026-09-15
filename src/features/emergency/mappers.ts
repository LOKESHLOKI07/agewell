import {
  ACTIVE_EMERGENCY_STATUSES,
  EMERGENCY_RECIPIENT_ROLES,
  EMERGENCY_STATUSES,
  EMERGENCY_TRIGGER_SOURCES,
  EMERGENCY_TYPES,
  FIRST_RESPONSE_DISPATCH,
  type EmergencyCase,
  type EmergencyCaseResponse,
  type EmergencyCreate,
  type EmergencyEvent,
  type EmergencyEventResponse,
  type EmergencyRecipient,
  type EmergencyRecipientResponse,
  type EmergencyStatus,
  type EmergencyTriggerSource,
  type EmergencyType,
  type FirstResponseDispatch,
  type FirstResponseStatus,
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

function asOptionalBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
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

function asFirstResponseDispatch(value: unknown): FirstResponseDispatch | null {
  if (typeof value === 'string' && (FIRST_RESPONSE_DISPATCH as readonly string[]).includes(value)) {
    return value as FirstResponseDispatch;
  }
  return null;
}

function toFirstResponse(payload: unknown): FirstResponseStatus | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const data = payload as Record<string, unknown>;
  const family = asFirstResponseDispatch(data.family);
  const companion = asFirstResponseDispatch(data.companion);
  if (!family || !companion) {
    return null;
  }
  return { family, companion };
}

function toRecipient(payload: unknown): EmergencyRecipient {
  const data = asRecord(payload, 'emergency recipient') as unknown as EmergencyRecipientResponse;
  return {
    id: asId(data.id, 'recipient.id'),
    role: typeof data.role === 'string' ? data.role : 'FAMILY',
    label: asOptionalString(data.label) ?? 'Recipient',
    status: typeof data.status === 'string' ? data.status : 'PENDING',
    notifiedAt: asOptionalString(data.notified_at),
    respondedAt: asOptionalString(data.responded_at),
  };
}

export function toEmergencyCase(payload: unknown): EmergencyCase {
  const data = asRecord(payload, 'emergency case') as unknown as EmergencyCaseResponse;
  const recipients = Array.isArray(data.recipients) ? data.recipients.map(toRecipient) : [];
  return {
    id: asId(data.id, 'emergency.id'),
    seniorId: asId(data.senior_id, 'emergency.senior_id'),
    seniorName: asOptionalString(data.senior_name),
    type: asEmergencyType(data.type),
    status: asEmergencyStatus(data.status),
    createdAt: asOptionalString(data.created_at),
    caseNumber: asOptionalString(data.case_number),
    triggerSource: asOptionalString(data.trigger_source),
    locationText: asOptionalString(data.location_text),
    triggeredAt: asOptionalString(data.triggered_at),
    alertSentAt: asOptionalString(data.alert_sent_at),
    assistanceStartedAt: asOptionalString(data.assistance_started_at),
    resolvedAt: asOptionalString(data.resolved_at),
    closedAt: asOptionalString(data.closed_at),
    handledByName: asOptionalString(data.handled_by_name),
    emergencyReason: asOptionalString(data.emergency_reason),
    whatHappened: asOptionalString(data.what_happened),
    actionTaken: asOptionalString(data.action_taken),
    hospitalRequired: asOptionalBoolean(data.hospital_required),
    hospitalDetails: asOptionalString(data.hospital_details),
    familyCommunication: asOptionalString(data.family_communication),
    notes: asOptionalString(data.notes),
    followUpRequired: asOptionalBoolean(data.follow_up_required),
    followUpDate: asOptionalString(data.follow_up_date),
    recipients,
    firstResponse: toFirstResponse(data.first_response),
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

export function toEmergencyCreateBody(
  type: EmergencyType,
  triggerSource: EmergencyTriggerSource = 'APP_SOS',
): EmergencyCreate {
  return { type, trigger_source: triggerSource };
}

export function isActiveEmergencyStatus(status: EmergencyStatus): boolean {
  return (ACTIVE_EMERGENCY_STATUSES as readonly string[]).includes(status);
}

export function findActiveEmergency(cases: EmergencyCase[]): EmergencyCase | null {
  return cases.find((item) => isActiveEmergencyStatus(item.status)) ?? null;
}

export function recipientForRole(emergency: EmergencyCase, role: string): EmergencyRecipient | null {
  return emergency.recipients.find((item) => item.role === role) ?? null;
}

/** Full success only when Family and Companion both got durable in-app alerts. */
export function isFirstResponseFullyNotified(caseItem: EmergencyCase): boolean {
  const fr = caseItem.firstResponse;
  if (fr) {
    return fr.family === 'SENT' && fr.companion === 'SENT';
  }
  const family = recipientForRole(caseItem, 'FAMILY');
  const companion = recipientForRole(caseItem, 'COMPANION');
  return Boolean(family?.notifiedAt && companion?.notifiedAt);
}

export { EMERGENCY_RECIPIENT_ROLES, EMERGENCY_TRIGGER_SOURCES };
