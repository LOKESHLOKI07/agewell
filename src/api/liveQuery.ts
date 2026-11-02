/**
 * Focused live-data polling for web/staff screens.
 * Keep intervals modest and pair with paginated / filtered API calls.
 */
export const LIVE_POLL_MS = {
  /** Emergencies / SOS-adjacent */
  urgent: 5_000,
  /** Notifications, service requests, dispatch queue, counts */
  standard: 10_000,
  /** Today visits / deliveries (less chatty) */
  relaxed: 15_000,
} as const;

export function liveQueryOptions(intervalMs: number) {
  return {
    refetchInterval: intervalMs,
    refetchIntervalInBackground: false as const,
    refetchOnWindowFocus: true,
    // Allow the interval to matter; default global staleTime is 60s.
    staleTime: Math.min(Math.floor(intervalMs / 2), 5_000),
  };
}
