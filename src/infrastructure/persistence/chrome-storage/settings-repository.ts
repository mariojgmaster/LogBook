import { z } from 'zod';
import { AppError } from '@/domain/errors/app-error';
import type { SettingsRepository } from '@/application/ports/repositories';
import type { ReminderScheduleProps } from '@/domain/entities/reminder-schedule';
import type { UserSettingsProps } from '@/domain/entities/user-settings';
import { ChromeSettingsStore } from './settings-store';

const userSettingsSchema: z.ZodType<UserSettingsProps> = z.object({
  region: z
    .object({
      uf: z.string().regex(/^[A-Z]{2}$/),
      municipalityCode: z
        .string()
        .regex(/^\d{7}$/)
        .optional(),
    })
    .optional(),
  revision: z.number().int().positive(),
  updatedAt: z.string().datetime(),
});
const reminderSchema: z.ZodType<ReminderScheduleProps> = z.object({
  enabled: z.boolean(),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1),
  times: z.array(z.string().regex(/^\d{2}:\d{2}$/)).min(1),
  snoozeMinutes: z.number().int().min(1).max(2880),
  revision: z.number().int().positive(),
});

export class ChromeSettingsRepository implements SettingsRepository {
  constructor(
    private readonly store = new ChromeSettingsStore(),
    private readonly now = () => new Date(),
  ) {}
  getUserSettings(): Promise<UserSettingsProps> {
    return this.store.get('userSettings', userSettingsSchema, {
      revision: 1,
      updatedAt: this.now().toISOString(),
    });
  }
  async saveUserSettings(settings: UserSettingsProps, expectedRevision: number): Promise<void> {
    const current = await this.getUserSettings();
    if (current.revision !== expectedRevision) throw new AppError('CONFLICT');
    await this.store.set('userSettings', userSettingsSchema.parse(settings));
  }
  getReminderSchedule(): Promise<ReminderScheduleProps> {
    return this.store.get('reminderSchedule', reminderSchema, {
      enabled: false,
      weekdays: [1, 2, 3, 4, 5],
      times: ['17:30'],
      snoozeMinutes: 10,
      revision: 1,
    });
  }
  async saveReminderSchedule(
    schedule: ReminderScheduleProps,
    expectedRevision: number,
  ): Promise<void> {
    const current = await this.getReminderSchedule();
    if (current.revision !== expectedRevision) throw new AppError('CONFLICT');
    await this.store.set('reminderSchedule', reminderSchema.parse(schedule));
  }
}
