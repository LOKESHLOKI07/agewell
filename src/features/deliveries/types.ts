import type { DeliveryStatus } from '@/features/care/types';

export interface MemberDeliveryResponse {
  id: string;
  care_manager_id: string;
  senior_id: string | null;
  service_request_id: string | null;
  title: string;
  customer_name: string | null;
  location: string | null;
  status: DeliveryStatus;
  scheduled_at: string | null;
  executive_name: string | null;
}

export interface MemberDelivery {
  id: string;
  careManagerId: string;
  seniorId: string | null;
  serviceRequestId: string | null;
  title: string;
  customerName: string | null;
  location: string | null;
  status: DeliveryStatus;
  scheduledAt: string | null;
  executiveName: string | null;
}
