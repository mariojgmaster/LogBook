import { describe, expect, it } from 'vitest';
import { LogRecord } from '@/domain/entities/log-record';
import { IndexedDbLogRecordRepository } from '@/infrastructure/persistence/indexeddb/log-record-repository';
describe('v2 record concurrency', () => {
  it('commits valid updates last-write-wins while delete remains compare-and-swap', async () => {
    const repository = new IndexedDbLogRecordRepository();
    const original = LogRecord.create({
      id: crypto.randomUUID(),
      projectId: crypto.randomUUID(),
      localDate: '2026-08-17',
      startMinute: 480,
      endMinute: 540,
      details: 'x',
      now: new Date(2026, 7, 17, 12),
    });
    await repository.add(original);
    const updated = original.update({
      projectId: original.props.projectId,
      localDate: original.props.localDate,
      startMinute: 480,
      endMinute: 600,
      details: 'updated',
      now: new Date(2026, 7, 17, 13),
    });
    const first = await repository.update(updated);
    const secondDraft = original.update({
      projectId: original.props.projectId,
      localDate: original.props.localDate,
      startMinute: 480,
      endMinute: 660,
      details: 'last writer',
      now: new Date(2026, 7, 17, 14),
    });
    const second = await repository.update(secondDraft);
    expect(first.revision).toBe(2);
    expect(second).toMatchObject({ revision: 3, details: 'last writer' });
    await expect(repository.delete(original.props.id, 1)).rejects.toMatchObject({
      code: 'CONFLICT',
    });
    expect((await repository.get(original.props.id))?.revision).toBe(3);
  });
});
