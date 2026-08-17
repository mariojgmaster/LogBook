import { AppError } from '@/domain/errors/app-error';
import { LogRecord, type LogRecordProps } from '@/domain/entities/log-record';
import type { RecordRepository } from '@/application/ports/repositories';
import { getDatabase } from './database';

export class IndexedDbLogRecordRepository implements RecordRepository {
  async add(record: LogRecord): Promise<void> {
    try {
      await (await getDatabase()).add('records', { ...record.props });
    } catch (error) {
      throw AppError.fromUnknown(error);
    }
  }
  async get(id: string): Promise<LogRecordProps | undefined> {
    return (await getDatabase()).get('records', id);
  }
  async listByDate(localDate: string): Promise<LogRecordProps[]> {
    return sortRecords(
      await (await getDatabase()).getAllFromIndex('records', 'by-date', localDate),
    );
  }
  async listByProject(projectId: string): Promise<LogRecordProps[]> {
    return sortRecords(
      await (await getDatabase()).getAllFromIndex('records', 'by-project', projectId),
    );
  }
  async listRange(start: string, end: string): Promise<LogRecordProps[]> {
    const range = IDBKeyRange.bound(start, end);
    return sortRecords(await (await getDatabase()).getAllFromIndex('records', 'by-date', range));
  }
  async update(record: LogRecord, expectedRevision: number): Promise<void> {
    const tx = (await getDatabase()).transaction('records', 'readwrite');
    const current = await tx.store.get(record.props.id);
    if (!current) throw new AppError('NOT_FOUND');
    if (current.revision !== expectedRevision) throw new AppError('CONFLICT');
    await tx.store.put({ ...record.props });
    await tx.done;
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

const sortRecords = (records: LogRecordProps[]) =>
  records.sort(
    (a, b) =>
      a.localDate.localeCompare(b.localDate) ||
      a.startMinute - b.startMinute ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.id.localeCompare(b.id),
  );
