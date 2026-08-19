import type { Clock } from '@/application/ports/platform';
import type { SettingsRepository } from '@/application/ports/repositories';
import { UserSettings } from '@/domain/entities/user-settings';
import { findReminderSound } from '@/shared/reminder-sounds';
import { AppError } from '@/domain/errors/app-error';

export class UpdateReminderSound {
  constructor(
    private readonly settings: SettingsRepository,
    private readonly clock: Clock,
  ) {}

  async execute(soundId: string, expectedRevision: number) {
    if (!findReminderSound(soundId)) throw new AppError('VALIDATION');
    const current = await this.settings.getUserSettings();
    const updated = UserSettings.restore(current).withPreferences(
      {
        monthViewMode: current.monthViewMode!,
        reminderSoundId: soundId,
      },
      this.clock.now(),
    );
    await this.settings.saveUserSettings(updated.props, expectedRevision);
    return updated.props;
  }
}
