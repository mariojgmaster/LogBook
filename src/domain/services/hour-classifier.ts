import type { LogRecordProps } from '@/domain/entities/log-record';
import { LocalDate } from '@/domain/value-objects/local-date';

export interface HolidayLookup {
  isHoliday(localDate: string): boolean | undefined;
}
export interface HourBuckets {
  regular: number;
  overtime50: number;
  overtime100: number;
  total: number;
}
export interface ClassifiedRecord extends HourBuckets {
  recordId: string;
  projectId: string;
}
export interface HourSummary extends HourBuckets {
  available: boolean;
  records: ClassifiedRecord[];
  byProject: Record<string, HourBuckets>;
}

const empty = (): HourBuckets => ({ regular: 0, overtime50: 0, overtime100: 0, total: 0 });

export const classifyHours = (
  records: readonly LogRecordProps[],
  holidays: HolidayLookup,
): HourSummary => {
  const result: HourSummary = { ...empty(), available: true, records: [], byProject: {} };
  const byDate = new Map<string, LogRecordProps[]>();
  for (const record of records) {
    const values = byDate.get(record.localDate) ?? [];
    values.push(record);
    byDate.set(record.localDate, values);
  }
  for (const [dateValue, dayRecords] of byDate) {
    const holiday = holidays.isHoliday(dateValue);
    if (holiday === undefined) result.available = false;
    const dayOfWeek = LocalDate.parse(dateValue).dayOfWeek();
    let usedRegular = 0;
    const sorted = [...dayRecords].sort(
      (a, b) =>
        a.startMinute - b.startMinute ||
        a.createdAt.localeCompare(b.createdAt) ||
        a.id.localeCompare(b.id),
    );
    for (const record of sorted) {
      const buckets = empty();
      buckets.total = record.durationMinutes;
      if (holiday === true || dayOfWeek === 0) {
        buckets.overtime100 = record.durationMinutes;
      } else if (dayOfWeek === 6) {
        buckets.overtime50 = record.durationMinutes;
      } else {
        buckets.regular = Math.min(record.durationMinutes, Math.max(0, 480 - usedRegular));
        buckets.overtime50 = record.durationMinutes - buckets.regular;
        usedRegular += buckets.regular;
      }
      result.records.push({ ...buckets, recordId: record.id, projectId: record.projectId });
      addBuckets(result, buckets);
      const project = (result.byProject[record.projectId] ??= empty());
      addBuckets(project, buckets);
    }
  }
  return result;
};

const addBuckets = (target: HourBuckets, source: HourBuckets) => {
  target.regular += source.regular;
  target.overtime50 += source.overtime50;
  target.overtime100 += source.overtime100;
  target.total += source.total;
};
