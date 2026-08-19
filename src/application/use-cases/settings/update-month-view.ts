import type { Clock } from '@/application/ports/platform';
import type { SettingsRepository } from '@/application/ports/repositories';
import { UserSettings, type MonthViewMode } from '@/domain/entities/user-settings';

export class UpdateMonthView {
  constructor(
    private readonly settings: SettingsRepository,
    private readonly clock: Clock,
  ) {}

  async execute(mode: MonthViewMode, expectedRevision: number) {
    const current = await this.settings.getUserSettings();
    const updated = UserSettings.restore(current).withPreferences(
      {
        monthViewMode: mode,
        reminderSoundId: current.reminderSoundId!,
      },
      this.clock.now(),
    );
    await this.settings.saveUserSettings(updated.props, expectedRevision);
    return updated.props;
  }
}
