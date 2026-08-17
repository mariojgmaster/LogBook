import { describe, expect, it } from 'vitest';
import { ReminderSchedule } from '@/domain/entities/reminder-schedule';
describe('ReminderSchedule', () => {
  it('orders multiple times and skips disabled days', () => {
    const schedule = ReminderSchedule.create({
      enabled: true,
      weekdays: [1],
      times: ['17:00', '09:00'],
      snoozeMinutes: 10,
      revision: 1,
    });
    const values = schedule.nextOccurrences(new Date(2026, 7, 17, 8), 2);
    expect(values.map((item) => new Date(item.when).getHours())).toEqual([9, 17]);
    expect(values[0]?.targetLocalDate).toBe('2026-08-17');
  });
  it('validates snooze bounds', () =>
    expect(() =>
      ReminderSchedule.create({
        enabled: true,
        weekdays: [1],
        times: ['09:00'],
        snoozeMinutes: 2881,
        revision: 1,
      }),
    ).toThrow());
});
