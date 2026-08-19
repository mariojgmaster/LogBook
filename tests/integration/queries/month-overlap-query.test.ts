import { describe, expect, it } from 'vitest';
import { LogRecord } from '@/domain/entities/log-record';
import { IndexedDbLogRecordRepository } from '@/infrastructure/persistence/indexeddb/log-record-repository';
import { IndexedDbRecordQueryRepository } from '@/infrastructure/persistence/indexeddb/record-query-repository';
import { ListRecordsByPeriod } from '@/application/queries/list-records-by-period';

describe('month overlap query', () => {
  it('uses one-day lookback, semi-open overlap, stable order and filters', async () => {
    const records = new IndexedDbLogRecordRepository();
    const projectId = crypto.randomUUID();
    const add = async (input: Parameters<typeof LogRecord.create>[0]) => {
      const value = LogRecord.create(input);
      await records.add(value);
      return value.props;
    };
    const overnight = await add({
      id: crypto.randomUUID(),
      projectId,
      localDate: '2026-05-31',
      endLocalDate: '2026-06-01',
      startMinute: 1380,
      endMinute: 60,
      details: 'Revisão noturna',
      now: new Date(2026, 5, 1, 12),
    });
    await add({
      id: crypto.randomUUID(),
      projectId,
      localDate: '2026-05-31',
      endLocalDate: '2026-06-01',
      startMinute: 1320,
      endMinute: 0,
      details: 'Termina na meia-noite',
      now: new Date(2026, 5, 1, 12),
    });
    const morning = await add({
      id: crypto.randomUUID(),
      projectId,
      localDate: '2026-06-01',
      startMinute: 480,
      durationMinutes: 60,
      details: 'Revisão da manhã',
      now: new Date(2026, 5, 1, 12),
    });
    const page = await new IndexedDbRecordQueryRepository().list('2026-06-01', '2026-06-30', {
      projectIds: [projectId],
      search: 'revisao',
    });
    expect(page.items.map((item) => item.id)).toEqual([overnight.id, morning.id]);
  });

  it('rejects invalid and oversized month periods before querying', async () => {
    const query = new ListRecordsByPeriod(new IndexedDbRecordQueryRepository());
    expect(() =>
      query.execute({ start: '2026-07-01', end: '2026-06-01', mode: 'month' }),
    ).toThrowError(expect.objectContaining({ code: 'VALIDATION' }));
    expect(() =>
      query.execute({ start: '2026-01-01', end: '2027-01-02', mode: 'month' }),
    ).toThrowError(expect.objectContaining({ code: 'VALIDATION' }));
  });

  it('lists informational events by their civil date', async () => {
    const records = new IndexedDbLogRecordRepository();
    const projectId = crypto.randomUUID();
    const event = LogRecord.create({
      id: crypto.randomUUID(),
      projectId,
      localDate: '2026-06-15',
      isEvent: true,
      details: 'Marco do projeto',
      now: new Date(2026, 5, 1, 12),
    });
    await records.add(event);
    const page = await new IndexedDbRecordQueryRepository().list('2026-06-01', '2026-06-30');
    expect(page.items).toEqual([expect.objectContaining({ id: event.props.id, isEvent: true })]);
  });
});
