import { describe, expect, it } from 'vitest';
import { LogRecord } from '@/domain/entities/log-record';
const base = {
  id: crypto.randomUUID(),
  projectId: crypto.randomUUID(),
  localDate: '2026-08-17',
  startMinute: 480,
  details: 'Implementação',
  now: new Date(2026, 7, 17, 12),
};
describe('LogRecord', () => {
  it('accepts equivalent end or duration inputs', () => {
    expect(LogRecord.create({ ...base, endMinute: 600 }).props.durationMinutes).toBe(120);
    expect(LogRecord.create({ ...base, durationMinutes: 120 }).props.endMinute).toBe(600);
  });
  it('keeps the full end time while deducting lunch from accountable duration', () => {
    const withLunch = LogRecord.create({
      ...base,
      startMinute: 660,
      durationMinutes: 360,
      withoutLunchBreak: false,
    });
    expect(withLunch.props).toMatchObject({
      endMinute: 1080,
      durationMinutes: 360,
      withoutLunchBreak: false,
    });

    const withoutLunch = LogRecord.create({
      ...base,
      startMinute: 660,
      durationMinutes: 420,
      withoutLunchBreak: true,
    });
    expect(withoutLunch.props).toMatchObject({
      endMinute: 1080,
      durationMinutes: 420,
      withoutLunchBreak: true,
    });

    expect(
      LogRecord.create({
        ...base,
        startMinute: 660,
        endMinute: 1080,
        withoutLunchBreak: false,
      }).props.durationMinutes,
    ).toBe(360);
  });
  it('requires 1–2000 details and exactly one ending mode', () => {
    expect(() => LogRecord.create({ ...base, details: '', endMinute: 600 })).toThrow();
    expect(() => LogRecord.create({ ...base, endMinute: 600, durationMinutes: 120 })).toThrow();
  });
  it('creates informational events without accountable time', () => {
    const event = LogRecord.create({
      id: base.id,
      projectId: base.projectId,
      localDate: base.localDate,
      isEvent: true,
      details: 'Reunião geral',
      now: base.now,
    });
    expect(event.props).toMatchObject({
      isEvent: true,
      startMinute: 0,
      endMinute: 0,
      durationMinutes: 0,
      endLocalDate: base.localDate,
    });
    expect(LogRecord.restore(event.props).props).toEqual(event.props);
  });
  it('rejects future starts', () =>
    expect(() => LogRecord.create({ ...base, startMinute: 780, endMinute: 840 })).toThrow());
});
