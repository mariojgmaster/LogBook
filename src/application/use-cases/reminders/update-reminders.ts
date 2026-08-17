import type { AlarmPort, Clock } from '@/application/ports/platform';
import type { SettingsRepository } from '@/application/ports/repositories';
import { AppError } from '@/domain/errors/app-error';
import { ReminderSchedule, type ReminderScheduleProps } from '@/domain/entities/reminder-schedule';

export class UpdateReminders {
  constructor(
    private readonly settings: SettingsRepository,
    private readonly alarms: AlarmPort,
    private readonly clock: Clock,
  ) {}
  async execute(
    input: Omit<ReminderScheduleProps, 'revision'>,
    expectedRevision: number,
    requestPermission: boolean,
  ) {
    const current = await this.settings.getReminderSchedule();
    if (current.revision !== expectedRevision) throw new AppError('CONFLICT');
    const schedule = ReminderSchedule.create({ ...input, revision: current.revision + 1 });
    if (schedule.props.enabled && !(await this.alarms.hasPermission())) {
      if (!requestPermission || !(await this.alarms.requestPermission()))
        throw new AppError('PERMISSION_DENIED');
    }
    await this.clearManaged();
    if (schedule.props.enabled)
      for (const occurrence of schedule.nextOccurrences(this.clock.now()))
        await this.alarms.schedule(occurrence);
    await this.settings.saveReminderSchedule(schedule.props, expectedRevision);
    return {
      schedule: schedule.props,
      nextOccurrence: schedule.nextOccurrences(this.clock.now(), 1)[0],
    };
  }
  private async clearManaged() {
    for (const alarm of await this.alarms.list()) await this.alarms.cancel(alarm.name);
  }
}
