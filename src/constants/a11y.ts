/**
 * Accessibility helpers for senior-friendly UI.
 * Prefer these over ad-hoc numbers in new screens.
 */
export const a11y = {
  /** Minimum touch target edge length (px). */
  minTouch: 48,
  /** Preferred body text size for dense senior reading. */
  readableBody: 16,
  /** Preferred caption size — still legible. */
  readableCaption: 13,
  /** Avoid relying on color alone; always pair with text/icon. */
  statusMustIncludeText: true,
} as const;
