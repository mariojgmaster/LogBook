import { describe, expect, it } from 'vitest';
import {
  formatDurationHours,
  parseDurationHours,
} from '@/application/services/duration-hours-codec';

describe('duration hours codec', () => {
  it.each([
    [120, '2'],
    [30, '0,5'],
    [1, '0,0167'],
    [59, '0,9833'],
    [61, '1,0167'],
    [1440, '24'],
  ])('formats %i minutes canonically as %s hours', (minutes, expected) => {
    expect(formatDurationHours(minutes)).toBe(expected);
  });

  it('round-trips every minute in the record domain', () => {
    for (let minutes = 1; minutes <= 1440; minutes += 1) {
      expect(parseDurationHours(formatDurationHours(minutes), 1440)).toBe(minutes);
    }
  });

  it('accepts comma, exact decimal products and insignificant trailing zeroes', () => {
    expect(parseDurationHours('0,5')).toBe(30);
    expect(parseDurationHours('2')).toBe(120);
    expect(parseDurationHours('0,5000')).toBe(30);
    expect(parseDurationHours('0,01670')).toBe(1);
  });

  it.each(['', '0', '-1', 'abc', '0,0166', '0,0168', '1,23456', '24,1'])(
    'rejects noncanonical or out-of-range input %s',
    (value) => expect(() => parseDurationHours(value, 1440)).toThrow(),
  );
});
