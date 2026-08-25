export const DISPLAY_DATE_PLACEHOLDER = 'DD-MM-YYYY';
export const DISPLAY_DATE_REGEX = /^\d{2}-\d{2}-\d{4}$/;

const DISPLAY_DATE_CAPTURE = /^(\d{2})-(\d{2})-(\d{4})$/;
const ISO_DATE_CAPTURE = /^(\d{4})-(\d{2})-(\d{2})/;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function toDisplayParts(year: number, month: number, day: number): string {
  return `${pad2(day)}-${pad2(month)}-${year}`;
}

function toIsoParts(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseISODate(value: string): Date {
  return new Date(value);
}

/** Convert YYYY-MM-DD or an ISO datetime to DD-MM-YYYY for forms and display. */
export function toDisplayDate(value: string | null | undefined): string {
  if (!value?.trim()) {
    return '';
  }
  const trimmed = value.trim();
  if (DISPLAY_DATE_CAPTURE.test(trimmed)) {
    return trimmed;
  }
  const iso = trimmed.match(ISO_DATE_CAPTURE);
  if (iso && !trimmed.includes('T') && trimmed.length <= 10) {
    return toDisplayParts(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }
  const parsed = parseISODate(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return toDisplayParts(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
}

/** Convert DD-MM-YYYY (or already ISO YYYY-MM-DD) to YYYY-MM-DD for the API. */
export function toIsoDate(value: string | null | undefined): string {
  if (!value?.trim()) {
    return '';
  }
  const trimmed = value.trim();
  const display = trimmed.match(DISPLAY_DATE_CAPTURE);
  if (display) {
    return toIsoParts(Number(display[3]), Number(display[2]), Number(display[1]));
  }
  const iso = trimmed.match(ISO_DATE_CAPTURE);
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }
  return trimmed;
}

export function combineDateAndTime(date: string, time: string): string {
  return `${toIsoDate(date)}T${time}:00+05:30`;
}

export function splitDateAndTime(value: string | null | undefined): { date: string; time: string } {
  if (!value) {
    return { date: '', time: '' };
  }
  const parsed = parseISODate(value);
  if (Number.isNaN(parsed.getTime())) {
    return { date: '', time: '' };
  }
  return {
    date: toDisplayParts(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate()),
    time: `${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}`,
  };
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
  return toDisplayDate(value) || value;
}

export function formatShortDate(value: string): string {
  return toDisplayDate(value) || value;
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
