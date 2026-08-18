import { AppError } from '@/domain/errors/app-error';

export interface Region {
  uf: string;
  municipalityCode?: string;
}
export type MonthViewMode = 'notice' | 'eventRange';
export interface UserSettingsProps {
  region?: Region;
  monthViewMode?: MonthViewMode;
  reminderSoundId?: string;
  revision: number;
  updatedAt: string;
}

export class UserSettings {
  private constructor(readonly props: Readonly<UserSettingsProps>) {}
  static defaults(now: Date): UserSettings {
    return new UserSettings({
      monthViewMode: 'notice',
      reminderSoundId: 'gentle-bell',
      revision: 1,
      updatedAt: now.toISOString(),
    });
  }
  static restore(props: UserSettingsProps): UserSettings {
    if (props.revision < 1) throw new AppError('STORAGE_UNAVAILABLE');
    if (props.region) validateRegion(props.region);
    if (
      !props.monthViewMode ||
      !['notice', 'eventRange'].includes(props.monthViewMode) ||
      !props.reminderSoundId
    ) {
      throw new AppError('STORAGE_UNAVAILABLE');
    }
    return new UserSettings({ ...props });
  }
  withRegion(region: Region, now: Date): UserSettings {
    validateRegion(region);
    return new UserSettings({
      ...this.props,
      region: { ...region },
      revision: this.props.revision + 1,
      updatedAt: now.toISOString(),
    });
  }
  withPreferences(
    preferences: Required<Pick<UserSettingsProps, 'monthViewMode' | 'reminderSoundId'>>,
    now: Date,
  ): UserSettings {
    return UserSettings.restore({
      ...this.props,
      ...preferences,
      revision: this.props.revision + 1,
      updatedAt: now.toISOString(),
    });
  }
}

const validateRegion = (region: Region) => {
  if (
    !/^[A-Z]{2}$/.test(region.uf) ||
    (region.municipalityCode && !/^\d{7}$/.test(region.municipalityCode))
  ) {
    throw new AppError('VALIDATION', { region: 'Selecione uma região válida.' });
  }
};
