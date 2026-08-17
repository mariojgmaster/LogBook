import { describe, expect, it } from 'vitest';
import { ReminderSchedule } from '@/domain/entities/reminder-schedule';
describe('snooze', () => {
  it('preserves original target date across midnight', () => {
    const schedule = ReminderSchedule.create({
      enabled: true,
      weekdays: [1],
      times: ['23:50'],
      snoozeMinutes: 30,
      revision: 1,
    });
    const original = schedule.nextOccurrences(new Date(2026, 7, 17, 23), 1)[0]!;
    const snoozed = schedule.snooze(original, 30, new Date(2026, 7, 17, 23, 50));
    expect(new Date(snoozed.when).getDate()).toBe(18);
    expect(snoozed.targetLocalDate).toBe('2026-08-17');
  });
});
