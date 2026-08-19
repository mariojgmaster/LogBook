import { AppError } from '@/domain/errors/app-error';
import { LogRecord, type LogRecordProps } from '@/domain/entities/log-record';
import type { RecordRepository } from '@/application/ports/repositories';
import { getDatabase } from './database';
import { LocalDate } from '@/domain/value-objects/local-date';

export class IndexedDbLogRecordRepository implements RecordRepository {
  async add(record: LogRecord): Promise<void> {
    try {
      await (await getDatabase()).add('records', { ...record.props });
    } catch (error) {
      throw AppError.fromUnknown(error);
    }
  }
  async get(id: string): Promise<LogRecordProps | undefined> {
    const value = await (await getDatabase()).get('records', id);
    return value ? LogRecord.restore(value).props : undefined;
  }
  async listByDate(localDate: string): Promise<LogRecordProps[]> {
    return restoreAndSortRecords(
      await (await getDatabase()).getAllFromIndex('records', 'by-date', localDate),
    );
  }
  async listByProject(projectId: string): Promise<LogRecordProps[]> {
    return restoreAndSortRecords(
      await (await getDatabase()).getAllFromIndex('records', 'by-project', projectId),
    );
  }
  async listRange(start: string, end: string): Promise<LogRecordProps[]> {
    const startDate = LocalDate.parse(start);
    const endDate = LocalDate.parse(end);
    const range = IDBKeyRange.bound(startDate.addDays(-1).value, endDate.value);
    const values = restoreAndSortRecords(
      await (await getDatabase()).getAllFromIndex('records', 'by-date', range),
    );
    const periodStart = civilMinute(startDate.value, 0);
    const periodEnd = civilMinute(endDate.addDays(1).value, 0);
    return values.filter((record) =>
      record.isEvent
        ? record.localDate >= startDate.value && record.localDate <= endDate.value
        : civilMinute(record.endLocalDate ?? record.localDate, record.endMinute) > periodStart &&
          civilMinute(record.localDate, record.startMinute) < periodEnd,
    );
  }
  async update(record: LogRecord, expectedRevision?: number): Promise<LogRecordProps> {
    const tx = (await getDatabase()).transaction('records', 'readwrite');
    const current = await tx.store.get(record.props.id);
    if (!current) throw new AppError('NOT_FOUND');
    if (expectedRevision !== undefined && current.revision !== expectedRevision) {
      throw new AppError('CONFLICT');
    }
    const committed = {
      ...record.props,
      revision: current.revision + 1,
      createdAt: current.createdAt,
    };
    await tx.store.put(committed);
    await tx.done;
    return committed;
  }
  async delete(id: string, expectedRevision: number): Promise<void> {
    const tx = (await getDatabase()).transaction('records', 'readwrite');
    const current = await tx.store.get(id);
    if (!current) throw new AppError('NOT_FOUND');
    if (current.revision !== expectedRevision) throw new AppError('CONFLICT');
    await tx.store.delete(id);
    await tx.done;
  }
  async restore(id: string): Promise<LogRecord | undefined> {
    const props = await this.get(id);
    return props ? LogRecord.restore(props) : undefined;
  }
}

const restoreAndSortRecords = (records: LogRecordProps[]) =>
  records
    .map((record) => LogRecord.restore(record).props)
    .sort(
      (a, b) =>
        a.localDate.localeCompare(b.localDate) ||
        Number(b.isEvent) - Number(a.isEvent) ||
        a.startMinute - b.startMinute ||
        a.createdAt.localeCompare(b.createdAt) ||
        a.id.localeCompare(b.id),
    );

const civilMinute = (date: string, minute: number): number => {
  const [year, month, day] = LocalDate.parse(date).parts();
  return Date.UTC(year, month - 1, day) / 60_000 + minute;
};
