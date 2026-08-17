import { describe, expect, it } from 'vitest';
import { LogRecord } from '@/domain/entities/log-record';
import { IndexedDbLogRecordRepository } from '@/infrastructure/persistence/indexeddb/log-record-repository';
describe('optimistic concurrency', () => {
  it('rejects stale update and delete revisions', async () => {
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
    await repository.update(updated, 1);
    await expect(repository.delete(original.props.id, 1)).rejects.toMatchObject({
      code: 'CONFLICT',
    });
    expect((await repository.get(original.props.id))?.revision).toBe(2);
  });
});
