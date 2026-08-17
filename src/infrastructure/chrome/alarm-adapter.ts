import type { AlarmPort } from '@/application/ports/platform';
import type { ReminderOccurrence } from '@/domain/entities/reminder-schedule';
import { AppError } from '@/domain/errors/app-error';

export const ALARM_PREFIX = 'logbook:reminder:';

export const encodeAlarmName = (occurrence: ReminderOccurrence): string =>
  `${ALARM_PREFIX}${btoa(JSON.stringify(occurrence)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')}`;

export const decodeAlarmName = (name: string): ReminderOccurrence | undefined => {
  if (!name.startsWith(ALARM_PREFIX)) return undefined;
  try {
    const encoded = name.slice(ALARM_PREFIX.length).replaceAll('-', '+').replaceAll('_', '/');
    const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=');
    const value = JSON.parse(atob(padded)) as ReminderOccurrence;
    if (!value.slotId || !value.targetLocalDate || !Number.isFinite(value.when)) return undefined;
    return value;
  } catch {
    return undefined;
  }
};

export class ChromeAlarmAdapter implements AlarmPort {
  async hasPermission(): Promise<boolean> {
    if (!chrome.alarms) return false;
    return chrome.permissions.contains({ permissions: ['alarms'] });
  }
  requestPermission(): Promise<boolean> {
    return chrome.permissions.request({ permissions: ['alarms'] });
  }
  async schedule(occurrence: ReminderOccurrence): Promise<void> {
    if (!chrome.alarms || !(await this.hasPermission())) throw new AppError('PERMISSION_DENIED');
    await chrome.alarms.create(encodeAlarmName(occurrence), { when: occurrence.when });
  }
  cancel(name: string): Promise<boolean> {
    return chrome.alarms?.clear(name) ?? Promise.resolve(false);
  }
  async list() {
    if (!chrome.alarms || !(await this.hasPermission())) return [];
    return (await chrome.alarms.getAll())
      .filter((alarm) => alarm.name.startsWith(ALARM_PREFIX))
      .map((alarm) => ({ name: alarm.name, when: alarm.scheduledTime }));
  }
}
