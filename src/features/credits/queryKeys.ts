export const creditQueryKeys = {
  all: ['credits'] as const,
  balances: (seniorId?: string) => ['credits', 'balances', seniorId ?? 'me'] as const,
  transactions: (params?: Record<string, unknown>) => ['credits', 'transactions', params ?? {}] as const,
  expenses: (params?: Record<string, unknown>) => ['credits', 'expenses', params ?? {}] as const,
};
