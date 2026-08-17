import type { Clock } from '@/application/ports/platform';
import type { HolidayProvider, SettingsRepository } from '@/application/ports/repositories';
import { UserSettings, type Region } from '@/domain/entities/user-settings';
export class UpdateRegion {
  constructor(
    private readonly settings: SettingsRepository,
    private readonly holidays: HolidayProvider,
    private readonly clock: Clock,
  ) {}
  async execute(region: Region, expectedRevision: number, confirmed: boolean) {
    if (!confirmed) return this.settings.getUserSettings();
    const current = UserSettings.restore(await this.settings.getUserSettings());
    const updated = current.withRegion(region, this.clock.now());
    await this.holidays.setRegion(region);
    await this.settings.saveUserSettings(updated.props, expectedRevision);
    return updated.props;
  }
}
