import { describe, expect, it } from 'vitest';
import { LogRecord } from '@/domain/entities/log-record';
import { IndexedDbLogRecordRepository } from '@/infrastructure/persistence/indexeddb/log-record-repository';
const make = (id = crypto.randomUUID()) =>
  LogRecord.create({
    id,
    projectId: crypto.randomUUID(),
    localDate: '2026-08-17',
    startMinute: 480,
    endMinute: 540,
    details: 'x',
    now: new Date(2026, 7, 17, 12),
  });
describe('record repository', () => {
  it('uses add without overwriting and indexes date/project', async () => {
    const repository = new IndexedDbLogRecordRepository();
    const record = make();
    await repository.add(record);
    await expect(repository.add(record)).rejects.toBeTruthy();
    expect(await repository.listByDate('2026-08-17')).toHaveLength(1);
    expect(await repository.listByProject(record.props.projectId)).toHaveLength(1);
  });
});
