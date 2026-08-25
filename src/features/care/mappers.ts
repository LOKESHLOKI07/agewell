import type { CareManagerProfile, CareManagerResponse, VisitReport, VisitReportResponse, VisitTask, VisitTaskResponse } from './types';

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

export function toCareManagerProfile(payload: unknown): CareManagerProfile {
  const data = asRecord(payload, 'care manager') as unknown as CareManagerResponse;
  return {
    id: asId(data.id, 'care_manager.id'),
    userId: asOptionalString(data.user_id),
    employeeId: asOptionalString(data.employee_id),
    name: asOptionalString(data.name),
    skills: asOptionalString(data.skills),
    status: asOptionalString(data.status),
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
