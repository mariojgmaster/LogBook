import { describe, expect, it } from 'vitest';
import {
  formatDurationClock,
  parseDurationClock,
} from '@/application/services/duration-clock-codec';

describe('duration clock codec', () => {
  it.each([
    [1, '00:01'],
    [10, '00:10'],
    [30, '00:30'],
    [90, '01:30'],
    [2_880, '48:00'],
  ])('round-trips %i minutes as %s', (minutes, display) => {
    expect(formatDurationClock(minutes)).toBe(display);
    expect(parseDurationClock(display)).toBe(minutes);
  });

  it.each(['0:30', '00:00', '00:60', '48:01', '49:00', '0,5', 'abc'])('rejects %s', (value) => {
    expect(() => parseDurationClock(value)).toThrow();
  });
});
