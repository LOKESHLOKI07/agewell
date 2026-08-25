export const homeQueryKeys = {
  seniorMe: ['senior', 'me'] as const,
  visitsToday: ['visits', 'today'] as const,
  visitsUpcoming: ['visits', 'upcoming'] as const,
  visitsMine: ['visits', 'mine'] as const,
  appointmentsUpcoming: ['appointments', 'upcoming'] as const,
  medications: ['medications'] as const,
  serviceRequests: ['serviceRequests'] as const,
  services: ['services'] as const,
  membershipCurrent: ['membership', 'current'] as const,
  membershipUsage: ['membership', 'usage'] as const,
  notificationsUnread: ['notifications', 'unread'] as const, // shared with notificationQueryKeys.unread
};
