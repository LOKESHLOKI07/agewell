import type {
  AttendanceRecord,
  AttendanceResponse,
  CareManagerProfile,
  CareManagerResponse,
  Delivery,
  DeliveryResponse,
  DeliveryStatus,
  StaffDocument,
  StaffDocumentResponse,
  TrainingHome,
  TrainingHomeResponse,
  TrainingModule,
  TrainingModuleResponse,
  TrainingStatus,
  VisitReport,
  VisitReportResponse,
  VisitTask,
  VisitTaskResponse,
} from './types';
import { DELIVERY_STATUSES, TRAINING_STATUSES } from './types';
import { parseStaffKind } from './staffKind';

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
  if (typeof value === 'number') {
    return String(value);
  }
  throw new Error(`Invalid ${label}`);
}

function asOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asBoolean(value: unknown, label: string): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}

function asString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}

export function toCareManagerProfile(payload: unknown): CareManagerProfile {
  const data = asRecord(payload, 'care manager') as unknown as CareManagerResponse;
  return {
    id: asId(data.id, 'care_manager.id'),
    userId: asOptionalString(data.user_id),
    employeeId: asOptionalString(data.employee_id),
    name: asOptionalString(data.name),
    skills: asOptionalString(data.skills),
    status: asOptionalString(data.status),
    staffKind: parseStaffKind(data.staff_kind),
  };
}

export function toCareManagerProfileList(payload: unknown): CareManagerProfile[] {
  if (!Array.isArray(payload)) {
    throw new Error('Invalid care managers');
  }
  return payload.map(toCareManagerProfile);
}

export function firstCareManager(profiles: CareManagerProfile[]): CareManagerProfile | null {
  return profiles[0] ?? null;
}

export function toVisitTask(payload: unknown): VisitTask {
  const data = asRecord(payload, 'visit task') as unknown as VisitTaskResponse;
  return {
    id: asId(data.id, 'task.id'),
    visitId: asId(data.visit_id, 'task.visit_id'),
    taskName: asOptionalString(data.task_name),
    isCompleted: asBoolean(data.is_completed, 'task.is_completed'),
  };
}

export function toVisitTaskList(payload: unknown): VisitTask[] {
  if (!Array.isArray(payload)) {
    throw new Error('Invalid visit tasks');
  }
  return payload.map(toVisitTask);
}

export function toVisitReport(payload: unknown): VisitReport {
  const data = asRecord(payload, 'visit report') as unknown as VisitReportResponse;
  return {
    id: asId(data.id, 'report.id'),
    visitId: asId(data.visit_id, 'report.visit_id'),
    summary: asOptionalString(data.summary),
    issuesNoted: asOptionalString(data.issues_noted),
  };
}

export function toVisitReportList(payload: unknown): VisitReport[] {
  if (!Array.isArray(payload)) {
    throw new Error('Invalid visit reports');
  }
  return payload.map(toVisitReport);
}

export function toAttendanceRecord(payload: unknown): AttendanceRecord | null {
  if (payload === null || payload === undefined) {
    return null;
  }
  const data = asRecord(payload, 'attendance') as unknown as AttendanceResponse;
  return {
    id: asId(data.id, 'attendance.id'),
    careManagerId: asId(data.care_manager_id, 'attendance.care_manager_id'),
    checkInAt: asString(data.check_in_at, 'attendance.check_in_at'),
    checkOutAt: asOptionalString(data.check_out_at),
    location: asOptionalString(data.location),
    status: asString(data.status, 'attendance.status'),
  };
}

function asDeliveryStatus(value: unknown): DeliveryStatus {
  if (typeof value === 'string' && (DELIVERY_STATUSES as readonly string[]).includes(value)) {
    return value as DeliveryStatus;
  }
  throw new Error('Invalid delivery status');
}

export function toDelivery(payload: unknown): Delivery {
  const data = asRecord(payload, 'delivery') as unknown as DeliveryResponse;
  return {
    id: asId(data.id, 'delivery.id'),
    careManagerId: asId(data.care_manager_id, 'delivery.care_manager_id'),
    seniorId: asOptionalString(data.senior_id),
    serviceRequestId: asOptionalString(data.service_request_id),
    title: asString(data.title, 'delivery.title'),
    customerName: asOptionalString(data.customer_name),
    location: asOptionalString(data.location),
    status: asDeliveryStatus(data.status),
    scheduledAt: asOptionalString(data.scheduled_at),
  };
}

function asTrainingStatus(value: unknown): TrainingStatus {
  if (typeof value === 'string' && (TRAINING_STATUSES as readonly string[]).includes(value)) {
    return value as TrainingStatus;
  }
  return 'PENDING';
}

export function toTrainingModule(payload: unknown): TrainingModule {
  const data = asRecord(payload, 'training module') as unknown as TrainingModuleResponse;
  return {
    id: asId(data.id, 'module.id'),
    title: asString(data.title, 'module.title'),
    status: asTrainingStatus(data.status),
  };
}

export function toStaffDocument(payload: unknown): StaffDocument {
  const data = asRecord(payload, 'staff document') as unknown as StaffDocumentResponse;
  return {
    id: asId(data.id, 'document.id'),
    title: asString(data.title, 'document.title'),
    verified: asString(data.verified, 'document.verified'),
  };
}

export function toTrainingHome(payload: unknown): TrainingHome {
  const data = asRecord(payload, 'training home') as unknown as TrainingHomeResponse;
  const modules = Array.isArray(data.modules) ? data.modules.map(toTrainingModule) : [];
  const documents = Array.isArray(data.documents) ? data.documents.map(toStaffDocument) : [];
  return { modules, documents };
}
