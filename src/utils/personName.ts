/** Join first/last without repeating a one-word full name. */
export function joinPersonName(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.trim() ?? '';
  const last = lastName?.trim() ?? '';
  if (!last || last.toLowerCase() === first.toLowerCase()) {
    return first;
  }
  return `${first} ${last}`.trim();
}
