import type { CompositionRoot } from '@/application/composition-root';
import type { AppRequest } from '@/shared/contracts/messages';
import { broadcastEntityChange } from '../events';
import { ReminderSchedule } from '@/domain/entities/reminder-schedule';

type Request = Extract<
  AppRequest,
  {
    type:
      | 'settings.get'
      | 'settings.updateRegion'
      | 'settings.updateMonthView'
      | 'settings.updateReminderSound'
      | 'holiday.coverage'
      | 'holiday.listPeriod';
  }
>;
export const handleSettingsRequest = async (request: Request, root: CompositionRoot) => {
  await root.holidays.initialize();
  if (request.type === 'holiday.coverage') return root.holidays.getCoverage();
  if (request.type === 'holiday.listPeriod') {
    const user = await root.repositories.settings.getUserSettings();
    if (user.region) await root.holidays.setRegion(user.region);
    return root.holidays.listApplicable(request.payload.start, request.payload.end) ?? [];
  }
  if (request.type === 'settings.get') {
    const user = await root.repositories.settings.getUserSettings();
    const reminders = await root.repositories.settings.getReminderSchedule();
    if (user.region) await root.holidays.setRegion(user.region);
    return {
      user,
      reminders,
      nextOccurrence: ReminderSchedule.create(reminders).nextOccurrences(root.clock.now(), 1)[0],
      coverage: root.holidays.getCoverage(),
      permission: await root.permissions.contains(['alarms']),
    };
  }
  if (request.type === 'settings.updateReminderSound') {
    const value = await root.updateReminderSound.execute(
      request.payload.soundId,
      request.payload.expectedRevision,
    );
    broadcastEntityChange('preferences', 'reminder-sound', value.revision);
    return value;
  }
  if (request.type === 'settings.updateMonthView') {
    const value = await root.updateMonthView.execute(
      request.payload.mode,
      request.payload.expectedRevision,
    );
    broadcastEntityChange('preferences', 'month-view', value.revision);
    return value;
  }
  const value = await root.updateRegion.execute(
    { uf: request.payload.uf, municipalityCode: request.payload.municipalityCode },
    request.payload.expectedRevision,
    request.payload.confirmed,
  );
  broadcastEntityChange('settings', 'user', value.revision);
  return value;
};
