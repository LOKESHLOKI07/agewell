import type { MembershipApplicationStage, MembershipRequest } from './membershipTypes';
import { applicationIdFromRequestId } from './applicationForm';

export type ApplicationTimelineTone = 'completed' | 'current' | 'pending';

export type ApplicationTimelineStep = {
  id: string;
  title: string;
  tone: ApplicationTimelineTone;
  detail?: string;
  icon?: 'calendar-outline' | 'home-outline' | 'document-text-outline' | 'shield-checkmark-outline' | 'card-outline' | 'scan-search';
};

export function formatApplicationWhen(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatVisitWindow(start: string | null, end: string | null): string {
  if (!start) {
    return '';
  }
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) {
    return '';
  }
  const day = startDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const startTime = startDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (!end) {
    return `${day} • ${startTime}`;
  }
  const endDate = new Date(end);
  if (Number.isNaN(endDate.getTime())) {
    return `${day} • ${startTime}`;
  }
  const endTime = endDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return `${day} • ${startTime} – ${endTime}`;
}

export function displayApplicationId(request: MembershipRequest): string {
  return applicationIdFromRequestId(request.id);
}

const STAGE_RANK: Record<MembershipApplicationStage, number> = {
  SUBMITTED: 0,
  VISIT_PLANNED: 1,
  VISIT_SCHEDULED: 2,
  VISIT_COMPLETED: 3,
  IN_REVIEW: 4,
  ACCEPTED: 5,
  APPROVED: 6,
  REJECTED: -1,
};

function toneFor(rank: number, currentRank: number): ApplicationTimelineTone {
  if (rank < currentRank) return 'completed';
  if (rank === currentRank) return 'current';
  return 'pending';
}

export function buildApplicationTimeline(request: MembershipRequest): ApplicationTimelineStep[] {
  const stage = request.stage || 'SUBMITTED';
  if (stage === 'REJECTED' || request.status === 'REJECTED') {
    return [
      {
        id: 'submitted',
        title: 'Application Submitted',
        tone: 'completed',
        detail: request.createdAt ? `Submitted on ${formatApplicationWhen(request.createdAt)}` : undefined,
        icon: 'document-text-outline',
      },
      {
        id: 'rejected',
        title: 'Application Not Accepted',
        tone: 'current',
        detail: 'AgeWell could not accept this application. Please contact support for next steps.',
        icon: 'shield-checkmark-outline',
      },
    ];
  }

  const currentRank = STAGE_RANK[stage] ?? 0;
  // Member-facing timeline starts at visit planned (index 1). SUBMITTED shows step 1 as current.
  const displayRank = Math.max(currentRank, 1);
  const staffLine = [
    request.careManagerName ? `Care Manager: ${request.careManagerName}` : null,
    request.companionName ? `Companion: ${request.companionName}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const steps: ApplicationTimelineStep[] = [
    {
      id: 'visit-planned',
      title: 'Executive Visit Planned',
      tone: toneFor(1, displayRank),
      icon: 'calendar-outline',
      detail:
        request.visitPlannedAt
          ? `Our team has planned a home visit by our AgeWell executive.\n${formatApplicationWhen(request.visitPlannedAt)}${staffLine ? `\n${staffLine}` : ''}`
          : displayRank === 1
            ? 'Our team will plan a home visit by an AgeWell executive.'
            : 'Our team has planned a home visit by our AgeWell executive.',
    },
    {
      id: 'visit-scheduled',
      title: 'Scheduled Visit Date',
      tone: toneFor(2, displayRank),
      icon: 'calendar-outline',
      detail: request.visitScheduledStart
        ? `Your home visit was scheduled on:\n${formatVisitWindow(request.visitScheduledStart, request.visitScheduledEnd)}`
        : displayRank === 2
          ? 'Visit date will appear here once AgeWell schedules it.'
          : undefined,
    },
    {
      id: 'visit-completed',
      title: 'Visit Completed',
      tone: toneFor(3, displayRank),
      icon: 'home-outline',
      detail: request.visitCompletedAt
        ? `Our executive has completed the home visit and updated the assessment details.\n${formatApplicationWhen(request.visitCompletedAt)}`
        : 'Our executive will complete the home visit and assess your requirements.',
    },
    {
      id: 'review',
      title: 'Application in Review',
      tone: toneFor(4, displayRank),
      icon: 'scan-search',
      detail: request.reviewCompletedAt
        ? `Our team has reviewed your application and assessment details.\n${formatApplicationWhen(request.reviewCompletedAt)}`
        : 'Our team will review the assessment and finalise the membership details.',
    },
    {
      id: 'accepted',
      title: 'Application Accepted',
      tone: toneFor(5, displayRank),
      icon: 'shield-checkmark-outline',
      detail:
        stage === 'ACCEPTED' || stage === 'APPROVED'
          ? `Your application has been approved. Please complete the payment to activate your AgeWell membership.\n${formatApplicationWhen(request.acceptedAt)}`
          : 'You will be informed once your application is approved.',
    },
    {
      id: 'payment',
      title: 'Payment of Membership',
      tone: stage === 'APPROVED' ? 'completed' : toneFor(6, Math.max(displayRank, stage === 'ACCEPTED' ? 6 : displayRank)),
      icon: 'card-outline',
      detail:
        stage === 'APPROVED'
          ? `Payment received. Membership is active.\n${formatApplicationWhen(request.paidAt)}`
          : stage === 'ACCEPTED'
            ? 'Complete the payment to activate your AgeWell membership.'
            : 'Pay Now appears only after your application is accepted.',
    },
  ];

  // When ACCEPTED, payment is the current step (rank 6 current).
  if (stage === 'ACCEPTED') {
    return steps.map((step) => {
      if (step.id === 'payment') return { ...step, tone: 'current' as const };
      if (step.id === 'accepted') return { ...step, tone: 'completed' as const };
      return step;
    });
  }

  return steps;
}

export function canPayForApplication(request: MembershipRequest): boolean {
  return request.stage === 'ACCEPTED' && request.status === 'REQUESTED';
}

export const ADMIN_STAGE_ACTIONS: {
  stage: MembershipApplicationStage;
  label: string;
  needsSchedule?: boolean;
}[] = [
  { stage: 'VISIT_PLANNED', label: '1. Mark visit planned' },
  { stage: 'VISIT_SCHEDULED', label: '2. Schedule visit', needsSchedule: true },
  { stage: 'VISIT_COMPLETED', label: '3. Mark visit completed' },
  { stage: 'IN_REVIEW', label: '4. Mark in review' },
  { stage: 'ACCEPTED', label: '5. Accept application' },
  { stage: 'APPROVED', label: '6. Confirm payment' },
];

export function nextAdminStages(current: MembershipApplicationStage): typeof ADMIN_STAGE_ACTIONS {
  const rank = STAGE_RANK[current] ?? 0;
  if (current === 'REJECTED' || current === 'APPROVED') {
    return [];
  }
  // Only expose the next step so admins advance in order (visit dates required for schedule).
  const remaining = ADMIN_STAGE_ACTIONS.filter((action) => (STAGE_RANK[action.stage] ?? 0) > rank);
  return remaining.slice(0, 1);
}
