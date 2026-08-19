import type { AlarmPort, Clock, OptionalPermissionPort } from '@/application/ports/platform';
import type { SettingsRepository } from '@/application/ports/repositories';
import { AppError } from '@/domain/errors/app-error';
import { ReminderSchedule, type ReminderScheduleProps } from '@/domain/entities/reminder-schedule';

export class UpdateReminders {
  constructor(
    private readonly settings: SettingsRepository,
    private readonly alarms: AlarmPort,
    private readonly clock: Clock,
    private readonly permissions?: OptionalPermissionPort,
  ) {}
  async execute(
    input: Omit<ReminderScheduleProps, 'revision'>,
    expectedRevision: number,
    requestPermission: boolean,
  ) {
    const current = await this.settings.getReminderSchedule();
    if (current.revision !== expectedRevision) throw new AppError('CONFLICT');
    const schedule = ReminderSchedule.create({ ...input, revision: current.revision + 1 });
    const hasPermissions = this.permissions
      ? await this.permissions.contains(['alarms'])
      : await this.alarms.hasPermission();
    if (schedule.props.enabled && !hasPermissions) {
      const granted = this.permissions
        ? requestPermission && (await this.permissions.ensure(['alarms']))
        : requestPermission && (await this.alarms.requestPermission());
      if (!granted) throw new AppError('PERMISSION_DENIED');
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
