import { describe, expect, it } from 'vitest';
import { classifyHours } from '@/domain/services/hour-classifier';
import type { LogRecordProps } from '@/domain/entities/log-record';
const record = (
  id: string,
  date: string,
  start: number,
  duration: number,
  projectId = 'p1',
): LogRecordProps => ({
  id,
  projectId,
  localDate: date,
  startMinute: start,
  endMinute: start + duration,
  durationMinutes: duration,
  details: 'x',
  revision: 1,
  createdAt: `2026-01-01T00:00:0${id}.000Z`,
  updatedAt: '2026-01-01T00:00:00.000Z',
});
describe('hour classifier', () => {
  it('splits the eighth hour deterministically across projects', () => {
    const result = classifyHours(
      [record('1', '2026-08-17', 480, 300), record('2', '2026-08-17', 480, 300, 'p2')],
      { isHoliday: () => false },
    );
    expect(result).toMatchObject({ regular: 480, overtime50: 120, overtime100: 0, total: 600 });
    expect(result.byProject.p1?.regular).toBe(300);
    expect(result.byProject.p2?.regular).toBe(180);
  });
  it('classifies Saturday at 50% and Sunday/holiday at 100%', () => {
    expect(
      classifyHours([record('1', '2026-08-22', 480, 60)], { isHoliday: () => false }).overtime50,
    ).toBe(60);
    expect(
      classifyHours([record('1', '2026-08-23', 480, 60)], { isHoliday: () => false }).overtime100,
    ).toBe(60);
    expect(
      classifyHours([record('1', '2026-08-17', 480, 60)], { isHoliday: () => true }).overtime100,
    ).toBe(60);
  });
  it('does not add the lunch interval back into accountable totals', () => {
    const withLunch = {
      ...record('1', '2026-08-17', 660, 420),
      endMinute: 1080,
      durationMinutes: 360,
      withoutLunchBreak: false,
    };
    expect(classifyHours([withLunch], { isHoliday: () => false }).total).toBe(360);
  });
  it('marks totals unavailable outside catalog coverage', () =>
    expect(
      classifyHours([record('1', '2030-01-01', 480, 60)], { isHoliday: () => undefined }).available,
    ).toBe(false));
});
