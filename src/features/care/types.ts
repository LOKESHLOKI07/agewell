export interface CareManagerResponse {
  id: string;
  user_id: string | null;
  employee_id: string | null;
  name: string | null;
  skills: string | null;
  status: string | null;
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
