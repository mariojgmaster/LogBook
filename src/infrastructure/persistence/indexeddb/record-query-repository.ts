import type { LogRecordProps } from '@/domain/entities/log-record';
import type {
  RecordFilters,
  RecordPage,
  RecordQueryRepository,
} from '@/application/ports/repositories';
import { getDatabase } from './database';

export class IndexedDbRecordQueryRepository implements RecordQueryRepository {
  async list(start: string, end: string, filters: RecordFilters = {}): Promise<RecordPage> {
    const db = await getDatabase();
    const transaction = db.transaction('records');
    let cursor = await transaction.store.index('by-date').openCursor(IDBKeyRange.bound(start, end));
    const items: LogRecordProps[] = [];
    const projectIds = new Set(filters.projectIds ?? []);
    const normalizedSearch = normalizeSearch(filters.search ?? '');
    const limit = Math.min(Math.max(filters.limit ?? 500, 1), 1_000);
    let passedCursor = !filters.cursor;
    while (cursor && items.length < limit) {
      const record = cursor.value;
      if (!passedCursor) passedCursor = record.id === filters.cursor;
      else if (
        (projectIds.size === 0 || projectIds.has(record.projectId)) &&
        (!normalizedSearch || normalizeSearch(record.details).includes(normalizedSearch))
      )
        items.push(record);
      cursor = await cursor.continue();
    }
    await transaction.done;
    items.sort(
      (a, b) =>
        a.localDate.localeCompare(b.localDate) ||
        a.startMinute - b.startMinute ||
        a.id.localeCompare(b.id),
    );
    const nextCursor = cursor ? items.at(-1)?.id : undefined;
    return nextCursor ? { items, nextCursor } : { items };
  }
}

const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
