import { describe, expect, it } from 'vitest';
import { LogRecord } from '@/domain/entities/log-record';
import { IndexedDbLogRecordRepository } from '@/infrastructure/persistence/indexeddb/log-record-repository';
import { IndexedDbRecordQueryRepository } from '@/infrastructure/persistence/indexeddb/record-query-repository';
describe('period queries', () => {
  it('intersects project and diacritic-insensitive detail filters', async () => {
    const records = new IndexedDbLogRecordRepository();
    const p1 = crypto.randomUUID(),
      p2 = crypto.randomUUID();
    for (const [projectId, details] of [
      [p1, 'Revisão crítica'],
      [p2, 'Revisão crítica'],
      [p1, 'Implementação'],
    ] as const)
      await records.add(
        LogRecord.create({
          id: crypto.randomUUID(),
          projectId,
          localDate: '2026-08-17',
          startMinute: 480,
          endMinute: 540,
          details,
          now: new Date(2026, 7, 17, 12),
        }),
      );
    const page = await new IndexedDbRecordQueryRepository().list('2026-08-01', '2026-08-31', {
      projectIds: [p1],
      search: 'revisao',
    });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.projectId).toBe(p1);
  });
});
