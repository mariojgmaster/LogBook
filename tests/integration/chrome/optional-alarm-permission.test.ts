import { describe, expect, it } from 'vitest';
import { attachAlarmListener, detachAlarmListener } from '@/background/alarms';
import { ChromeAlarmAdapter } from '@/infrastructure/chrome/alarm-adapter';

describe('optional alarms permission', () => {
  it('does not crash while the alarms namespace is unavailable', async () => {
    const listener = () => undefined;
    expect(attachAlarmListener(undefined, listener)).toBe(false);

    const alarms = chrome.alarms;
    delete (chrome as Partial<typeof chrome>).alarms;
    const adapter = new ChromeAlarmAdapter();
    await expect(adapter.hasPermission()).resolves.toBe(false);
    await expect(adapter.list()).resolves.toEqual([]);
    await expect(adapter.cancel('missing')).resolves.toBe(false);
    await expect(
      adapter.schedule({
        slotId: 'slot',
        targetLocalDate: '2026-08-17',
        when: Date.now() + 60_000,
      }),
    ).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
    (chrome as Partial<typeof chrome>).alarms = alarms;
  });

  it('registers the listener once after the namespace becomes available', () => {
    const listener = () => undefined;
    expect(attachAlarmListener(chrome.alarms, listener)).toBe(true);
    expect(attachAlarmListener(chrome.alarms, listener)).toBe(false);
    expect(chrome.alarms.onAlarm.hasListener(listener)).toBe(true);
    detachAlarmListener(chrome.alarms, listener);
    expect(chrome.alarms.onAlarm.hasListener(listener)).toBe(false);
  });
});
