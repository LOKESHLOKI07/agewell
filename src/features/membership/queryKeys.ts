export const membershipQueryKeys = {
  requests: (params?: Record<string, unknown>) => ['membership', 'requests', params ?? {}] as const,
};
