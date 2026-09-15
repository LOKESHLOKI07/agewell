export const APP_TIMEZONE = 'Asia/Kolkata';
export const CARE_MANAGER_CALL_HOURS_MESSAGE =
  'Care Manager calling service is available between 10:00 AM and 6:00 PM. Please try again during service hours.';

export function zonedClock(now = new Date(), timeZone = APP_TIMEZONE): { hour: number; minute: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return { hour: Number(parts.hour), minute: Number(parts.minute) };
}

export function isCareManagerCallOpen(now = new Date()): boolean {
  const { hour, minute } = zonedClock(now);
  const mins = hour * 60 + minute;
  return mins >= 10 * 60 && mins < 18 * 60;
}

export function whatsappHref(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, '');
  const base = `https://wa.me/${digits}`;
  if (!text) {
    return base;
  }
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/\s/g, '')}`;
}
