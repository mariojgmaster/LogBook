import { describe, expect, it } from 'vitest';
import { AppError } from '@/domain/errors/app-error';
import { IndexedDbDraftRepository } from '@/infrastructure/persistence/indexeddb/draft-repository';
import {
  buildProjectDraft,
  buildRecordDraft,
  buildSettingsDraft,
  buildSnoozeDraft,
} from '../../fixtures/storage-v2';

describe('IndexedDbDraftRepository', () => {
  it.each([
    buildRecordDraft({ values: { formKind: 'record', details: 'Parcial' } }),
    buildProjectDraft({ values: { formKind: 'project', name: 'Parcial' } }),
    buildSettingsDraft({
      values: { formKind: 'settings', section: 'month-view', fields: { monthViewMode: 'notice' } },
    }),
    buildSnoozeDraft({
      values: { formKind: 'snooze', slotId: 'morning', durationHours: '0,25' },
    }),
  ])('persists and restores a validated draft variant', async (draft) => {
    const repository = new IndexedDbDraftRepository();
    await repository.upsert(draft);
    expect(await repository.get(draft.id)).toEqual(draft);
    await repository.delete(draft.id);
    expect(await repository.get(draft.id)).toBeUndefined();
  });

  it('coalesces concurrent writes and keeps only the latest confirmed snapshot', async () => {
    const repository = new IndexedDbDraftRepository();
    const first = buildProjectDraft({ values: { formKind: 'project', name: 'A' } });
    const latest = buildProjectDraft({
      values: { formKind: 'project', name: 'ABC' },
      updatedAt: '2026-08-17T12:00:01.000Z',
    });
    await Promise.all([repository.upsert(first), repository.upsert(latest)]);
    expect(await repository.get(first.id)).toEqual(latest);
  });

  it('rejects oversized/unknown values and preserves the last confirmed snapshot', async () => {
    const repository = new IndexedDbDraftRepository();
    const confirmed = buildRecordDraft({ values: { formKind: 'record', details: 'Seguro' } });
    await repository.upsert(confirmed);
    await expect(
      repository.upsert(
        buildRecordDraft({ values: { formKind: 'record', details: 'x'.repeat(8_193) } }),
      ),
    ).rejects.toMatchObject({ code: 'DRAFT_UNAVAILABLE' } satisfies Partial<AppError>);
    expect(await repository.get(confirmed.id)).toEqual(confirmed);
  });
});
