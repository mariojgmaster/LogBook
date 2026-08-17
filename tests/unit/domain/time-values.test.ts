import { describe, expect, it } from 'vitest';
import { LocalDate } from '@/domain/value-objects/local-date';
import { TimeRange, formatClockTime, parseClockTime } from '@/domain/value-objects/time-range';

describe('civil time value objects', () => {
  it('validates leap dates without UTC conversion', () => {
    expect(LocalDate.parse('2024-02-29').value).toBe('2024-02-29');
    expect(() => LocalDate.parse('2023-02-29')).toThrow();
  });
  it('adds days across month boundaries', () =>
    expect(LocalDate.parse('2026-01-31').addDays(1).value).toBe('2026-02-01'));
  it('validates clock time and same-day ranges', () => {
    expect(parseClockTime('08:30')).toBe(510);
    expect(formatClockTime(1440)).toBe('24:00');
    expect(TimeRange.fromDuration(480, 480).endMinute).toBe(960);
    expect(() => TimeRange.fromDuration(1380, 120)).toThrow();
  });
});
