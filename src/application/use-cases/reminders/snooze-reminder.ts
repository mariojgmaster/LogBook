import type { AlarmPort, Clock } from '@/application/ports/platform';
import type { ReminderOccurrence } from '@/domain/entities/reminder-schedule';
import { ReminderSchedule } from '@/domain/entities/reminder-schedule';

export class SnoozeReminder {
  constructor(
    private readonly alarms: AlarmPort,
    private readonly clock: Clock,
  ) {}
  async execute(occurrence: ReminderOccurrence, minutes: number) {
    const placeholder = ReminderSchedule.create({
      enabled: true,
      weekdays: [1],
      times: ['00:00'],
      snoozeMinutes: minutes,
      revision: 1,
    });
    for (const alarm of await this.alarms.list()) await this.alarms.cancel(alarm.name);
    const snoozed = placeholder.snooze(occurrence, minutes, this.clock.now());
    await this.alarms.schedule(snoozed);
    return snoozed;
  }
}
