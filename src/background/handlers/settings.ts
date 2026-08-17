import type { CompositionRoot } from '@/application/composition-root';
import type { AppRequest } from '@/shared/contracts/messages';
import { broadcastEntityChange } from '../events';
import { ReminderSchedule } from '@/domain/entities/reminder-schedule';

type Request = Extract<
  AppRequest,
  { type: 'settings.get' | 'settings.updateRegion' | 'holiday.coverage' }
>;
export const handleSettingsRequest = async (request: Request, root: CompositionRoot) => {
  await root.holidays.initialize();
  if (request.type === 'holiday.coverage') return root.holidays.getCoverage();
  if (request.type === 'settings.get') {
    const user = await root.repositories.settings.getUserSettings();
    const reminders = await root.repositories.settings.getReminderSchedule();
    if (user.region) await root.holidays.setRegion(user.region);
    return {
      user,
      reminders,
      nextOccurrence: ReminderSchedule.create(reminders).nextOccurrences(root.clock.now(), 1)[0],
      coverage: root.holidays.getCoverage(),
      permission: await root.alarms.hasPermission(),
    };
  }
  const value = await root.updateRegion.execute(
    { uf: request.payload.uf, municipalityCode: request.payload.municipalityCode },
    request.payload.expectedRevision,
    request.payload.confirmed,
  );
  broadcastEntityChange('settings', 'user', value.revision);
  return value;
};
