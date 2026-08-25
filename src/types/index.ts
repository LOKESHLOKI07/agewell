export type UserRole = 'family_member';

export type CareStatus = 'safe_and_well' | 'needs_attention' | 'emergency';

export type VisitStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type AppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';

export type PaymentStatus = 'paid' | 'pending' | 'failed';

export type ServiceRequestStatus = 'received' | 'contacted' | 'scheduled' | 'cancelled';

export type EmergencyCaseStatus = 'notified' | 'coordinating' | 'resolved';

export type NotificationType = 'visit' | 'appointment' | 'care' | 'payment' | 'service';

export interface Address {
  line1: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

export interface Doctor {
  name: string;
  specialty: string;
}

export interface Hospital {
  name: string;
  area: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  familyId: string;
}

export interface Family {
  id: string;
  name: string;
  seniorIds: string[];
  memberIds: string[];
}

export interface Senior {
  id: string;
  familyId: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: 'female' | 'male' | 'other';
  address: Address;
  careStatus: CareStatus;
  membershipId: string;
  primaryDoctor: Doctor;
  hospital: Hospital;
  emergencyContacts: EmergencyContact[];
}

export interface CareManager {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  title: string;
}

export interface Membership {
  id: string;
  name: string;
  priceInrPerMonth: number;
  nextRenewalAt: string;
}

export interface Visit {
  id: string;
  seniorId: string;
  careManagerId: string;
  type: string;
  scheduledAt: string;
  durationMinutes: number;
  status: VisitStatus;
  summary?: string;
}

export interface VisitReport {
  id: string;
  visitId: string;
  careSummary: string;
  observations: string[];
  nextSteps: string[];
  fullReportAvailable: boolean;
}

export interface Appointment {
  id: string;
  seniorId: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  scheduledAt: string;
  purpose: string;
  status: AppointmentStatus;
}

export interface CreateAppointmentInput {
  seniorId: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  scheduledAt: string;
  purpose: string;
}

export interface ServiceCatalogItem {
  id: string;
  category?: 'CARE' | 'FOOD & HOME' | 'HEALTH' | 'MOBILITY' | 'LIFE & COMMUNITY' | 'EXTRA';
  title: string;
  description: string;
  icon: string;
  whatIsIncluded?: string[];
  estimatedDuration?: string;
  availability?: string;
  pricingPlaceholder?: string;
  membershipBenefit?: string;
  addonsIds?: string[];
}

export interface ServiceRequest {
  id: string;
  serviceId: string;
  seniorId: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  status: ServiceRequestStatus;
  createdAt: string;
}

export interface CreateServiceRequestInput {
  serviceId: string;
  seniorId: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
}

export interface Payment {
  id: string;
  membershipId: string;
  amountInr: number;
  paidAt: string;
  status: PaymentStatus;
}

export interface EmergencyCase {
  id: string;
  seniorId: string;
  status: EmergencyCaseStatus;
  createdAt: string;
  message: string;
}

export interface MedicalReport {
  id: string;
  seniorId: string;
  name: string;
  date: string;
  type: string;
  pdfUrl?: string;
}

export interface Medication {
  id: string;
  seniorId: string;
  name: string;
  dosage: string;
  schedule: ('Morning' | 'Afternoon' | 'Night')[];
  status: 'active' | 'completed';
}

export interface CommunityEvent {
  id: string;
  type: 'event' | 'trip' | 'activity' | 'learning' | 'movies' | 'music' | 'theatre' | 'books' | 'news' | 'puzzles' | 'cultural' | 'local';
  title: string;
  date: string;
  time: string;
  location: string;
  shortDescription: string;
  fullDescription: string;
  imageUrl?: string;
  availability: number;
  whatToExpect?: string[];
  transportation?: string;
}

export interface AddOn {
  id: string;
  category: string;
  title: string;
  description: string;
  price: number;
  unit: string;
  icon: string;
}
