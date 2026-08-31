import type {
  Appointment,
  AppointmentCreate,
  AppointmentResponse,
  AppointmentStatus,
  AppointmentUpdate,
  CatalogService,
  CreatedServiceRequest,
  CurrentMembership,
  CurrentMembershipResponse,
  HealthDocument,
  HealthDocumentResponse,
  HealthcareProvider,
  HealthcareProviderResponse,
  LabResult,
  LabResultResponse,
  ListPage,
  MedicalRecord,
  MedicalRecordResponse,
  Medication,
  MedicationResponse,
  MedicationSchedule,
  MedicationScheduleResponse,
  MembershipUsage,
  MembershipUsageItem,
  Notification,
  NotificationResponse,
  SeniorProfile,
  SeniorResponse,
  ServiceRequest,
  ServiceRequestCreate,
  ServiceRequestRead,
  ServiceRequestResponse,
  ServiceResponse,
  Visit,
  VisitResponse,
} from '../types/home';
import { joinPersonName } from '@/utils/personName';

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

function asString(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}

function asOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}

function asNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}

function asOptionalNumber(value: unknown): number | null {
  return typeof value === 'number' && !Number.isNaN(value) ? value : null;
}

export function toListPage<T>(payload: unknown, mapItem: (item: unknown) => T, label: string): ListPage<T> {
  const data = asRecord(payload, label);
  if (!Array.isArray(data.items)) {
    throw new Error(`Invalid ${label}`);
  }
  return {
    items: data.items.map(mapItem),
    total: asNumber(data.total, `${label}.total`),
    limit: asNumber(data.limit, `${label}.limit`),
    offset: asNumber(data.offset, `${label}.offset`),
  };
}

export function toSeniorProfile(payload: unknown): SeniorProfile {
  const data = asRecord(payload, 'senior profile') as unknown as SeniorResponse;
  return {
    id: asId(data.id, 'senior.id'),
    userId: asId(data.user_id, 'senior.user_id'),
    firstName: asString(data.first_name, 'senior.first_name'),
    lastName: asString(data.last_name, 'senior.last_name'),
    dateOfBirth: asString(data.date_of_birth, 'senior.date_of_birth'),
    address: asString(data.address, 'senior.address'),
    emergencyContact: asString(data.emergency_contact, 'senior.emergency_contact'),
    photo: asOptionalString(data.photo),
  };
}

export function seniorDisplayName(senior: Pick<SeniorProfile, 'firstName' | 'lastName'>): string {
  return joinPersonName(senior.firstName, senior.lastName);
}

export function toVisit(payload: unknown): Visit {
  const data = asRecord(payload, 'visit') as unknown as VisitResponse;
  return {
    id: asId(data.id, 'visit.id'),
    seniorId: asId(data.senior_id, 'visit.senior_id'),
    careManagerId: asOptionalString(data.care_manager_id),
    employeeId: asOptionalString(data.employee_id),
    careManagerName: asOptionalString(data.care_manager_name),
    status: asString(data.status, 'visit.status') as Visit['status'],
    scheduledAt: asOptionalString(data.scheduled_at),
    notes: asOptionalString(data.notes),
  };
}

export function toAppointment(payload: unknown): Appointment {
  const data = asRecord(payload, 'appointment') as unknown as AppointmentResponse;
  return {
    id: asId(data.id, 'appointment.id'),
    seniorId: asId(data.senior_id, 'appointment.senior_id'),
    doctorId: asOptionalString(data.doctor_id),
    doctorName: asOptionalString(data.doctor_name),
    status: asString(data.status, 'appointment.status') as Appointment['status'],
    scheduledAt: asOptionalString(data.scheduled_at),
  };
}

export function toAppointmentCreateBody(input: {
  seniorId: string;
  doctorId: string;
  scheduledAt: string;
  status?: AppointmentStatus;
}): AppointmentCreate {
  return {
    senior_id: input.seniorId,
    doctor_id: input.doctorId,
    scheduled_at: input.scheduledAt,
    ...(input.status ? { status: input.status } : {}),
  };
}

export function toAppointmentUpdateBody(input: {
  status?: AppointmentStatus;
  scheduledAt?: string;
  doctorId?: string;
}): AppointmentUpdate {
  const body: AppointmentUpdate = {};
  if (input.status !== undefined) {
    body.status = input.status;
  }
  if (input.scheduledAt !== undefined) {
    body.scheduled_at = input.scheduledAt;
  }
  if (input.doctorId !== undefined) {
    body.doctor_id = input.doctorId;
  }
  return body;
}

export function toMedication(payload: unknown): Medication {
  const data = asRecord(payload, 'medication') as unknown as MedicationResponse;
  return {
    medicationId: asId(data.medication_id, 'medication.medication_id'),
    name: asString(data.name, 'medication.name'),
    dosage: asOptionalString(data.dosage),
    schedule: asOptionalString(data.schedule),
    frequency: asOptionalString(data.frequency),
  };
}

export function toMedicationSchedule(payload: unknown): MedicationSchedule {
  const data = asRecord(payload, 'medication schedule') as unknown as MedicationScheduleResponse;
  return {
    id: asId(data.id, 'schedule.id'),
    medicationId: asId(data.medication_id, 'schedule.medication_id'),
    medicationName: asString(data.medication_name, 'schedule.medication_name'),
    dosage: asOptionalString(data.dosage),
    scheduleTime: asOptionalString(data.schedule_time),
    frequency: asOptionalString(data.frequency),
  };
}

export function toMedicalRecord(payload: unknown): MedicalRecord {
  const data = asRecord(payload, 'medical record') as unknown as MedicalRecordResponse;
  return {
    id: asId(data.id, 'record.id'),
    seniorId: asId(data.senior_id, 'record.senior_id'),
    providerId: asOptionalString(data.provider_id),
    providerName: asOptionalString(data.provider_name),
    notes: asOptionalString(data.notes),
  };
}

export function toLabResult(payload: unknown): LabResult {
  const data = asRecord(payload, 'lab result') as unknown as LabResultResponse;
  return {
    id: asId(data.id, 'lab.id'),
    seniorId: asId(data.senior_id, 'lab.senior_id'),
    testName: asOptionalString(data.test_name),
    resultValue: asOptionalString(data.result_value),
    date: asOptionalString(data.date),
  };
}

export function toHealthDocument(payload: unknown): HealthDocument {
  const data = asRecord(payload, 'health document') as unknown as HealthDocumentResponse;
  return {
    id: asId(data.id, 'document.id'),
    seniorId: asId(data.senior_id, 'document.senior_id'),
    fileUrl: asOptionalString(data.file_url),
    documentType: asOptionalString(data.document_type),
  };
}

export function toHealthcareProvider(payload: unknown): HealthcareProvider {
  const data = asRecord(payload, 'healthcare provider') as unknown as HealthcareProviderResponse;
  return {
    id: asId(data.id, 'provider.id'),
    name: asOptionalString(data.name),
    specialty: asOptionalString(data.specialty),
  };
}

export function toServiceRequest(payload: unknown): ServiceRequest {
  const data = asRecord(payload, 'service request') as unknown as ServiceRequestRead;
  return {
    id: asId(data.id, 'service_request.id'),
    seniorId: asId(data.senior_id, 'service_request.senior_id'),
    serviceId: asId(data.service_id, 'service_request.service_id'),
    serviceName: asString(data.service_name, 'service_request.service_name'),
    status: asString(data.status, 'service_request.status') as ServiceRequest['status'],
  };
}

export function toCatalogService(payload: unknown): CatalogService {
  const data = asRecord(payload, 'service') as unknown as ServiceResponse;
  return {
    id: asId(data.id, 'service.id'),
    name: asString(data.name, 'service.name'),
    category: asString(data.category, 'service.category') as CatalogService['category'],
    description: asString(data.description, 'service.description'),
  };
}

export function toCurrentMembership(payload: unknown): CurrentMembership {
  const data = asRecord(payload, 'membership') as unknown as CurrentMembershipResponse;
  if (!Array.isArray(data.benefits)) {
    throw new Error('Invalid membership');
  }
  return {
    membershipId: asId(data.membership_id, 'membership.membership_id'),
    planId: asId(data.plan_id, 'membership.plan_id'),
    planName: asString(data.plan_name, 'membership.plan_name'),
    status: asString(data.status, 'membership.status'),
    startDate: asOptionalString(data.start_date),
    endDate: asOptionalString(data.end_date),
    benefits: data.benefits.map((benefit) => ({
      benefitId: asId(benefit.benefit_id, 'benefit.benefit_id'),
      benefitName: asString(benefit.benefit_name, 'benefit.benefit_name'),
      quota: asOptionalNumber(benefit.quota),
    })),
  };
}

export function toMembershipUsage(payload: unknown): MembershipUsage {
  const data = asRecord(payload, 'membership usage') as unknown as MembershipUsageItem;
  return {
    benefitId: asId(data.benefit_id, 'usage.benefit_id'),
    benefitName: asString(data.benefit_name, 'usage.benefit_name'),
    quota: asOptionalNumber(data.quota),
    used: asNumber(data.used, 'usage.used'),
    remaining: asOptionalNumber(data.remaining),
  };
}

export function toNotification(payload: unknown): Notification {
  const data = asRecord(payload, 'notification') as unknown as NotificationResponse;
  return {
    id: asId(data.id, 'notification.id'),
    title: asOptionalString(data.title),
    message: asOptionalString(data.message),
    priority: asString(data.priority, 'notification.priority') as Notification['priority'],
    isRead: asBoolean(data.is_read, 'notification.is_read'),
    createdAt: asOptionalString(data.created_at),
  };
}

export function toServiceRequestCreateBody(seniorId: string, serviceId: string): ServiceRequestCreate {
  return {
    senior_id: seniorId,
    service_id: serviceId,
  };
}

export function toCreatedServiceRequest(payload: unknown): CreatedServiceRequest {
  const data = asRecord(payload, 'created service request') as unknown as ServiceRequestResponse;
  return {
    id: asId(data.id, 'service_request.id'),
    seniorId: asId(data.senior_id, 'service_request.senior_id'),
    serviceId: asId(data.service_id, 'service_request.service_id'),
    status: asString(data.status, 'service_request.status') as CreatedServiceRequest['status'],
  };
}

export function toCatalogServices(payload: unknown): CatalogService[] {
  if (!Array.isArray(payload)) {
    throw new Error('Invalid services');
  }
  return payload.map(toCatalogService);
}

export function toMembershipUsageList(payload: unknown): MembershipUsage[] {
  if (!Array.isArray(payload)) {
    throw new Error('Invalid membership usage');
  }
  return payload.map(toMembershipUsage);
}
