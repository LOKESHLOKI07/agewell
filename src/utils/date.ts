const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseISODate(value: string): Date {
  return new Date(value);
}

export function formatTime(value: string): string {
  const date = parseISODate(value);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${minutes} ${suffix}`;
}

export function formatLongDate(value: string): string {
  const date = parseISODate(value);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatShortDate(value: string): string {
  const date = parseISODate(value);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function formatRelativeDay(value: string, now = new Date()): string {
  const date = startOfDay(parseISODate(value));
  const today = startOfDay(now);
  const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Tomorrow';
  }
  if (diffDays === -1) {
    return 'Yesterday';
  }
  return formatShortDate(value);
}

export function formatRelativeTimestamp(value: string, now = new Date()): string {
  const date = parseISODate(value);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (diffMinutes < 1) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }
  return formatRelativeDay(value, now);
}

export function formatCurrencyInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
