import { colors } from '@/constants/theme';
import type {
  AppointmentStatus,
  CareStatus,
  EmergencyCaseStatus,
  PaymentStatus,
  VisitStatus,
} from '@/types';

export interface StatusPresentation {
  label: string;
  color: string;
  background: string;
}

export function careStatusPresentation(status: CareStatus): StatusPresentation {
  switch (status) {
    case 'safe_and_well':
      return { label: 'Safe & Well', color: colors.safe, background: colors.safeSoft };
    case 'needs_attention':
      return { label: 'Needs Attention', color: colors.warning, background: colors.warningSoft };
    case 'emergency':
      return { label: 'Emergency Support', color: colors.emergency, background: colors.emergencySoft };
  }
}

export function visitStatusPresentation(status: VisitStatus): StatusPresentation {
  switch (status) {
    case 'scheduled':
      return { label: 'Scheduled', color: colors.primary, background: colors.primarySoft };
    case 'in_progress':
      return { label: 'In Progress', color: colors.warning, background: colors.warningSoft };
    case 'completed':
      return { label: 'Completed', color: colors.safe, background: colors.safeSoft };
    case 'cancelled':
      return { label: 'Cancelled', color: colors.textSecondary, background: colors.border };
  }
}

export function appointmentStatusPresentation(status: AppointmentStatus): StatusPresentation {
  switch (status) {
    case 'confirmed':
      return { label: 'Confirmed', color: colors.safe, background: colors.safeSoft };
    case 'pending':
      return { label: 'Pending', color: colors.warning, background: colors.warningSoft };
    case 'completed':
      return { label: 'Completed', color: colors.primary, background: colors.primarySoft };
    case 'cancelled':
      return { label: 'Cancelled', color: colors.textSecondary, background: colors.border };
  }
}

export function paymentStatusPresentation(status: PaymentStatus): StatusPresentation {
  switch (status) {
    case 'paid':
      return { label: 'Paid', color: colors.safe, background: colors.safeSoft };
    case 'pending':
      return { label: 'Pending', color: colors.warning, background: colors.warningSoft };
    case 'failed':
      return { label: 'Failed', color: colors.emergency, background: colors.emergencySoft };
  }
}

export function emergencyStatusPresentation(status: EmergencyCaseStatus): StatusPresentation {
  switch (status) {
    case 'notified':
      return { label: 'Team Notified', color: colors.primary, background: colors.primarySoft };
    case 'coordinating':
      return { label: 'Coordinating Support', color: colors.warning, background: colors.warningSoft };
    case 'resolved':
      return { label: 'Resolved', color: colors.safe, background: colors.safeSoft };
  }
}
