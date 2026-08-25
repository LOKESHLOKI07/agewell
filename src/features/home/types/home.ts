/** Matches FastAPI ListPage[T]. */
export interface ListPage<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/** Matches FastAPI SeniorResponse. */
export interface SeniorResponse {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  address: string;
  emergency_contact: string;
}

export type VisitStatus =
  | 'SCHEDULED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'CHECKED_OUT'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

/** Matches FastAPI VisitResponse. */
export interface VisitResponse {
  id: string;
  senior_id: string;
  care_manager_id: string | null;
  employee_id: string | null;
  care_manager_name: string | null;
  status: VisitStatus;
  scheduled_at: string | null;
  notes: string | null;
}

export type AppointmentStatus = 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

/** Matches FastAPI AppointmentResponse. */
export interface AppointmentResponse {
  id: string;
  senior_id: string;
  doctor_id: string | null;
  doctor_name: string | null;
  status: AppointmentStatus;
  scheduled_at: string | null;
}

/** Matches FastAPI AppointmentCreate. */
export interface AppointmentCreate {
  senior_id: string;
  doctor_id: string;
  scheduled_at: string;
  status?: AppointmentStatus;
}

/** Matches FastAPI AppointmentUpdate. */
export interface AppointmentUpdate {
  status?: AppointmentStatus;
  scheduled_at?: string;
  doctor_id?: string;
}

/** Matches FastAPI MedicationResponse. */
export interface MedicationResponse {
  medication_id: string;
  name: string;
  dosage: string | null;
  schedule: string | null;
  frequency: string | null;
}

/** Matches FastAPI MedicationScheduleResponse. */
export interface MedicationScheduleResponse {
  id: string;
  medication_id: string;
  medication_name: string;
  dosage: string | null;
  schedule_time: string | null;
  frequency: string | null;
}

/** Matches FastAPI MedicalRecordResponse. */
export interface MedicalRecordResponse {
  id: string;
  senior_id: string;
  provider_id: string | null;
  provider_name: string | null;
  notes: string | null;
}

/** Matches FastAPI LabResultResponse. */
export interface LabResultResponse {
  id: string;
  senior_id: string;
  test_name: string | null;
  result_value: string | null;
  date: string | null;
}

/** Matches FastAPI HealthDocumentResponse. */
export interface HealthDocumentResponse {
  id: string;
  senior_id: string;
  file_url: string | null;
  document_type: string | null;
}

/** Matches FastAPI HealthcareProviderResponse. */
export interface HealthcareProviderResponse {
  id: string;
  name: string | null;
  specialty: string | null;
}

export type ServiceRequestStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

/** Matches FastAPI ServiceRequestRead. */
export interface ServiceRequestRead {
  id: string;
  senior_id: string;
  service_id: string;
  service_name: string;
  status: ServiceRequestStatus;
}

/** Matches FastAPI ServiceRequestCreate. */
export interface ServiceRequestCreate {
  senior_id: string;
  service_id: string;
}

/** Matches FastAPI ServiceRequestResponse. */
export interface ServiceRequestResponse {
  id: string;
  senior_id: string;
  service_id: string;
  status: ServiceRequestStatus;
}

export type ServiceCategory = 'CARE' | 'FOOD_HOME' | 'HEALTH' | 'MOBILITY' | 'COMMUNITY' | 'ADD_ON';

/** Matches FastAPI ServiceResponse. */
export interface ServiceResponse {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
}

/** Matches FastAPI MembershipBenefitItem. */
export interface MembershipBenefitItem {
  benefit_id: string;
  benefit_name: string;
  quota: number | null;
}

/** Matches FastAPI CurrentMembershipResponse. */
export interface CurrentMembershipResponse {
  membership_id: string;
  plan_id: string;
  plan_name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  benefits: MembershipBenefitItem[];
}

/** Matches FastAPI MembershipUsageItem. */
export interface MembershipUsageItem {
  benefit_id: string;
  benefit_name: string;
  quota: number | null;
  used: number;
  remaining: number | null;
}

export type NotificationPriority = 'INFO' | 'IMPORTANT' | 'EMERGENCY';

/** Matches FastAPI NotificationResponse. */
export interface NotificationResponse {
  id: string;
  title: string | null;
  message: string | null;
  priority: NotificationPriority;
  is_read: boolean;
  created_at: string | null;
}

export interface SeniorProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
}

export interface Visit {
  id: string;
  seniorId: string;
  careManagerId: string | null;
  employeeId: string | null;
  careManagerName: string | null;
  status: VisitStatus;
  scheduledAt: string | null;
  notes: string | null;
}

export interface Appointment {
  id: string;
  seniorId: string;
  doctorId: string | null;
  doctorName: string | null;
  status: AppointmentStatus;
  scheduledAt: string | null;
}

export interface Medication {
  medicationId: string;
  name: string;
  dosage: string | null;
  schedule: string | null;
  frequency: string | null;
}

export interface MedicationSchedule {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string | null;
  scheduleTime: string | null;
  frequency: string | null;
}

export interface MedicalRecord {
  id: string;
  seniorId: string;
  providerId: string | null;
  providerName: string | null;
  notes: string | null;
}

export interface LabResult {
  id: string;
  seniorId: string;
  testName: string | null;
  resultValue: string | null;
  date: string | null;
}

export interface HealthDocument {
  id: string;
  seniorId: string;
  fileUrl: string | null;
  documentType: string | null;
}

export interface HealthcareProvider {
  id: string;
  name: string | null;
  specialty: string | null;
}

export interface ServiceRequest {
  id: string;
  seniorId: string;
  serviceId: string;
  serviceName: string;
  status: ServiceRequestStatus;
}

export interface CreatedServiceRequest {
  id: string;
  seniorId: string;
  serviceId: string;
  status: ServiceRequestStatus;
}

export interface CatalogService {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
}

export interface CurrentMembership {
  membershipId: string;
  planId: string;
  planName: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  benefits: {
    benefitId: string;
    benefitName: string;
    quota: number | null;
  }[];
}

export interface MembershipUsage {
  benefitId: string;
  benefitName: string;
  quota: number | null;
  used: number;
  remaining: number | null;
}

export interface Notification {
  id: string;
  title: string | null;
  message: string | null;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: string | null;
}

export type TodayCareKind = 'visit' | 'appointment' | 'medication' | 'service_request';

export type TodayCareIcon = 'people' | 'person' | 'medkit' | 'water' | 'grid' | 'restaurant' | 'car';

export type SchedulePeriod = 'morning' | 'afternoon' | 'evening' | 'unscheduled';

export interface TodayCareItem {
  id: string;
  kind: TodayCareKind;
  title: string;
  subtitle: string;
  /** Human status when the API provides one (never invented). */
  status: string | null;
  icon: TodayCareIcon;
  sortAt: number | null;
  href?: string;
}

export interface QuickServiceItem {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
}

export interface HomeViewModel {
  greetingName: string | null;
  todayItems: TodayCareItem[];
  quickServices: QuickServiceItem[];
  membership: {
    planName: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    usage: MembershipUsage[];
  } | null;
  unreadNotificationCount: number;
}

export type HomeSectionState = 'loading' | 'error' | 'empty' | 'ready';

export interface TodaySummaryTile {
  key: TodayCareKind;
  title: string;
  value: string;
  href: string;
  icon: TodayCareIcon;
}
