import type { CompositionRoot } from '@/application/composition-root';
import { decodeAlarmName } from '@/infrastructure/chrome/alarm-adapter';
import { openOrFocusPopupWindow } from './popup-window';

export const handleAlarm = async (alarm: chrome.alarms.Alarm, root: CompositionRoot) => {
  const occurrence = decodeAlarmName(alarm.name);
  if (!occurrence) return;
  if ((await root.repositories.records.listByDate(occurrence.targetLocalDate)).length === 0) {
    await openOrFocusPopupWindow({
      reminder: '1',
      targetLocalDate: occurrence.targetLocalDate,
      slotId: occurrence.slotId,
    });
    const settings = await root.repositories.settings.getUserSettings();
    await root.audio
      .play(settings.reminderSoundId ?? 'gentle-bell', alarm.name)
      .catch(() => undefined);
  }
  await root.reconcileReminders.execute();
};

export const attachAlarmListener = (
  alarms: typeof chrome.alarms | undefined,
  listener: (alarm: chrome.alarms.Alarm) => void,
): boolean => {
  if (!alarms?.onAlarm || alarms.onAlarm.hasListener(listener)) return false;
  alarms.onAlarm.addListener(listener);
  return true;
};

export const detachAlarmListener = (
  alarms: typeof chrome.alarms | undefined,
  listener: (alarm: chrome.alarms.Alarm) => void,
): void => {
  alarms?.onAlarm?.removeListener(listener);
};
