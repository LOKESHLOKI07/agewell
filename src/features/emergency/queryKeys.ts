export const emergencyQueryKeys = {
  list: ['emergency', 'list'] as const,
  detail: (id: string) => ['emergency', id] as const,
  events: (id: string) => ['emergency', id, 'events'] as const,
};
