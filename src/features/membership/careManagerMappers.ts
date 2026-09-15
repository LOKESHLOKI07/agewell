import type { IconName } from '@/components/ui';
import type { ListPage } from '@/features/home/types/home';
import {
  CARE_ACTIVITY_STATUSES,
  CARE_ACTIVITY_TYPES,
  type CareActivity,
  type CareActivityStatus,
  type CareActivityType,
  type AssignedCareManager,
  type AssignedCareManagerPage,
  type CareVisitSlot,
} from './careManagerTypes';

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

function asBoolean(value: unknown): boolean {
  return value === true;
}

function asActivityType(value: unknown): CareActivityType {
  if (typeof value === 'string' && (CARE_ACTIVITY_TYPES as readonly string[]).includes(value)) {
    return value as CareActivityType;
  }
  return 'GENERAL';
}

function asActivityStatus(value: unknown): CareActivityStatus {
  if (typeof value === 'string' && (CARE_ACTIVITY_STATUSES as readonly string[]).includes(value)) {
    return value as CareActivityStatus;
  }
  return 'REQUESTED';
}

const CARE_ACTIVITY_ICONS = new Set<IconName>([
  'call-outline',
  'chatbubble-outline',
  'calendar-outline',
  'home-outline',
  'doctor',
  'pill',
  'cart-outline',
  'siren',
  'phone-portrait-outline',
  'car-outline',
  'settings-outline',
  'clipboard-outline',
]);

function asIcon(value: unknown): IconName {
  if (typeof value === 'string' && CARE_ACTIVITY_ICONS.has(value as IconName)) {
    return value as IconName;
  }
  return 'clipboard-outline';
}

export function toAssignedCareManager(payload: unknown): AssignedCareManager | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const data = payload as Record<string, unknown>;
  return {
    id: asId(data.id, 'care_manager.id'),
    userId: asOptionalString(data.user_id),
    employeeId: asOptionalString(data.employee_id),
    name: asOptionalString(data.name),
    firstName: asOptionalString(data.first_name),
    lastName: asOptionalString(data.last_name),
    phone: asOptionalString(data.phone),
    skills: asOptionalString(data.skills),
    experience: asOptionalString(data.experience),
    languages: asOptionalString(data.languages),
    availability: asOptionalString(data.availability),
    status: asOptionalString(data.status),
    staffKind: asOptionalString(data.staff_kind),
  };
}

export function toAssignedCareManagerPage(payload: unknown): AssignedCareManagerPage {
  const data = asRecord(payload, 'assigned care manager');
  return {
    assigned: asBoolean(data.assigned),
    inServiceArea: asBoolean(data.in_service_area),
    seniorId: asOptionalString(data.senior_id),
    careManager: toAssignedCareManager(data.care_manager),
  };
}

export function toCareActivity(payload: unknown): CareActivity {
  const data = asRecord(payload, 'care activity');
  return {
    id: asId(data.id, 'activity.id'),
    seniorId: asId(data.senior_id, 'activity.senior_id'),
    careManagerId: asOptionalString(data.care_manager_id),
    careManagerName: asOptionalString(data.care_manager_name),
    activityType: asActivityType(data.activity_type),
    status: asActivityStatus(data.status),
    icon: asIcon(data.icon),
    title: asOptionalString(data.title) ?? 'Care Manager update',
    occurredAt: asOptionalString(data.occurred_at),
    scheduledAt: asOptionalString(data.scheduled_at),
    reason: asOptionalString(data.reason),
    discussion: asOptionalString(data.discussion),
    actionTaken: asOptionalString(data.action_taken),
    servicesCoordinated: asOptionalString(data.services_coordinated),
    followUpRequired: asBoolean(data.follow_up_required),
    followUpDate: asOptionalString(data.follow_up_date),
    followUpNotes: asOptionalString(data.follow_up_notes),
    notes: asOptionalString(data.notes),
    visitId: asOptionalString(data.visit_id),
    createdAt: asOptionalString(data.created_at),
  };
}

export function toCareActivityPage(payload: unknown): ListPage<CareActivity> {
  const data = asRecord(payload, 'care activities');
  if (!Array.isArray(data.items)) {
    throw new Error('Invalid care activities');
  }
  return {
    items: data.items.map(toCareActivity),
    total: typeof data.total === 'number' ? data.total : data.items.length,
    limit: typeof data.limit === 'number' ? data.limit : data.items.length,
    offset: typeof data.offset === 'number' ? data.offset : 0,
  };
}

export function toCareVisitSlots(payload: unknown): CareVisitSlot[] {
  const data = asRecord(payload, 'visit slots');
  if (!Array.isArray(data.slots)) {
    throw new Error('Invalid visit slots');
  }
  return data.slots.map((item) => {
    const row = asRecord(item, 'visit slot');
    return {
      startAt: asId(row.start_at, 'slot.start_at'),
      label: asOptionalString(row.label) ?? asId(row.start_at, 'slot.start_at'),
    };
  });
}

export function formatCareActivityWhen(iso: string | null): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function careActivityFollowUpLine(activity: CareActivity): string | null {
  if (activity.followUpNotes) {
    return `Follow-up: ${activity.followUpNotes}`;
  }
  if (activity.followUpDate) {
    return `Follow-up: ${formatCareActivityWhen(activity.followUpDate)}`;
  }
  if (activity.followUpRequired) {
    return 'Follow-up required';
  }
  return null;
}
