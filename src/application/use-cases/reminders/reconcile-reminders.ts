import type {
  AlarmPort,
  Clock,
  OptionalPermissionPort,
  ReminderAudioPort,
} from '@/application/ports/platform';
import type { RecordRepository, SettingsRepository } from '@/application/ports/repositories';
import { ReminderSchedule } from '@/domain/entities/reminder-schedule';

export class ReconcileReminders {
  constructor(
    private readonly settings: SettingsRepository,
    private readonly records: RecordRepository,
    private readonly alarms: AlarmPort,
    private readonly clock: Clock,
    private readonly permissions?: OptionalPermissionPort,
    private readonly audio?: ReminderAudioPort,
  ) {}
  async execute() {
    const schedule = ReminderSchedule.create(await this.settings.getReminderSchedule());
    for (const alarm of await this.alarms.list()) await this.alarms.cancel(alarm.name);
    const allowed = this.permissions
      ? await this.permissions.contains(['alarms'])
      : await this.alarms.hasPermission();
    if (!schedule.props.enabled || !allowed) {
      await this.audio?.close().catch(() => undefined);
      return { enabled: schedule.props.enabled, permission: false, nextOccurrence: undefined };
    }
    const occurrences = schedule.nextOccurrences(this.clock.now());
    for (const occurrence of occurrences) {
      if ((await this.records.listByDate(occurrence.targetLocalDate)).length === 0)
        await this.alarms.schedule(occurrence);
    }
    return { enabled: true, permission: true, nextOccurrence: occurrences[0] };
  }
}
