export interface CareManagerResponse {
  id: string;
  user_id: string | null;
  employee_id: string | null;
  name: string | null;
  skills: string | null;
  status: string | null;
  staff_kind?: string | null;
}

export interface VisitTaskResponse {
  id: string;
  visit_id: string;
  task_name: string | null;
  is_completed: boolean;
}

export interface VisitReportResponse {
  id: string;
  visit_id: string;
  summary: string | null;
  issues_noted: string | null;
}

export interface CareManagerProfile {
  id: string;
  userId: string | null;
  employeeId: string | null;
  name: string | null;
  skills: string | null;
  status: string | null;
  staffKind: string | null;
}

export interface VisitTask {
  id: string;
  visitId: string;
  taskName: string | null;
  isCompleted: boolean;
}

export interface VisitReport {
  id: string;
  visitId: string;
  summary: string | null;
  issuesNoted: string | null;
}

export type AttendanceStatus = 'CHECKED_IN' | 'CHECKED_OUT' | string;

export interface AttendanceResponse {
  id: string;
  care_manager_id: string;
  check_in_at: string;
  check_out_at: string | null;
  location: string | null;
  status: AttendanceStatus;
}

export interface AttendanceRecord {
  id: string;
  careManagerId: string;
  checkInAt: string;
  checkOutAt: string | null;
  location: string | null;
  status: AttendanceStatus;
}

export const DELIVERY_STATUSES = ['PENDING', 'EN_ROUTE', 'COMPLETED', 'FAILED'] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export interface DeliveryResponse {
  id: string;
  care_manager_id: string;
  senior_id: string | null;
  service_request_id?: string | null;
  title: string;
  customer_name: string | null;
  location: string | null;
  status: DeliveryStatus;
  scheduled_at: string | null;
}

export interface Delivery {
  id: string;
  careManagerId: string;
  seniorId: string | null;
  serviceRequestId: string | null;
  title: string;
  customerName: string | null;
  location: string | null;
  status: DeliveryStatus;
  scheduledAt: string | null;
}

export const TRAINING_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const;
export type TrainingStatus = (typeof TRAINING_STATUSES)[number];

export interface TrainingModuleResponse {
  id: string;
  title: string;
  status: TrainingStatus;
}

export interface StaffDocumentResponse {
  id: string;
  title: string;
  verified: string;
}

export interface TrainingHomeResponse {
  modules: TrainingModuleResponse[];
  documents: StaffDocumentResponse[];
}

export interface TrainingModule {
  id: string;
  title: string;
  status: TrainingStatus;
}

export interface StaffDocument {
  id: string;
  title: string;
  verified: string;
}

export interface TrainingHome {
  modules: TrainingModule[];
  documents: StaffDocument[];
}
