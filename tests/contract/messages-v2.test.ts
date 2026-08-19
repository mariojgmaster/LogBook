import { describe, expect, it } from 'vitest';
import { dispatchMessage } from '@/background/messages';
import { audioRequestSchema, requestSchema, type AppRequest } from '@/shared/contracts/messages';
import type { CompositionRoot } from '@/application/composition-root';
import {
  buildProjectDraft,
  buildRecordDraft,
  buildSettingsDraft,
  buildSnoozeDraft,
} from '../fixtures/storage-v2';

const id = crypto.randomUUID();
const accepts = (request: unknown) => expect(requestSchema.safeParse(request).success).toBe(true);
const rejects = (request: unknown) => expect(requestSchema.safeParse(request).success).toBe(false);

describe('v2 message contracts', () => {
  it('accepts project lifecycle and last-write-wins record updates', () => {
    accepts({ type: 'project.restore', payload: { id, expectedRevision: 2 } });
    accepts({ type: 'project.remove', payload: { id, expectedRevision: 2 } });
    accepts({
      type: 'record.update',
      payload: {
        id,
        record: {
          projectId: id,
          localDate: '2026-08-16',
          startMinute: 1380,
          endLocalDate: '2026-08-17',
          endMinute: 60,
          details: 'Plantão',
        },
      },
    });
    rejects({
      type: 'record.update',
      payload: { id, expectedRevision: 1, record: {} },
    });
  });

  it('accepts events without time and rejects event payloads with accountable duration', () => {
    accepts({
      type: 'record.create',
      payload: {
        projectId: id,
        localDate: '2026-08-18',
        isEvent: true,
        details: 'Evento informativo',
      },
    });
    rejects({
      type: 'record.create',
      payload: {
        projectId: id,
        localDate: '2026-08-18',
        isEvent: true,
        startMinute: 480,
        durationMinutes: 60,
        details: 'Evento inválido',
      },
    });
  });

  it.each([
    buildRecordDraft({ values: { formKind: 'record', details: 'Parcial' } }),
    buildProjectDraft({ values: { formKind: 'project', name: 'Projeto' } }),
    buildSettingsDraft({
      values: { formKind: 'settings', section: 'month-view', fields: { monthViewMode: 'notice' } },
    }),
    buildSnoozeDraft({
      values: { formKind: 'snooze', slotId: 'morning', durationHours: '0,25' },
    }),
  ])('accepts each allowlisted draft variant', (payload) => {
    accepts({ type: 'draft.upsert', payload });
  });

  it('rejects mismatched, unknown and oversized draft values', () => {
    rejects({
      type: 'draft.upsert',
      payload: buildProjectDraft({ values: { formKind: 'record', details: 'x' } }),
    });
    rejects({
      type: 'draft.upsert',
      payload: buildProjectDraft({ values: { formKind: 'project', name: 'x', colorSlot: 1 } }),
    });
    rejects({
      type: 'draft.upsert',
      payload: buildRecordDraft({
        values: { formKind: 'record', details: 'x'.repeat(8_193) },
      }),
    });
  });

  it('allowlists preferences and internal audio messages', () => {
    accepts({
      type: 'settings.updateMonthView',
      payload: { mode: 'eventRange', expectedRevision: 1 },
    });
    accepts({
      type: 'settings.updateReminderSound',
      payload: { soundId: 'gentle-bell', expectedRevision: 1 },
    });
    expect(
      audioRequestSchema.safeParse({
        type: 'audio.play',
        target: 'offscreen',
        payload: { soundId: 'gentle-bell', playbackId: 'occurrence-1' },
      }).success,
    ).toBe(true);
    expect(
      audioRequestSchema.safeParse({
        type: 'audio.play',
        target: 'page',
        payload: { soundId: '../secret.wav', playbackId: 'occurrence-1' },
      }).success,
    ).toBe(false);
  });

  it('accepts bounded holiday period queries and rejects inverted dates', () => {
    accepts({
      type: 'holiday.listPeriod',
      payload: { start: '2026-08-01', end: '2026-08-31' },
    });
    rejects({
      type: 'holiday.listPeriod',
      payload: { start: '2026-08-31', end: '2026-08-01' },
    });
  });

  it('rejects senders outside this extension before dispatch', async () => {
    const response = await dispatchMessage(
      { type: 'settings.get', payload: {} } satisfies AppRequest,
      { id: 'other-extension' },
      {} as CompositionRoot,
    );
    expect(response).toMatchObject({ ok: false, error: { code: 'INVALID_MESSAGE' } });
  });
});
