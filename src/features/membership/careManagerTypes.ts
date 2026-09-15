import type { IconName } from '@/components/ui';

export const CARE_ACTIVITY_TYPES = [
  'CALL',
  'MESSAGE',
  'VISIT',
  'HOME_VISIT',
  'HEALTH',
  'MEDICINE',
  'GROCERY',
  'FOLLOW_UP_CALL',
  'EMERGENCY',
  'DIGITAL',
  'TRANSPORT',
  'MAINTENANCE',
  'GENERAL',
] as const;

export type CareActivityType = (typeof CARE_ACTIVITY_TYPES)[number];

export const CARE_ACTIVITY_STATUSES = [
  'REQUESTED',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;

export type CareActivityStatus = (typeof CARE_ACTIVITY_STATUSES)[number];

export interface AssignedCareManager {
  id: string;
  userId: string | null;
  employeeId: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  skills: string | null;
  experience: string | null;
  languages: string | null;
  availability: string | null;
  status: string | null;
  staffKind: string | null;
}

export interface AssignedCareManagerPage {
  assigned: boolean;
  inServiceArea: boolean;
  seniorId: string | null;
  careManager: AssignedCareManager | null;
}

export interface CareActivity {
  id: string;
  seniorId: string;
  careManagerId: string | null;
  careManagerName: string | null;
  activityType: CareActivityType;
  status: CareActivityStatus;
  icon: IconName;
  title: string;
  occurredAt: string | null;
  scheduledAt: string | null;
  reason: string | null;
  discussion: string | null;
  actionTaken: string | null;
  servicesCoordinated: string | null;
  followUpRequired: boolean;
  followUpDate: string | null;
  followUpNotes: string | null;
  notes: string | null;
  visitId: string | null;
  createdAt: string | null;
}

export interface CareVisitSlot {
  startAt: string;
  label: string;
}

export interface CareActivityUpdate {
  activityType?: CareActivityType;
  status?: CareActivityStatus;
  reason?: string | null;
  discussion?: string | null;
  actionTaken?: string | null;
  servicesCoordinated?: string | null;
  followUpRequired?: boolean;
  followUpDate?: string | null;
  followUpNotes?: string | null;
  notes?: string | null;
}
