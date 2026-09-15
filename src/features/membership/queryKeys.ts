export const membershipQueryKeys = {
  requests: (params?: Record<string, unknown>) => ['membership', 'requests', params ?? {}] as const,
  assignedCareManager: ['care', 'assigned'] as const,
  assignedCompanion: ['care', 'assigned', 'COMPANION'] as const,
  careActivities: ['care', 'activities'] as const,
  careVisitSlots: (onDate: string) => ['care', 'visit-slots', onDate] as const,
};
