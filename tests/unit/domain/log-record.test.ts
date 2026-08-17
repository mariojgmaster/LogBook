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
  it('requires 1–2000 details and exactly one ending mode', () => {
    expect(() => LogRecord.create({ ...base, details: '', endMinute: 600 })).toThrow();
    expect(() => LogRecord.create({ ...base, endMinute: 600, durationMinutes: 120 })).toThrow();
  });
  it('rejects future starts', () =>
    expect(() => LogRecord.create({ ...base, startMinute: 780, endMinute: 840 })).toThrow());
});
