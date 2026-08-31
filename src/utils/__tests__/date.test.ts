import { combineDateAndTime, formatLongDate, toDisplayDate, toIsoDate } from '../date';

describe('display date format', () => {
  it('converts ISO dates to DD-MM-YYYY', () => {
    expect(toDisplayDate('1952-03-10')).toBe('10-03-1952');
    expect(toDisplayDate('15-09-2026')).toBe('15-09-2026');
  });

  it('converts DD-MM-YYYY back to ISO for the API', () => {
    expect(toIsoDate('10-03-1952')).toBe('1952-03-10');
    expect(toIsoDate('10 / 03 / 1952')).toBe('1952-03-10');
    expect(toIsoDate('2026-09-15')).toBe('2026-09-15');
  });

  it('formats long dates as DD-MM-YYYY', () => {
    expect(formatLongDate('2026-08-20')).toBe('20-08-2026');
  });

  it('combines DD-MM-YYYY with time into an IST ISO datetime', () => {
    expect(combineDateAndTime('15-09-2026', '10:00')).toBe('2026-09-15T10:00:00+05:30');
  });
});
