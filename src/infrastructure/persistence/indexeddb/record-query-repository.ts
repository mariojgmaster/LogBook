import { LogRecord, type LogRecordProps } from '@/domain/entities/log-record';
import { LocalDate } from '@/domain/value-objects/local-date';
import type {
  RecordFilters,
  RecordPage,
  RecordQueryRepository,
} from '@/application/ports/repositories';
import { getDatabase } from './database';

export class IndexedDbRecordQueryRepository implements RecordQueryRepository {
  async list(start: string, end: string, filters: RecordFilters = {}): Promise<RecordPage> {
    const startDate = LocalDate.parse(start);
    const endDate = LocalDate.parse(end);
    const lookupStart = startDate.addDays(-1).value;
    const transaction = (await getDatabase()).transaction('records');
    const persisted = await transaction.store
      .index('by-date')
      .getAll(IDBKeyRange.bound(lookupStart, endDate.value));
    await transaction.done;

    const projectIds = new Set(filters.projectIds ?? []);
    const normalizedSearch = normalizeSearch(filters.search ?? '');
    const limit = Math.min(Math.max(filters.limit ?? 500, 1), 1_000);
    const periodStart = civilMinute(startDate.value, 0);
    const periodEnd = civilMinute(endDate.addDays(1).value, 0);
    const intersecting = persisted
      .map((value) => LogRecord.restore(value).props)
      .filter(
        (record) =>
          (record.isEvent
            ? record.localDate >= startDate.value && record.localDate <= endDate.value
            : civilMinute(record.endLocalDate!, record.endMinute) > periodStart &&
              civilMinute(record.localDate, record.startMinute) < periodEnd) &&
          (projectIds.size === 0 || projectIds.has(record.projectId)) &&
          (!normalizedSearch || normalizeSearch(record.details).includes(normalizedSearch)),
      )
      .sort(compareRecords);

    const cursorIndex = filters.cursor
      ? intersecting.findIndex((record) => record.id === filters.cursor) + 1
      : 0;
    const startIndex = Math.max(cursorIndex, 0);
    const items = intersecting.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + items.length < intersecting.length;
    return hasMore ? { items, nextCursor: items.at(-1)?.id } : { items };
  }
}

const civilMinute = (date: string, minute: number): number => {
  const [year, month, day] = LocalDate.parse(date).parts();
  return Date.UTC(year, month - 1, day) / 60_000 + minute;
};

const compareRecords = (left: LogRecordProps, right: LogRecordProps) =>
  left.localDate.localeCompare(right.localDate) ||
  Number(right.isEvent) - Number(left.isEvent) ||
  left.startMinute - right.startMinute ||
  left.createdAt.localeCompare(right.createdAt) ||
  left.id.localeCompare(right.id);

const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
