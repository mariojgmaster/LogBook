import type { LogRecordProps } from '@/domain/entities/log-record';
import { LocalDate } from '@/domain/value-objects/local-date';

export interface MonthProjectionFilters {
  projectIds?: readonly string[];
  search?: string;
}

export interface MonthDaySegment {
  recordId: string;
  logicalRecordId: string;
  projectId: string;
  details: string;
  date: string;
  startMinute: number;
  endMinute: number;
  isEvent: boolean;
}

export interface MonthRangeSegment {
  recordId: string;
  logicalRecordId: string;
  projectId: string;
  details: string;
  startDate: string;
  endDate: string;
  startColumn: number;
  endColumn: number;
  segmentIndex: number;
}

export interface MonthProjection {
  daySegments: MonthDaySegment[];
  rangeSegments: MonthRangeSegment[];
}

export const projectMonthRecords = (
  records: readonly LogRecordProps[],
  period: { start: string; end: string },
  filters: MonthProjectionFilters = {},
): MonthProjection => {
  const start = LocalDate.parse(period.start);
  const end = LocalDate.parse(period.end);
  const projectIds = new Set(filters.projectIds ?? []);
  const search = normalize(filters.search ?? '');
  const filtered = records
    .filter(
      (record) =>
        (projectIds.size === 0 || projectIds.has(record.projectId)) &&
        (!search || normalize(record.details).includes(search)),
    )
    .sort(compareRecords);
  const daySegments = filtered.flatMap((record) => splitRecord(record, start, end));
  const segmentsByRecord = new Map<string, MonthDaySegment[]>();
  for (const segment of daySegments) {
    const values = segmentsByRecord.get(segment.recordId) ?? [];
    values.push(segment);
    segmentsByRecord.set(segment.recordId, values);
  }
  const rangeSegments = filtered.flatMap((record) =>
    groupWeekly(segmentsByRecord.get(record.id) ?? []),
  );
  return { daySegments, rangeSegments };
};

const splitRecord = (
  record: LogRecordProps,
  periodStart: LocalDate,
  periodEnd: LocalDate,
): MonthDaySegment[] => {
  if (record.isEvent) {
    return record.localDate >= periodStart.value && record.localDate <= periodEnd.value
      ? [
          {
            recordId: record.id,
            logicalRecordId: record.id,
            projectId: record.projectId,
            details: record.details,
            date: record.localDate,
            startMinute: 0,
            endMinute: 0,
            isEvent: true,
          },
        ]
      : [];
  }
  const recordEnd = LocalDate.parse(record.endLocalDate ?? record.localDate);
  let cursor =
    record.localDate < periodStart.value ? periodStart : LocalDate.parse(record.localDate);
  const segments: MonthDaySegment[] = [];
  while (
    cursor.value <= periodEnd.value &&
    (cursor.value < recordEnd.value || (cursor.value === recordEnd.value && record.endMinute > 0))
  ) {
    const startMinute = cursor.value === record.localDate ? record.startMinute : 0;
    const endMinute = cursor.value === recordEnd.value ? record.endMinute : 1440;
    if (endMinute > startMinute) {
      segments.push({
        recordId: record.id,
        logicalRecordId: record.id,
        projectId: record.projectId,
        details: record.details,
        date: cursor.value,
        startMinute,
        endMinute,
        isEvent: false,
      });
    }
    cursor = cursor.addDays(1);
  }
  return segments;
};

const groupWeekly = (segments: readonly MonthDaySegment[]): MonthRangeSegment[] => {
  if (segments.length === 0) return [];
  const ranges: MonthRangeSegment[] = [];
  let first = segments[0]!;
  let last = first;
  const commit = () => {
    ranges.push({
      recordId: first.recordId,
      logicalRecordId: first.logicalRecordId,
      projectId: first.projectId,
      details: first.details,
      startDate: first.date,
      endDate: last.date,
      startColumn: LocalDate.parse(first.date).dayOfWeek(),
      endColumn: LocalDate.parse(last.date).dayOfWeek() + 1,
      segmentIndex: ranges.length,
    });
  };
  for (const segment of segments.slice(1)) {
    const isNextDay = LocalDate.parse(last.date).addDays(1).value === segment.date;
    if (!isNextDay || LocalDate.parse(segment.date).dayOfWeek() === 0) {
      commit();
      first = segment;
    }
    last = segment;
  }
  commit();
  return ranges;
};

const compareRecords = (left: LogRecordProps, right: LogRecordProps) =>
  left.localDate.localeCompare(right.localDate) ||
  Number(right.isEvent) - Number(left.isEvent) ||
  left.startMinute - right.startMinute ||
  left.createdAt.localeCompare(right.createdAt) ||
  left.id.localeCompare(right.id);

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
