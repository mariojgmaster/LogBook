import { describe, expect, it } from 'vitest';
import { requestSchema } from '@/shared/contracts/messages';

const id = crypto.randomUUID();

describe('duration message boundary', () => {
  it('keeps finalized records and snooze in integer minutes', () => {
    expect(
      requestSchema.safeParse({
        type: 'record.create',
        payload: {
          projectId: id,
          localDate: '2026-08-17',
          startMinute: 480,
          durationMinutes: 30,
          withoutLunchBreak: false,
          details: 'Atividade',
        },
      }).success,
    ).toBe(true);
    expect(
      requestSchema.safeParse({
        type: 'record.create',
        payload: {
          projectId: id,
          localDate: '2026-08-17',
          startMinute: 480,
          durationHours: '0,5',
          details: 'Atividade',
        },
      }).success,
    ).toBe(false);
    expect(
      requestSchema.safeParse({
        type: 'reminder.snooze',
        payload: { slotId: 'morning', when: 1, targetLocalDate: '2026-08-17', minutes: 30 },
      }).success,
    ).toBe(true);
  });

  it('allows textual hours only in partial UI draft values', () => {
    expect(
      requestSchema.safeParse({
        type: 'draft.upsert',
        payload: {
          id: 'sidepanel:record:create:2026-08-17',
          surface: 'sidepanel',
          formKind: 'record',
          intent: 'create',
          contextKey: '2026-08-17',
          values: { formKind: 'record', durationHours: '0,5', withoutLunchBreak: false },
        },
      }).success,
    ).toBe(true);
  });
});
