import { describe, expect, it } from 'vitest';
import { ChromeAlarmAdapter, decodeAlarmName } from '@/infrastructure/chrome/alarm-adapter';
describe('Chrome reminder alarms', () => {
  it('uses reconstructible names and controlled timestamps', async () => {
    const adapter = new ChromeAlarmAdapter();
    const occurrence = {
      slotId: '2026-08-17@17:30',
      targetLocalDate: '2026-08-17',
      when: new Date(2026, 7, 17, 17, 30).getTime(),
    };
    await adapter.schedule(occurrence);
    const alarms = await adapter.list();
    expect(alarms).toHaveLength(1);
    expect(decodeAlarmName(alarms[0]!.name)).toEqual(occurrence);
    expect(Math.abs(alarms[0]!.when - occurrence.when)).toBeLessThanOrEqual(5 * 60_000);
  });
  it('fails safely when permission is denied', async () => {
    (chrome as any).permissions.setAllowed(false);
    await expect(
      new ChromeAlarmAdapter().schedule({
        slotId: 'x',
        targetLocalDate: '2026-08-17',
        when: Date.now() + 60_000,
      }),
    ).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
  });
});
