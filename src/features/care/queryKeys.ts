export const careQueryKeys = {
  profile: ['care', 'profile'] as const,
  visitsToday: ['care', 'visits', 'today'] as const,
  visitsUpcoming: ['care', 'visits', 'upcoming'] as const,
  visitDetail: (visitId: string) => ['care', 'visits', visitId] as const,
  visitTasks: (visitId: string) => ['care', 'visits', visitId, 'tasks'] as const,
  visitReports: (visitId: string) => ['care', 'visits', visitId, 'reports'] as const,
  appointments: ['care', 'appointments'] as const,
};
